import * as ts from "typescript";
import {
	parse,
	TSESTree
} from "@typescript-eslint/typescript-estree";
import lodash from "lodash";
import {simpleTraverse} from "./travers";
import fs from "fs";
import {log} from "./utils";
import path from "path";

const defaultOptions = {
	readFile(fname){
		return fs.readFileSync(path.resolve(process.cwd(), fname), "utf-8");
	}
};

export default function run(
	file: string,
	{
		readFile = defaultOptions.readFile
	} = defaultOptions
){

	const basePath = process.cwd();
	let leaveRegistry = new Map();
	let openDefaultClass = false,
			openQuery = false;

	type Ty = {
		name: string
		content: string
		published: boolean
		members: {field: string, type: string}[]
	};

	class TypesRegistery {
		static types = [] as Ty[];
		static findType(name: string){
			return TypesRegistery.types.find(t => t.name === name)!;
		}
	}

	function handleDTS(fileName: string, content: string){
		// if(fileName.endsWith(".js")){
		// 	return;
		// }
		// console.group(fileName)
		// log(content)
		// console.groupEnd();
		simpleTraverse(
			parse(content),
			{
				enter(node, parent){
					if(node.type === "TSTypeAliasDeclaration"){
						// log("type", node)
						if(node.typeAnnotation.type === "TSTypeLiteral"){
							let tname = node.id.name;
							typeFromTypeAnotation(tname + "Type", node.typeAnnotation, "type");
							typeFromTypeAnotation(tname + "Input", node.typeAnnotation, "input");
						} else {
							throw "unsupported typeAnnotation for TSTypeAliasDeclaration";
						}
					} else if (node.type === "ExportDefaultDeclaration") {
						if(file.slice(0, -2).concat("d.ts") === fileName){
							openDefaultClass = true;
							leaveRegistry.set(node, () => openDefaultClass = false);
						}
					} else if (node.type === "PropertyDefinition"){
						if(openDefaultClass){
							if(!("name" in node.key)){
								throw "2kHF907ZmUjL2c40mx";
							}
							typeFromTypeAnotation(node.key.name, node.typeAnnotation!.typeAnnotation!, "type");
						}
					}
					// log(node);
				},
				leave(node, parent){
					let leave = leaveRegistry.get(node);
					if(leave){
						leave();
					}
				}
			}
		);
	}

	function typeFromTypeAnotationWithEmptyCheck(...args: Parameters<typeof typeFromTypeAnotation>){
		let type = typeFromTypeAnotation(...args);
		if(type === "null"){
			return "Any";
		}
		return type;
	}

	function typeFromTypeAnotation(
		typeName: string,
		node: TSESTree.TypeNode,
		gType: "input"|"type",
		published = true
	){
		let res: string;
		if(node.type === "TSUnionType"){
			let types = lodash.uniq( node.types.map(e => typeFromTypeAnotation(typeName, e, gType)).flat() );
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

						let fieldTypeObj;

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
										let argsType = paramsType.typeAnnotation.typeAnnotation;
										/**
										 * here we should take type members and use as args
										 * */
										let _argsType: Ty|undefined;
										if(argsType.type === "TSTypeLiteral"){
											if(argsType.members.length){
												const name = node.key.name + "Input";
												typeFromTypeAnotation(name, paramsType.typeAnnotation.typeAnnotation!, "input", false);
												_argsType = TypesRegistery.findType(name);
											}
										} else if (argsType.type === "TSTypeReference") {
											if(!("name" in argsType.typeName)){
												throw "IB7JQCcPDzXxYQcee7"
											}
											/**
											 * type should always exist
											 * */
											_argsType = TypesRegistery.findType(argsType.typeName.name + "Input");
										}

										/**
										 * append args
										 * */
										if(_argsType){
											const params = _argsType.members.map(member => member.field+ ": " + member.type);
											if(params.length){
												type.content += "(" + params.join(", ") + ")";
											}
										}
									} else {
										log(paramsType, {depth: 10})
										throw "zUBP";
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
							gType
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
			// todo: check this
			if(node.typeName.name === "Promise"){
				if(!node.typeParameters){
					throw "gJjnwG40egNP4Y70Z9x5";
				}
				if(!node.typeParameters.params.length){
					res = "Any!";
				}
				res = typeFromTypeAnotationWithEmptyCheck(typeName, node.typeParameters.params[0], gType);
			} else {
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
			res = node.qualifier.name + lodash.capitalize(gType) + "!" ;
		} else {
			log(node);
			throw "1ujtneIO2LlTiKAqIQTC"
		}
		return res;
	}

	const options: ts.CompilerOptions = {
	  declaration: true,
	  skipLibCheck: true,
	  emitDeclarationOnly: true,
	  strictNullChecks: true,
	};

	// Create a Program with an in-memory emit
	const host = ts.createCompilerHost(options);
	host.writeFile = handleDTS;
	let originalFileExist = host.fileExists;
	host.fileExists = function (filename){
		return true;
		// log(basePath + "/" + filename.slice());
		return originalFileExist(filename);
	}
	host.readFile = readFile;

	const program = ts.createProgram(
		[file],
		options,
		host
	);

	const emitResult = program.emit();

	if(emitResult.emitSkipped){
		log(emitResult);
	}

	// console.log(TypesRegistery.types)

	return TypesRegistery.types
		.filter(type => type.published)
		.map(type => type.content).concat(`scalar Any`).join("\n");
}
