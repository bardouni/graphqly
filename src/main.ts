import * as ts from "typescript";
import {
	parse,
	TSESTree
} from "@typescript-eslint/typescript-estree";
import lodash from "lodash";
import {simpleTraverse} from "./travers";
import fs from "fs";
import {log} from "./utils";

const defaultOptions = {
	readFile(fname){
		return fs.readFileSync(fname, "utf-8");
	}
};

export default function run(
	file: string,
	{
		readFile = defaultOptions.readFile
	} = defaultOptions
){

	const basePath = process.cwd();
	let out = `scalar Any`;
	let leaveRegistry = new Map();
	let openDefaultClass = false,
			openQuery = false;

	class TypesRegistery {
		static types = [] as {
			name: string,
			content: string,
			members: {field: string, type: string}[]
		}[];

		static typeFromLiteral(typeName: string, node: TSESTree.TSTypeLiteral, gType: "input"|"type"){

			let type = TypesRegistery.types.find(t => t.name === typeName);
			if(type){
				return type;
			}

			let ndx = TypesRegistery.types.push({
				name: typeName,
				content: gType + " "+ typeName + " {",
				members: []
			}) - 1;

			type = TypesRegistery.types[ndx]!;

			node.members.forEach(
				function (cv){

					if(!("key" in cv)){
						throw "tcGXA2AdwrwOhnPBpZ";
					}
					if(!("name" in cv.key)){
						throw "tcGXA2AdwrwOhnPBpZ";
					}
					if(!("typeAnnotation" in cv)){
						throw "0Nt3XDHQedj1eaOXr6LY";
					}
					if(!cv.typeAnnotation){
						throw "ADMUOgOyrn";
					}

					let fieldType = typeFromTypeAnotation(
						typeName + "__" + cv.key.name + lodash.capitalize(gType),
						cv.typeAnnotation.typeAnnotation,
						gType
					);

					type!.content += "\n\t" + cv.key.name + ": " +  fieldType;

					type!.members.push({
						field: cv.key.name,
						type: fieldType
					});
				}
			);

			type.content += "\n}";

			return type;
		}

		static findType(name: string){
			return TypesRegistery.types.find(t => t.name === name)!;
		}
	}

	function handleDTS(fileName: string, content: string){
		if(fileName.endsWith(".js")){
			return;
		}
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
							if(["Query", "Mutation"].includes(node.key.name)){
								openQuery = true;
								out += "\ntype " + node.key.name + "{";
								leaveRegistry.set(node, () => {
									out += "\n}";
									openQuery = false;
								})
							}
						}
					} else if (node.type === "TSMethodSignature"){
						if(openQuery){
							if(!("name" in node.key)){
								throw "X0z4yp";
							}
							out += "\n\t" + node.key.name;

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
									if(argsType.type === "TSTypeLiteral"){
										if(argsType.members.length){
											if(paramsType.typeAnnotation.typeAnnotation.type === "TSTypeLiteral"){
												if(!("name" in node.key)){
													throw "syxhi";
												}
												const type = TypesRegistery.typeFromLiteral(node.key.name + "Input", paramsType.typeAnnotation.typeAnnotation, "input");
												const params = type.members.map(member => member.field+ ": " + member.type);
												if(params.length){
													out += "(" + params.join(", ") + ")";
												}
											} else {
												throw "2OKALkRn6dHU";
											}
										}
									} else if (argsType.type === "TSAnyKeyword") {
										/**
										 * do nothing
										 * */
									} else if (argsType.type === "TSTypeReference") {
										if(!("name" in argsType.typeName)){
											throw "IB7JQCcPDzXxYQcee7"
										}
										/**
										 * type should always exist
										 * */
										const type = TypesRegistery.findType(argsType.typeName.name + "Input");
										const params = type.members.map(member => member.field + ": " + member.type);
										if(params.length){
											out += "(" + params.join(", ") + ")";
										}
									} else {
										log(argsType);
										throw "krDaV80luhuyPvQg";
									}
								} else {
									log(paramsType, {depth: 10})
									throw "zUBP";
								}
							}

							if(!("name" in node.key)){
								throw "HRxjxhnVgd";
							}

							out += ": " + typeFromTypeAnotation(node.key.name + "Type", node.returnType!.typeAnnotation, "type");
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

	function typeFromTypeAnotation(
		q: string,
		node: TSESTree.TypeNode,
		gType: "input"|"type"
	){
		let res: string;
		if(node.type === "TSUnionType"){
			let types = lodash.uniq( node.types.map(e => typeFromTypeAnotation(q, e, gType)).flat() );
			if(types.length > 2){
				throw "GW6aX84OhSQHFjqUJvUL";
			}
			res = lodash.without(types, "null!")[0].slice(0, -1);
			return res;
		} else if (node.type === "TSStringKeyword"){
			res = "String!";
		} else if (node.type === "TSBooleanKeyword"){
			res = "Boolean!";
		} else if (node.type === "TSNumberKeyword"){
			res = "Float!";
		} else if (node.type === "TSNullKeyword"){
			res = "null!";
		} else if (node.type === "TSVoidKeyword"){
			res = "Any!";
		} else if (node.type === "TSUndefinedKeyword"){
			res = "Any!";
		} else if (node.type === "TSAnyKeyword"){
			res = "Any!";
		} else if (node.type === "TSTypeLiteral"){
			TypesRegistery.typeFromLiteral(q, node, gType)
			res = q + "!";
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
				res = typeFromTypeAnotation(
					q,
					node.typeParameters.params[0],
					gType
				);
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

	return TypesRegistery.types.map(type => type.content).concat(out).join("\n");

}
