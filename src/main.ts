import * as ts from "typescript";
import {
	parse,
	simpleTraverse,
	TSESTree
} from "@typescript-eslint/typescript-estree";
import lodash from "lodash";

export default function run(files: string[]){

	let out = `scalar Any;\n`;

	function compile(fileNames: string[], options: ts.CompilerOptions): void {
	  // Create a Program with an in-memory emit
	  const files = [];
	  const host = ts.createCompilerHost(options);
	  host.writeFile = function (fileName: string, contents: string){
	  	handleDTS(contents);
	  	// createdFiles[fileName] = contents;
	  }
	  
	  // Prepare and emit the d.ts files
	  const program = ts.createProgram(fileNames, options, host);
	  program.emit();
	}

	function handleDTS(content: string){
		// console.log(content)
		simpleTraverse(
			parse(content),
			{
				enter(node){
					// console.log(node)
					if(node.type === "ExportDefaultDeclaration"){
						if(node.declaration.type === "ClassDeclaration"){
							node.declaration.body.body.forEach(
								item => {
									if(
										(item.type === "PropertyDefinition") &&
										"name" in item.key &&
										["Query", "Mutation"].includes(item.key.name)
									){
										out += "\ntype " + item.key.name + "{";

										const queryType = item.key.name;

										if(!item.typeAnnotation){
											throw "deVZ";
										}

										if(!("members" in item.typeAnnotation.typeAnnotation)){
											throw "Sdjzpbbr7ND268XoTIhq";
										}

										item.typeAnnotation.typeAnnotation.members
										.filter(item => item.type === "TSMethodSignature")
										.forEach((item: TSESTree.TSMethodSignature) => {

											if(!("name" in item.key)){
												throw "Jk6QCTXA10AB";
											}

											const queryKey = item.key.name;

											out += "\n\t" + item.key.name;

											let params = item.params;

											if(params.length >= 2){
												let firstType = item.params[0];
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

															out += "(";

															argsType.members.forEach(
																function (member, index) {
																	if(!("typeAnnotation" in member)){
																		throw "IjmgDxn53PiMi9";
																	}
																	if(!("key" in member)){
																		throw "roMIf6wuendvPBI3JeV4";
																	}
																	if(!("name" in member.key)){
																		throw "roMIf6wuendvPBI3JeV4";
																	}

																	let k = typeFromTypeAnotationParent("--", member.typeAnnotation!.typeAnnotation, "input");

																	if(index > 0){
																		out += ", ";
																	}

																	out += member.key.name + ": " + k;

																}
															);

															out += ")";
														}
													} else if (argsType.type === "TSAnyKeyword") {
														/**
														 * do nothing
														 * */
													} else {
														console.log(argsType);
														throw "krDaV80luhuyPvQg";
													}
												} else {
													console.log(paramsType);
													throw "zUBP";
												}
											}

											out += ": ";

											if(!item.returnType){
												throw "hO2QLKFulgbD";
											}
											
											out += typeFromTypeAnotationParent(
												queryKey + queryType + "Object",
												item.returnType.typeAnnotation,
												"type"
											);

										});

										out += "\n}";
									}
								}
							);
						}
					} else if (node.type === "TSTypeAliasDeclaration") {
						/**
						 * Generate types for both input and object
						 * */
						typeFromTypeAnotationParent(
							node.id.name+ "Input",
							node.typeAnnotation,
							"input"
						);
						typeFromTypeAnotationParent(
							node.id.name+ "Object",
							node.typeAnnotation,
							"type"
						);
					}
				}
			}
		);
	}

	const registredTypes: {[key: string]: string} = {};

	function typeFromTypeAnotationParent(
		q: string,
		node: TSESTree.TypeNode,
		gType: "input"|"type"
	){
		if(node.type === "TSUnionType"){
			let types = lodash.uniq(
				node.types.map(e => typeFromTypeAnotation(q, e, gType)).flat()
			)

			if(types.length > 2){
				throw "GW6aX84OhSQHFjqUJvUL";
			}

			if(types.includes("Any")){
				return "Any";
			}

			return lodash.without(types, "null")[0];
		} else {
			let type = typeFromTypeAnotation(q, node, gType);
			/**
			 * i belive this shouldnt be allowed
			 * */
			if(type === "null"){
				return "Any";
			}

			return type + "!"
		}
	}

	function typeFromTypeAnotation(
		q: string,
		node: TSESTree.TypeNode,
		gType: "input"|"type"
	){
		if(node.type === "TSStringKeyword"){
			return "String";
		} else if(node.type === "TSNumberKeyword"){
			return "Float";
		} else if (node.type === "TSNullKeyword"){
			return "null";
		} else if (node.type === "TSVoidKeyword"){
			return "Any";
		} else if (node.type === "TSUndefinedKeyword"){
			return "Any";
		} else if (node.type === "TSAnyKeyword"){
			return "Any";
		} else if (node.type === "TSTypeLiteral"){
			handleMembers(q, node, gType)
			return q;
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
					return "Any";
				}
				return typeFromTypeAnotation(
					q,
					node.typeParameters.params[0],
					gType
				);
			}
			return node.typeName.name
		}
		console.log(node);
		throw "1ujtneIO2LlTiKAqIQTC"
	}

	function handleMembers(typeName: string, node: TSESTree.TSTypeLiteral, gType: "input"|"type"){

		registredTypes[typeName] = gType + " "+ typeName + " {";

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
				let type = typeFromTypeAnotationParent(typeName + "_" + cv.key.name, cv.typeAnnotation.typeAnnotation, gType);

				registredTypes[typeName] += "\n\t" + cv.key.name + ": " +  type;
			}
		);

		registredTypes[typeName] += "\n}";

	}


	// Run the compiler
	compile(files, {
	  allowJs: true,
	  declaration: true,
	  emitDeclarationOnly: true,
	  strictNullChecks: true,
	  noImplicitReturns: true,
	  esModuleInterop: true,
	  skipLibCheck: true,
	  forceConsistentCasingInFileNames: true,
	  resolveJsonModule: true,
	});

	Object.keys(registredTypes)
		.forEach(key => {
			out = (registredTypes[key] + "\n" + out);
		});

	return out;

}

