import * as ts from "typescript";
import {
	parse,
	TSESTree
} from "@typescript-eslint/typescript-estree";
import lodash from "lodash";
import {simpleTraverse} from "./travers";
import fs from "fs";
import path from "path";

type DefaultOptions = {
	readFile?: (name: string) => string|undefined,
	fileExists?: (name: string, original: (name: string) => boolean ) => boolean
	types?: string[]
};

type Mod = {
	name,
	main: boolean
	imports,
	exp: {node: TSESTree.ExportDefaultDeclaration|TSESTree.ExportNamedDeclaration}[],
	declars: {node: TSESTree.TSDeclareFunction|TSESTree.TSTypeAliasDeclaration}[]
};

type GraphqlType = {
	name: string
	content: string
	published: boolean
	members: {field: string, type: string}[]
};

export default function transform(
	file: string,
	transformOptions : DefaultOptions = {}
){

	const graph: Mod[] = [];

	class TypesRegistery {
		static types = [] as GraphqlType[];
		static findType(name: string){
			return TypesRegistery.types.find(t => t.name === name)!;
		}
	}

	function handleDTS(fileName: string, content: string){
		// console.group(fileName);
		// console.log(content)
		// console.groupEnd();
		const ast = parse(content);

		ast.body.forEach(mdl => {
			if(
				(mdl.type !== "TSModuleDeclaration") ||
				!mdl.body ||
				(mdl.body.type !== "TSModuleBlock") ||
				!mdl.body.body
			){
				return;
			}
			mdl.body.body.forEach(
				function (exp){
					if(
						!("value" in mdl.id)
					){
						throw "3aihxvAk5qI33F7wsk";
					}
					const value = mdl.id.value;
					let i = graph.findIndex(m => m.name === value);

					if(i === -1){
						i = graph.push({
							name: mdl.id.value,
							imports: [],
							main: file.endsWith(mdl.id.value + ".ts"),
							exp: [],
							declars: [],
						}) - 1;
					}

					let m = graph[i];

					// console.log(exp)
					if(exp.type === "TSDeclareFunction"){
						m.declars.push({
							node: exp
						});
					} else if (exp.type === "ImportDeclaration") {
						exp.specifiers.map(imp => {
							m.imports.push({
								node: imp,
								module: exp.source.value
							});
						});
					} else if (exp.type === "ExportDefaultDeclaration") {
						m.exp.push({node: exp});
					} else if (exp.type === "TSTypeAliasDeclaration"){
						m.declars.push({node: exp});
					} else if(exp.type === "ExportNamedDeclaration"){
						m.exp.push({
							node: exp
						});
					}
				}
			);
		});

		// console.dir(graph, {depth: 10})

		const main = graph.find(mdl => mdl.main);

		if(main){
			let root = main.exp.find(exp => exp.node.type === "ExportDefaultDeclaration");
			if(
				root
				&& ("declaration" in root.node)
				&& root.node.declaration
				&& (root.node.declaration.type === "ClassDeclaration")
			){
				root.node.declaration.body.body.forEach(prop => {
					if(
						!("key" in prop)
						|| !("name" in prop.key)
						|| !("typeAnnotation" in prop)
					){
						return;
					}
					typeFromTypeAnotation(
						prop.key.name,
						prop.typeAnnotation!.typeAnnotation!,
						"type",
						true,
						main
					);
				});
			}
		}
	}

	function typeFromTypeAnotation(
		typeName: string,
		node: TSESTree.TypeNode,
		gType: "input"|"type",
		published: boolean,
		mod: Mod
	){
		let res: string;
		if(node.type === "TSUnionType"){
			let types = lodash.uniq( node.types.map(e => typeFromTypeAnotation(typeName, e, gType, true, mod)).flat() );
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
										let gqlArgsType: GraphqlType|undefined;

										if(tsArgsType.type === "TSTypeLiteral"){
											if(tsArgsType.members.length){
												const expectedTypeName = node.key.name + "Input";
												typeFromTypeAnotation(expectedTypeName, paramsType.typeAnnotation.typeAnnotation!, "input", false, mod);
												gqlArgsType = TypesRegistery.findType(expectedTypeName);
											}
										} else if (tsArgsType.type === "TSTypeReference") {
											if(!("name" in tsArgsType.typeName)){
												throw "IB7JQCcPDzXxYQcee7"
											}
											const resolved = resolveNode(mod, tsArgsType.typeName.name);
											if(resolved.node.type === "TSTypeAliasDeclaration"){
												const expectedTypeName = tsArgsType.typeName.name + "Input";
												typeFromTypeAnotation(
													expectedTypeName,
													resolved.node.typeAnnotation,
													"input",
													false,
													mod
												);
												gqlArgsType = TypesRegistery.findType(expectedTypeName);
											}
										}

										/**
										 * append args
										 * */
										if(gqlArgsType){
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
							true,
							mod
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
			if(node.typeName.name === "Promise"){
				if(!node.typeParameters){
					throw "gJjnwG40egNP4Y70Z9x5";
				}
				if(!node.typeParameters.params.length){
					res = "Any!";
				}
				res = typeFromTypeAnotationWithEmptyCheck(typeName, node.typeParameters.params[0], gType, true, mod);
			} else {
				let declaration = mod.declars
					.find(e => (e.node.type === "TSTypeAliasDeclaration") && (e.node.id!.name === nodeTypeName)) as {node: TSESTree.TSTypeAliasDeclaration};
				let tp : TSESTree.TypeNode;
				if(declaration){
					tp = declaration.node.typeAnnotation;
				} else {
					let exported = resolveNode(mod, node.typeName.name);
					if(!("declaration" in exported.node)){
						throw "iSd2aDp361EGD3upfl";
					}
					let dec = exported.node.declaration!;
					if(dec.type !== "TSTypeAliasDeclaration"){
						throw "mxb7eKyT3L05Y"
					}
					tp = dec.typeAnnotation;
				}
				let q = typeFromTypeAnotationWithEmptyCheck(
					node.typeName.name + lodash.capitalize(gType),
					tp,
					gType,
					true,
					mod
				);
				res = node.typeName.name + lodash.capitalize(gType) + "!";
			}
		} else if (node.type === "TSLiteralType") {
			// to convert this to enum later
			throw "AA8zMEQhfMCpNkBp"
		} else if (node.type === "TSImportType") {
			if(!node.qualifier){
				throw "nhhdpkO727UM";
			}
			if(!("name" in node.qualifier)){
				throw "PWyRs8UmkFkfstu1lm"
			}
			let importedFrom = graph.find(mod => {
				return mod.name === node.parameter.literal.value;
			})!;
			let resolved = resolveNode(importedFrom, node.qualifier.name);
			let ka = typeFromTypeAnotationWithEmptyCheck(typeName, resolved.node.declaration.typeAnnotation, gType, true, mod);
			res = node.qualifier.name + lodash.capitalize(gType) + "!" ;
		} else if (node.type === "TSTypeQuery") {

			/**
			 * to convert this to a recursive function so it follows the imports up to the main module
			 * */
			if(!("name" in node.exprName)){
				throw "wkiHhL4qxMjkVm";
			}

			const exprName = node.exprName.name;

			let declaration = mod.declars
				.find(e => (e.node.type === "TSDeclareFunction") && (e.node.id!.name === exprName)) as {node: TSESTree.TSDeclareFunction};

			let typeNode: TSESTree.TypeNode;

			if(declaration) {
				typeNode = declaration.node.returnType!.typeAnnotation;
			} else {
				const exported = resolveNode(mod, exprName);
				if(!("declaration" in exported.node)){
					throw "fninKMHznXHwSmlx"
				}
				if(!exported.node.declaration){
					throw "j6WvRbPgpzydg";
				}
				if(exported.node.declaration!.type !== "TSDeclareFunction"){
					throw "3nQgOQ6"
				}
				typeNode = exported.node.declaration!.returnType!.typeAnnotation;
			}

			if(!typeNode){
				throw "ZYqheQEv2JiMq";
			}

			res = typeFromTypeAnotation(
				typeName,
				typeNode,
				"type",
				true,
				mod
			);
		} else {
			// console.log(node);
			throw "1ujtneIO2LlTiKAqIQTC"
		}
		return res;
	}

	function resolveNode(mod: Mod, exprName: string): Mod["exp"][number]|Mod["declars"][number]{

		const declared = mod.declars.find(e => {
			if(!e.node.id){
				return false;
			}
			if(!("name" in e.node.id)){
				return false;
			}
			return e.node.id.name === exprName;
		});

		if(declared){
			return declared;
		}

		const imported = mod.exp.find(e => {
			if(!("declaration" in e.node)){
				throw "yZfITZvinbq"
			}
			if(!e.node.declaration){
				throw "xKCP4Rzvxv5ur"
			}
			if(!("id" in e.node.declaration)){
				throw "pIvqx5kX5Mzf9uKr"
			}
			if(!e.node.declaration!.id){
				return false;
				// throw "j22C"
			}
			if(!("name" in e.node.declaration.id)){
				throw "nBJA"
			}
			return e.node.declaration.id.name === exprName;
		});


		if(imported){
			return imported;
		}

		let req = mod.imports.find(e => e.node.local.name === exprName);

		let reqModule = graph.find(m => m.name === req.module)!;

		return resolveNode(reqModule, req.node.imported.name);
	}

	function typeFromTypeAnotationWithEmptyCheck(...args: Parameters<typeof typeFromTypeAnotation>){
		let type = typeFromTypeAnotation(...args);
		if(type === "null"){
			return "Any";
		}
		return type;
	}

	const options: ts.CompilerOptions = {
	  declaration: true,
	  skipLibCheck: true,
	  emitDeclarationOnly: true,
	  strictNullChecks: true,
	  outFile: "out.ts",
	  types: transformOptions.types,
	  // traceResolution: true
	};

	// Create a Program with an in-memory emit
	const host = ts.createCompilerHost(options);
	host.writeFile = handleDTS;
	if(transformOptions.readFile){
		host.readFile = transformOptions.readFile;
	}
	if(transformOptions.fileExists){
		const original = host.fileExists;
		host.fileExists = (name) => {
			return transformOptions.fileExists!(name, original);
		};
	}

	const program = ts.createProgram(
		[file],
		options,
		host
	);

	const emitResult = program.emit();

	if(emitResult.emitSkipped){
		console.error(emitResult);
	}

	// console.log(TypesRegistery.types)

	return TypesRegistery.types
		.filter(type => type.published)
		.map(type => type.content).concat(`scalar Any`).join("\n");
}
