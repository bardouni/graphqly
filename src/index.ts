import { Extractor, ExtractorConfig } from "@microsoft/api-extractor";
import {
	parse,
	TSESTree
} from "@typescript-eslint/typescript-estree";
import fs from "fs";
import lodash from "lodash";
import path from "path";

type Opts = {
	definition: string
	package: string
	tsconfig: string
}

export default function transform(opts: Opts){

	const cwd = process.cwd();
	let ast: ReturnType<typeof parse> = undefined as any;

	class TypesRegistery {
		static types = [] as GraphqlType[];
		static findType(name: string){
			return TypesRegistery.types.find(t => t.name === name)!;
		}
	}

	function handleDTS(fileName: string, content: string){
		// console.group("Out");
		// console.log(content)
		// console.groupEnd();

		ast = parse(content);

		ast.body.forEach(exp => {
			if(
				(exp.type === "ClassDeclaration") &&
				exp.id &&
				(exp.id.name === "Root")
			){
				exp.body.body.forEach(prop => {
					if(
						!("key" in prop)
						|| !("name" in prop.key)
						|| !("typeAnnotation" in prop) 
						|| !prop.typeAnnotation 
					){
						return;
					}
					if(["Query", "Mutation"].includes(prop.key.name)){
						typeFromTypeAnotation(
							prop.key.name,
							prop.typeAnnotation!.typeAnnotation!,
							"type",
							true,
						);
					}
				})
			}
		})
	}

	function typeFromTypeAnotation(
		typeName: string,
		node: TSESTree.TypeNode|TSESTree.ClassDeclaration,
		gType: "input"|"type",
		published: boolean
	){
		let res: string;
		if(node.type === "TSUnionType"){
			let types = lodash.uniq( node.types.map(e => typeFromTypeAnotation(typeName, e, gType, true)).flat() );
			if(types.length > 2){
				throw "GW6aX84OhSQHFjqUJvUL";
			}
			if(types.length === 1 && types.includes("null")){
				return "Any";
			}
			res = lodash.without(types, "null")[0].slice(0, -1);
		} else if (node.type === "TSStringKeyword"){
			res = "String!";
		} else if (node.type === "TSBooleanKeyword"){
			res = "Boolean!";
		} else if (node.type === "TSNumberKeyword"){
			res = "Float!";
		} else if (node.type === "TSNullKeyword"){
			res = "null";
		} else if (node.type === "TSVoidKeyword"){
			res = "null";
		} else if (node.type === "TSUndefinedKeyword"){
			res = "null";
		} else if (node.type === "TSAnyKeyword"){
			res = "Any!";
		} else if (node.type === "TSTypeLiteral"){
				
			if(!TypesRegistery.types.some(t => t.name === typeName)){
				const ndx = TypesRegistery.types.push({
					name: typeName,
					content: gType + " "+ typeName + " {",
					published,
					members: []
				}) - 1;
				const type = TypesRegistery.types[ndx]!;
				node.members.forEach(
					function (node){

						if(!("key" in node)){
							throw "tcGXA2AdwrwOhnPBpZ";
						}
						if(!("name" in node.key)){
							throw "tcGXA2AdwrwOhnPBpZ";
						}

						let fieldTypeObj: TSESTree.TypeNode;

						type.content += "\n\t" + node.key.name;

						if(node.type === "TSMethodSignature"){

							if(!("name" in node.key)){
								throw "X0z4yp";
							}

							/**
							 * Don't include params in input types
							 * */

							if(gType === "type"){
								/**
								 * handle params
								 * */
								let params = node.params;

								if(params.length >= 1){
									let firstType = node.params[0];
									/**
									 * basic types are not supported
									 * only objects here
									 * */
									if(
										(firstType.type === "Identifier") &&
										(firstType.name === "this")
									){
										params = params.slice(1);
									}
								}

								if(params.length >= 1){
									let paramsType = params[0];
									if(paramsType.type === "Identifier"){
										if(!paramsType.typeAnnotation){
											throw "Sj696owBXJ";
										}
										let tsArgsType = paramsType.typeAnnotation.typeAnnotation;
										/**
										 * here we should take type members and use as args
										 * */
										let ts: TSESTree.TypeNode|TSESTree.ClassDeclaration|undefined;
										let expectedTypeName: string|undefined;

										if(tsArgsType.type === "TSTypeLiteral"){
											if(tsArgsType.members.length){
												expectedTypeName = node.key.name + "Input";
												ts = paramsType.typeAnnotation.typeAnnotation!
											}
										} else if (tsArgsType.type === "TSTypeReference") {
											if(!("name" in tsArgsType.typeName)){
												throw "IB7JQCcPDzXxYQcee7"
											}
											[ts] = resolveNode(tsArgsType.typeName.name);
											expectedTypeName = tsArgsType.typeName.name + "Input";
										}

										/**
										 * append args
										 * */
										if(ts && expectedTypeName){
											typeFromTypeAnotation(expectedTypeName, ts, "input", false);
											const gqlArgsType = TypesRegistery.findType(expectedTypeName);
											const params = gqlArgsType.members.map(member => member.field+ ": " + member.type);
											if(params.length){
												type.content += "(" + params.join(", ") + ")";
											}
										}
									}
								}

							}

							fieldTypeObj = node.returnType!.typeAnnotation;
						} else {

							if(!("typeAnnotation" in node)){
								throw "0Nt3XDHQedj1eaOXr6LY";
							}

							if(!node.typeAnnotation){
								throw "ADMUOgOyrn";
							}

							fieldTypeObj = node.typeAnnotation.typeAnnotation;
						}
						
						const fieldType = typeFromTypeAnotationWithEmptyCheck(
							typeName + "__" + node.key.name + lodash.capitalize(gType),
							fieldTypeObj,
							gType,
							true
						);

						type.content += ": " +  fieldType;
						
						type.members.push({
							field: node.key.name,
							type: fieldType
						});

					}
				);
				type.content += "\n}";
			}

			res = typeName + "!";
		} else if (node.type === "TSTypeReference"){
			if(!("name" in node.typeName)){
				throw "k1Xgh88"
			}
			const nodeTypeName = node.typeName.name;
			// todo: check this
			if(nodeTypeName === "Promise"){
				if(
					!node.typeParameters ||
					!node.typeParameters.params.length
				){
					res = "Any!";
				} else {
					res = typeFromTypeAnotationWithEmptyCheck(
						typeName,
						node.typeParameters.params[0],
						gType,
						true
					);
				}
			} else {
				let resolved = resolveNode(nodeTypeName);
				let q = typeFromTypeAnotationWithEmptyCheck(
					nodeTypeName + lodash.capitalize(gType),
					resolved[0],
					gType,
					true
				);
				res = nodeTypeName + lodash.capitalize(gType) + "!";
			}
		} else if (node.type === "TSLiteralType") {
			// to convert this to enum later
			throw "AA8zMEQhfMCpNkBp"
		} else if (node.type === "TSTypeQuery") {

			if(!("name" in node.exprName)){
				throw "wkiHhL4qxMjkVm";
			}

			const resolved = resolveNode(node.exprName.name);

			res = typeFromTypeAnotation(
				typeName,
				resolved[0],
				"type",
				true
			);
		} else if (node.type === "TSArrayType") {
			res = "[" + typeFromTypeAnotationWithEmptyCheck(
				typeName,
				node.elementType,
				"type",
				true
			) + "]!";
		} else if (node.type === "TSFunctionType") {
			res = typeFromTypeAnotation(
				typeName,
				node.returnType!.typeAnnotation,
				gType,
				published
			)
		} else if (node.type === "ClassDeclaration") {

			let foundType = TypesRegistery.types.find(t => t.name === typeName);

			if(!foundType){
				
				let ndx = TypesRegistery.types.push({
					name: typeName,
					content: gType + " "+ typeName + " {",
					published,
					members: []
				}) - 1;

				let type = TypesRegistery.types[ndx]!;

				node.body.body.forEach(
					function (node){

						if(!("key" in node)){
							throw "tcGXA2AdwrwOhnPBpZ";
						}
						if(!("name" in node.key)){
							throw "tcGXA2AdwrwOhnPBpZ";
						}

						let fieldTypeObj: TSESTree.TypeNode|undefined = undefined;

						type.content += "\n\t" + node.key.name;

						if(node.type === "PropertyDefinition"){
							fieldTypeObj = node.typeAnnotation!.typeAnnotation;
						} else if (node.type === "MethodDefinition") {
							if(node.value.returnType){
								fieldTypeObj = node.value.returnType.typeAnnotation;
							}
						} else {
							throw "cuzO";
						}

						if(fieldTypeObj){
							const fieldType = typeFromTypeAnotationWithEmptyCheck(
								typeName + "__" + node.key.name + lodash.capitalize(gType),
								fieldTypeObj,
								gType,
								true
							);

							type.content += ": " +  fieldType;

							type.members.push({
								field: node.key.name,
								type: fieldType
							});
						}

					}
				);

				type.content += "\n}";
			}

			res = typeName + "!";
		} else {
			console.dir(node, {depth: 10});
			throw "1ujtneIO2LlTiKAqIQTC"
		}
		return res;
	}

	function resolveNode(exprName: string): [TSESTree.TypeNode|TSESTree.ClassDeclaration]{

		for(let i in ast.body){
			const item = ast.body[i];
			if(item.type === "ExportNamedDeclaration"){
				if(
					item.declaration &&
					("id" in item.declaration) &&
					item.declaration.id &&
					("name" in item.declaration.id) &&
					(item.declaration.id.name === exprName)
				){
					if(!("typeAnnotation" in item.declaration)){
						if(!item.declaration){
							throw "h3Er";
						}
						return [item.declaration];
						// throw "e4kd1fglGhdTmUpy1v";
					}
					return [item.declaration.typeAnnotation];
				}
			} else if(item.type === "TSTypeAliasDeclaration"){
				if(item.id.name === exprName){
					return [item.typeAnnotation];
				}
			} else if(item.type === "TSDeclareFunction"){
				if(
					item.id &&
					(item.id.name === exprName)
				){
					return [item.returnType!.typeAnnotation!];
				}
			} else if (item.type === "ClassDeclaration") {
				if(item.id.name === exprName){
					return [item];
				}
			}
		}

		// console.dir(ast, {depth: 10})
		console.log(exprName)

		throw "BpIcW72oZxNepXS";
	}

	function typeFromTypeAnotationWithEmptyCheck(...args: Parameters<typeof typeFromTypeAnotation>){
		let type = typeFromTypeAnotation(...args);
		if(type === "null"){
			return "Any";
		}
		return type;
	}

	const configObjectFullPath = path.resolve(__dirname, `../../src/api-extractor.json`);
	const packageJsonFullPath = path.resolve(cwd, opts.package);
	const tsconfigFilePath = path.resolve(cwd, opts.tsconfig);

	const extractorConfig = ExtractorConfig.loadFile(configObjectFullPath);
	extractorConfig.mainEntryPointFilePath = path.resolve(cwd, opts.definition);

	extractorConfig.compiler!.tsconfigFilePath = tsconfigFilePath;

	const econfig = ExtractorConfig.prepare({
		configObject: extractorConfig,
		configObjectFullPath: configObjectFullPath,
		packageJsonFullPath: packageJsonFullPath,
	});

	Extractor.invoke(econfig);

	const outFilePath = path.resolve(__dirname, "./../../dist/out.d.ts");

	const content = fs.readFileSync(outFilePath, "utf-8");

	handleDTS("", content);

	fs.unlinkSync(outFilePath);

	return TypesRegistery.types
		.filter(type => type.published)
		.map(type => type.content).concat(`scalar Any`).join("\n");
}

type DefaultOptions = {
	readFile?: (name: string) => string|undefined,
	fileExists?: (name: string, original: (name: string) => boolean ) => boolean
	types?: string[]
};

type GraphqlType = {
	name: string
	content: string
	published: boolean
	members: {field: string, type: string}[]
};