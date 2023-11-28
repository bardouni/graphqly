import fs from "fs";
import * as ts from 'typescript';

function parseCode(code: string) {
  const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.ES2015, false);
  return sourceFile;
}

const acceptedKinds = <const>[
	ts.SyntaxKind.ClassDeclaration,
	ts.SyntaxKind.TypeAliasDeclaration,
	ts.SyntaxKind.TypeLiteral,
	ts.SyntaxKind.TypeReference,
	ts.SyntaxKind.BooleanKeyword,
	ts.SyntaxKind.StringKeyword,
	ts.SyntaxKind.NumberKeyword,
	ts.SyntaxKind.UnionType,
	ts.SyntaxKind.LiteralType,
	ts.SyntaxKind.UndefinedKeyword,
	ts.SyntaxKind.AnyKeyword,
	ts.SyntaxKind.ArrayType,
	ts.SyntaxKind.TypeQuery,
	ts.SyntaxKind.ParenthesizedType,
];

// to fix
type CustomUnknown = any;

type AcType = ts.ClassDeclaration|
	ts.TypeLiteralNode|
	ts.TypeReferenceNode|
	ts.UnionTypeNode|
	ts.LiteralTypeNode|
	ts.ArrayTypeNode|
	ts.TypeAliasDeclaration|
	ts.TypeQueryNode|
	ts.ParenthesizedTypeNode|
	ts.KeywordTypeNode<ts.KeywordTypeSyntaxKind>;

export function handleDTS(
	content: string,
	tsconfigFilePath: string,
	outFilePath: string
){
	
	class TypesRegistery {
		static types = [] as GraphqlType[];
		static interface = [] as string[];
		static findType(name: string){
			return TypesRegistery.types.find(t => t.name === name)!;
		}
	}

	function suffixType(t: GraphqlOperationType){
		if(t === "type"){
			return "";
		}
		return "Input";
	}

	function handleParams(name: string, params: ts.ParameterDeclaration[]|null): Field["params"]{
		if(!params?.length){
			return [];
		}
		if(!params[0].name){
			return [];
		}
		if(
			params[0].name.kind === ts.SyntaxKind.Identifier &&
			params[0].name.escapedText === "this"
		){
			params = params.slice(1);
		}
		if(!params[0].type){
			return [];
		}
		let [type] = getFieldType(name, params[0].type as CustomUnknown, "input", false);
		if(type){
			const graphqlType = TypesRegistery.findType(type.value.slice(0, -1));
			if(graphqlType){
				return graphqlType.fields.map(member => {
					return {
						field: member.field,
						type: member.type.label,
					}
				});
			}
		}
		return [];
	}

	const ast = parseCode(content);

	ast.statements.forEach(statment => {
		if(
			ts.isClassDeclaration(statment) &&
			statment.name
		){
			if(
				["Mutation", "Query", "Subscription"].includes(statment.name.escapedText.toString()) ||
				statment.modifiers?.some(m => {
					return m.kind === ts.SyntaxKind.ExportKeyword;
				})
			){
				getFieldType(
					statment.name.escapedText!,
					statment,
					"type",
					true
				);
			}
		}
	});

	function getFieldType(
		name: string,
		element: AcType|undefined,
		nodeType: GraphqlOperationType,
		published: boolean,
		overrideType?: GraphqlType
	) : [Field["type"], Field["params"]?]|[undefined] {
		if(!element){
			return [undefined];
		}
		if (element.kind === ts.SyntaxKind.ClassDeclaration){
			const graphqlType : GraphqlType = {
				extends: undefined,
				type: nodeType,
				fields: [],
				name,
				content: "",
				published
			};
			TypesRegistery.types.push(graphqlType);
			element.members.forEach(classElement => {
				if(classElement.kind === ts.SyntaxKind.PropertyDeclaration){
					const prop = classElement as ts.PropertyDeclaration;
					if(prop.name.kind !== ts.SyntaxKind.Identifier){
						return;
					}
					let field = prop.name.escapedText.toString();
					let [type, params = []] = getFieldType(name + "__" + field + suffixType(nodeType), prop.type as AcType, nodeType, true);
					if(type){
						graphqlType.fields.push({
							field: field,
							type: type,
							params: params
						});
					}
				} else if (classElement.kind === ts.SyntaxKind.MethodDeclaration) {
					const method = classElement as ts.MethodDeclaration;
					if(method.name.kind !== ts.SyntaxKind.Identifier){
						return;
					}
					const field = method.name.escapedText.toString();
					const [type, prs] = getFieldType(name + "__" + field + suffixType(nodeType), method.type as AcType, nodeType, true);
					const params = handleParams(name + "__" + field + "Input", Array.from(method.parameters));
					if(type){
						graphqlType.fields.push({
							field: field,
							type: type,
							params: params
						});
					}
				} else if(classElement.name) {
					if(classElement.name.kind !== ts.SyntaxKind.Identifier){
						return;
					}
					const field = classElement.name.escapedText.toString();
					graphqlType.fields.push({
						field: field,
						type: {
							label: "Any",
							value: "Any",
						},
						params: []
					});
				}
			});
			if(element.heritageClauses?.[0]){
				const expression = element.heritageClauses[0].types[0].expression as ts.Identifier;
				graphqlType.extends = expression.escapedText.toString();
				if(!TypesRegistery.interface.includes(graphqlType.extends)){
					TypesRegistery.interface.push(graphqlType.extends);
				}
			}
			return [
				{
					value: graphqlType.name + "!",
					label: graphqlType.name + "!",
				}
			];
		} else if (element.kind === ts.SyntaxKind.TypeAliasDeclaration){
			if(acceptedKinds.some(t => t === element.type.kind)){
				const ob : GraphqlType = {
					extends: undefined,
					type: nodeType,
					fields: [],
					name,
					content: "",
					published
				};
				TypesRegistery.types.push(ob);
				let [type] = getFieldType(name, element.type as AcType, nodeType, true, ob);
				if(type && type.isArray){
					ob.published = false;
				}
				return [type];
			}
			return [
				{
					value: "Any",
					label: "Any",
				}
			];
		} else if (element.kind === ts.SyntaxKind.TypeLiteral) {
			let graphqlType : GraphqlType;
			if(overrideType){
				graphqlType = overrideType;
			} else {
				graphqlType = {
					extends: undefined,
					type: nodeType,
					fields: [],
					name: name,
					content: "",
					published
				};
				TypesRegistery.types.push(graphqlType);
			}
			element.members.forEach(function (typeElement){
				if(typeElement.kind === ts.SyntaxKind.MethodSignature){
					let methodSignature = typeElement as ts.MethodSignature;
					if(methodSignature.name.kind !== ts.SyntaxKind.Identifier){
						return;
					}
					const field = methodSignature.name.escapedText.toString();
					const [type, params = []] = getFieldType(graphqlType.name + "__" + field + suffixType(nodeType) , methodSignature.type as AcType, nodeType, true);
					if(type){
						graphqlType.fields.push({
							field: field,
							type: type,
							params: params
						});
					}
				} else if (typeElement.kind === ts.SyntaxKind.PropertySignature){
					let propertySignature = typeElement as ts.PropertySignature;
					if(propertySignature.name.kind !== ts.SyntaxKind.Identifier){
						return;
					}
					const field = propertySignature.name.escapedText.toString();
					const [type, params = []] = getFieldType(graphqlType.name + "__" + field + suffixType(nodeType) , propertySignature.type as AcType, nodeType, true);
					if(type){
						graphqlType.fields.push({
							field: field,
							type: type,
							params: params
						});
					}
				} else if (typeElement.name){
					if(typeElement.name.kind !== ts.SyntaxKind.Identifier){
						return;
					}
					const field = typeElement.name.escapedText.toString();
					graphqlType.fields.push({
						field: field,
						type: {
							label: "Any",
							value: "Any",
						},
						params: []
					});
				}
			});
			return [
				{
					value: name + "!",
					label: name + "!",
				}
			];
		} else if (element.kind === ts.SyntaxKind.TypeReference){
			if(element.typeName.kind === ts.SyntaxKind.Identifier){
				let referenceName = element.typeName.escapedText;
				if(referenceName === "Promise"){
					if(!element.typeArguments){
						return [undefined]
					}
					let [type] = getFieldType(name, element.typeArguments[0] as CustomUnknown, nodeType, true);
					return [type];
				}
				let type = element;
				let old = TypesRegistery.findType(element.typeName.escapedText.toString())
				if(old){
					return [
						{
							value: old.name + "!",
							label: old.name + "!",
						}
					];
				}
				let statment: AcType|undefined = undefined;
				for(let i in ast.statements){
					let j = ast.statements[i];
					if(acceptedKinds.some(t => t === j.kind)){
						let _j = j as AcType;
						if(
							"name" in _j &&
							_j.name &&
							_j.name.kind === ts.SyntaxKind.Identifier &&
							_j.name.escapedText === (type.typeName as ts.Identifier).escapedText
						){
							statment = _j;
							break;
						}
					}
				}
				if(!statment){
					return [undefined];
				}
				// const [type] = addTypeRefWhenMissing(element, nodeType, published);
				let [val] = getFieldType(
					statment.name!.escapedText + suffixType(nodeType),
					statment,
					nodeType,
					published
				);
				if(!val){
					return [undefined];
				}
				return [val];
			} else {
				return [undefined];
			}
		} else if (element.kind === ts.SyntaxKind.ArrayType){
			let [type] = getFieldType(name + "Item", element.elementType as AcType, nodeType, true);
			if(type){
				return [
					{
						label: `[${type.value}]!`,
						value: `[${type.label}]!`,
						isArray: true
					}
				]
			}
		} else if (element.kind === ts.SyntaxKind.TypeQuery){
			if(element.exprName.kind === ts.SyntaxKind.Identifier){
				let statment: ts.FunctionDeclaration|undefined = undefined;
				for(let i in ast.statements){
					let j = ast.statements[i];
					if(j.kind === ts.SyntaxKind.FunctionDeclaration){
						let _j = j as ts.FunctionDeclaration;
						if(
							_j.name &&
							_j.name.kind === ts.SyntaxKind.Identifier &&
							_j.name.escapedText === element.exprName.escapedText
						){
							statment = _j;
							break;
						}
					}
				}
				if(statment){
					let [type, params] = getFieldType(name, statment.type as CustomUnknown, nodeType, true);
					if(type){
						return [type, handleParams(name + "Input", Array.from(statment.parameters))];
					}
				}
			}
			return [undefined];
		} else if (element.kind === ts.SyntaxKind.UnionType){
			let types = element.types.map(type => getFieldType(name, type as CustomUnknown, nodeType, true)).map(item => item[0]);
			// filter non known types
			if(types.some(type => type === undefined)){
				return [undefined];
			}
			if(types.some(type => type!.value === "Any")){
				return [
					{
						value: "Any",
						label: "Any",
					}
				];
			}
			let nonNullTypes = types.filter(t => !["null", "undefined"].some(_t => _t === t!.value));
			if(nonNullTypes.length > 1){
				// to create gql union type of the types
				throw "multiple types response is not supported, please open an issue.";
			} else if (nonNullTypes.length === 0){
				return [
					{
						value: "Any",
						label: "Any",
					}
				];
			}
			let nullTypes = types.filter(t => ["null", "undefined"].some(_t => _t === t!.value));
			if(nullTypes.length){
				return [
					{
						value: nonNullTypes[0]!.value.slice(0, -1),
						label: nonNullTypes[0]!.label.slice(0, -1),
					}
				];
			}
			return [nonNullTypes[0]];
		} else if (element.kind === ts.SyntaxKind.BooleanKeyword){
			return [
				{
					label: "Boolean!",
					value: "Boolean!",
				}
			];
		} else if (element.kind === ts.SyntaxKind.StringKeyword){
			return [
				{
					label: "String!",
					value: "String!",
				}
			];
		} else if (element.kind === ts.SyntaxKind.NumberKeyword){
			return [
				{
					value: "Float!",
					label: "Float!",
				}
			];
		} else if (element.kind === ts.SyntaxKind.VoidKeyword){
			return [
				{
					value: "null",
					label: "Any",
				}
			];
		} else if (element.kind === ts.SyntaxKind.LiteralType){
			if(element.literal.kind === ts.SyntaxKind.NullKeyword){
				return [
					{
						value: "null",
						label: "Any",
					}
				];
			}
		} else if (element.kind === ts.SyntaxKind.UndefinedKeyword){
			return [
				{
					value: "null",
					label: "Any",
				}
			];
		} else if (element.kind === ts.SyntaxKind.AnyKeyword){
			return [
				{
					value: "Any",
					label: "Any",
				}
			];
		} else if (element.kind === ts.SyntaxKind.ParenthesizedType){
			return getFieldType(name + "Item", element.type as CustomUnknown, "type", true);
		}
		return [undefined];
	}


	fs.unlinkSync(outFilePath);

	return TypesRegistery.types
		.filter(type => {
			return type.published;
		})
		.map(type => {
			let nodeType: string = type.type;
			let _interface : GraphqlType|undefined = undefined;;
			const isInterface = TypesRegistery.interface.includes(type.name);
			if(isInterface){
				nodeType = "interface";
			}
			let output = (
				`${nodeType} ${type.name}`
			);
			if (
				type.extends &&
				!isInterface &&
				(_interface = TypesRegistery.types.find(t => t.name === type.extends))
			){
				output += ` implements ${type.extends}`;
			}
			output += " {\n";
			output += (
				type.fields
				.concat(
					_interface ? 
						_interface.fields : []
				)
				.map(
					t => {
						let res = "\t" + t.field;
						if(t.params.length){
							res += (
								"(" +
								t.params
									.map(param => {
										return param.field+ ": " + param.type;
									})
									.join(", ") +
								")"
							);
						}
						return res + ": " + t.type.label;
					}
				).join("\n") +
				"\n}"
			);
			return output;
		}).concat(`scalar Any`).join("\n");
}

type Field = {
	field: string
	type: {
		value: string
		label: string
		isArray?: boolean
	}
	params: {field: string, type: string}[]
}

type GraphqlOperationType = "input"|"type";

type GraphqlType = {
	extends: string|undefined
	type: GraphqlOperationType
	name: string
	content: string
	published: boolean
	fields: Field[]
};