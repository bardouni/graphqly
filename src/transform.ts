import * as ts from "typescript";
import {
	parse,
	TSESTree
} from "@typescript-eslint/typescript-estree";
import lodash from "lodash";
import fs from "fs";
import path from "path";
import {Extractor, ExtractorConfig} from "@microsoft/api-extractor";

export default function transform(file: string, packageJsonPath: string){

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
		node: TSESTree.TypeNode,
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
			/**
			 * i belive this should never return true
			 * because TSTypeLiteral is always generated and uniqe to the parentFieldName
			 * */
			let foundType = TypesRegistery.types.find(t => t.name === typeName);

			if(!foundType){
				
				let ndx = TypesRegistery.types.push({
					name: typeName,
					content: gType + " "+ typeName + " {",
					published,
					members: []
				}) - 1;

				let type = TypesRegistery.types[ndx]!;

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

								if(params.length >= 2){
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

								if(params.length >= 2){
									let paramsType = params[1];
									if(paramsType.type === "Identifier"){
										if(!paramsType.typeAnnotation){
											throw "Sj696owBXJ";
										}
										let tsArgsType = paramsType.typeAnnotation.typeAnnotation;
										/**
										 * here we should take type members and use as args
										 * */
										let ts: TSESTree.TypeNode|undefined;
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
			if(!("members" in node.elementType)){
				throw "jU3Y6tE4MDUxG04L";
			}
			// res = "[" + typeFromTypeAnotation(
			// 	typeName,
			// 	node.elementType,
			// 	"type",
			// 	true,
			// 	mod
			// ) + "]!";
			res = "--"
			console.log(res);
		} else if (node.type === "TSFunctionType") {
			res = typeFromTypeAnotation(
				typeName,
				node.returnType!.typeAnnotation,
				gType,
				published
			)
		} else {
			console.dir(node, {depth: 10})
			throw "1ujtneIO2LlTiKAqIQTC"
		}
		// else if (node.type === "TSImportType") {
		// 	if(!node.qualifier){
		// 		throw "nhhdpkO727UM";
		// 	}
		// 	if(!("name" in node.qualifier)){
		// 		throw "PWyRs8UmkFkfstu1lm"
		// 	}
		// 	const importedFrom = graph.find(mod => {
		// 		return mod.name === node.parameter.literal.value;
		// 	})!;
		// 	let resolved = resolveNode(node.qualifier.name);
		// 	let ka = typeFromTypeAnotationWithEmptyCheck(typeName, resolved[0], gType, true);
		// 	res = node.qualifier.name + lodash.capitalize(gType) + "!" ;
		// } 
		return res;
	}

	function resolveNode(exprName: string): [TSESTree.TypeNode]{

		const node = ast.body.find(item => {

			if(item.type === "ExportNamedDeclaration"){
				if(!item.declaration){
					return;
				}
				return item.declaration.id.name === exprName;
			} else if(item.type === "TSTypeAliasDeclaration"){
				return item.id.name === exprName;
			}

			return false;
		})!;

		if(node){
			if(node.type === "TSDeclareFunction"){
				return [node.returnType!.typeAnnotation!];
			} else if (node.type === "ExportNamedDeclaration"){
				return [node.declaration.typeAnnotation];
			} else if (node.type === "TSTypeAliasDeclaration"){
				return [node.typeAnnotation];
			}
		}

		console.dir(ast, {depth: 10})
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
	const packageJsonFullPath = path.resolve(cwd, packageJsonPath);

	const extractorConfig = ExtractorConfig.loadFile(configObjectFullPath);
	extractorConfig.mainEntryPointFilePath = path.resolve(cwd, file);

	const econfig = ExtractorConfig.prepare({
		configObject: extractorConfig,
		configObjectFullPath: configObjectFullPath,
		packageJsonFullPath: packageJsonFullPath,
	});

	Extractor.invoke(econfig);

	const outFilePath = path.resolve(__dirname, "../../dist/out.d.ts");

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