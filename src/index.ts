import fs from "fs";
import path from "path";
import * as mo from "ts-morph";
import * as ts from "typescript";

type TransformOptions = {
	definition: string
	tsconfig: string
};

export default function transform(opts: TransformOptions){

	const cwd = process.cwd();

	const tsConfigPath = path.resolve(cwd, opts.tsconfig);
	const config = ts.parseConfigFileTextToJson(tsConfigPath, fs.readFileSync(tsConfigPath, 'utf8'));
	const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(tsConfigPath));

	// Creating a TypeScript program instance
	const program = ts.createProgram(parsed.fileNames, parsed.options);
	const checker = program.getTypeChecker();

	// const files = program.getRootFileNames();

	const def = path.resolve(cwd, opts.definition);

  const sourceFile = program.getSourceFile(def);

  if (!sourceFile) {
  	throw new Error("can't find schema file at: " + def);
  }

  const project = new mo.Project({
    tsConfigFilePath: tsConfigPath
  });

  const file = project.getSourceFile(def)!;

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

  function handleParams(name: string, params: mo.Symbol[]|null){
  	if(!params?.length){
  		return undefined;
  	}
  	if(!params[0].getName()){
  		return undefined;
  	}
  	/*if(
  		params[0].name.kind === ts.SyntaxKind.Identifier &&
  		params[0].name.escapedText === "this"
  	){
  		params = params.slice(1);
  	}*/
  	const dec = params[0].getDeclarations()[0].getType();
  	let [type] = getFieldType(name, dec, "input", false);
  	if(type){
  		return TypesRegistery.findType(type.value);
  	}
  }

  function getFieldType(
  	name: string,
  	element: mo.Type,
  	nodeType: GraphqlOperationType,
  	published: boolean
  ) : [Field["type"]]|[undefined] {
  	if (element.isClassOrInterface()){
  		const sym = element.getSymbol()!;
  		const dec = sym.getDeclarations()[0] as mo.ClassDeclaration;
  		const name = dec.getName()!;
  		const graphqlType : GraphqlType = {
  			extends: undefined,
  			type: nodeType,
  			fields: [],
  			name,
  			content: "",
  			published
  		}
  		const types = element.getBaseTypes();
  		if(types.length){
  			let name = types[0].getSymbol()!.getName();
  			const dec = types[0].getSymbol()!.getValueDeclaration()!;
  			if(mo.Node.isClassDeclaration(dec)){
  				name = dec.getName()!;
  			}
  			graphqlType.extends = name;
  			TypesRegistery.interface.push(graphqlType.extends);
  		}
  		let returnedType = {
  			value: graphqlType.name,
  			label: graphqlType.name,
  			isRequired: true
  		};
  		if(TypesRegistery.types.some(type => type.name === graphqlType.name)){
  			return [returnedType];
  		}
  		TypesRegistery.types.push(graphqlType);
  		dec.getMembers().forEach(member => {
  			if(
  				mo.Node.isConstructorDeclaration(member) ||
  				member.isStatic()
  			){
  				return;
  			}
  			const field = member.getName();
  	  	let moType: mo.Type, params: GraphqlType|undefined;
  	  	if(mo.Node.isPropertyDeclaration(member)){
  	  		const initializer = member.getInitializer();
  	  		if(initializer){
  	  			[moType, params] = getTypeFromCallSignature(initializer.getType(), field, name, handleParams);
  	  		} else {
  	  			moType = member.getType();
  	  		}
  	  	} else if (mo.Node.isMethodDeclaration(member)){
  	  		moType = member.getReturnType();
  	  		const sig = member.getSignature()!;
  	  		params = handleParams(name + "__" + field + "Input", sig.getParameters());
  	  	} else {
  	  		return [undefined]
  	  	}
  	  	const [_type] = getFieldType(
  	  		name + "__" + field + suffixType(nodeType),
  	  		moType,
  	  		nodeType,
  	  		true
  	  	);
  	  	if(_type){
  	  		graphqlType.fields.push({
  	  			field: field,
  	  			type: _type,
  	  			paramsType: params
  	  		});
  	  	}
  		});
  		return [returnedType];
  	} else if (element.isUnion()){
  		let types = element.getUnionTypes()
  			.map(type => getFieldType(name, type, nodeType, published))
  			.map(item => item[0])
  			.filter(
  				(e, index, list) => {
  					let _index = list.findIndex(em => em?.value === e?.value);
  					return index === _index;
  				}
  			)
  		// filter non known types
  		if(types.some(type => type === undefined)){
  			return [undefined];
  		}
  		if(types.some(type => type!.value === "Any")){
  			return [
  				{
  					value: "Any",
  					label: "Any",
  					isRequired: false
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
  					isRequired: false
  				}
  			];
  		}
  		let nullTypes = types.filter(t => ["null", "undefined"].some(_t => _t === t!.value));
  		if(nullTypes.length){
  			return [
  				{
  					value: nonNullTypes[0]!.value,
  					label: nonNullTypes[0]!.label,
  					isRequired: false
  				}
  			];
  		}
  		return [nonNullTypes[0]];
  	} else if (element.isBoolean() || element.isBooleanLiteral()){
  		return [
  			{
  				label: "Boolean",
  				value: "Boolean",
  				isRequired: true,
  			}
  		];
  	} else if (element.isString()){
  		return [
  			{
  				label: "String",
  				value: "String",
  				isRequired: true,
  			}
  		];
  	} else if (element.isNumber()){
  		return [
  			{
  				value: "Float",
  				label: "Float",
  				isRequired: true,
  			}
  		];
  	} else if (element.isVoid()){
  		return [
  			{
  				value: "null",
  				label: "Any",
  				isRequired: false,
  			}
  		];
  	} else if (element.isUndefined() || element.isNull()){
  		return [
  			{
  				value: "null",
  				label: "Any",
  				isRequired: false,
  			}
  		];
  	} else if (element.isAny()){
  		return [
  			{
  				value: "Any",
  				label: "Any",
  				isRequired: false,
  			}
  		];
  	} else if (element.isArray()){
  		let [type] = getFieldType(name + "Item", element.getArrayElementType()!, nodeType, true);
  		if(type){
  			return [
  				{
  					label: `[${type.value}${type.isRequired ? "!" : ""}]`,
  					value: `[${type.label}${type.isRequired ? "!" : ""}]`,
  					isArray: true,
  					isRequired: true
  				}
  			]
  		}
  	} else if (element.isObject()){
  		const symbol = element.getSymbol();
  		if(!symbol){
  			return [undefined];
  		}
  		if(symbol.getName() === "Promise"){
  			return getFieldType(
  				name,
  				element.getTypeArguments()[0],
  				nodeType,
  				published
  			);
  		}
  		const declaration = symbol.getDeclarations()[0];
  		if(declaration){
  			if(declaration.getType().isClass()){
  				const name = declaration.getSymbol()!.getName();
  				return getFieldType(
  					name,
  					declaration.getType(),
  					nodeType,
  					published
  				);
  			}
  		}
  		if(element.getObjectFlags() === mo.ObjectFlags.Reference){
  			return getFieldType(
  				name,
  				element,
  				nodeType,
  				published
  			);
  		} else if (
  			(element.getObjectFlags() === mo.ObjectFlags.Anonymous) ||
  			element.getAliasSymbol() ||
  			mo.Node.isTypeLiteral(declaration) ||
  			mo.Node.isObjectLiteralExpression(declaration)
  		) {
  			let aliasSymbol = element.getAliasSymbol();
  			let typeName = name;
  			if(aliasSymbol){
  				typeName = aliasSymbol.getName();
  			}
  			const graphqlType : GraphqlType = {
  				extends: undefined,
  				type: nodeType,
  				fields: [],
  				name: typeName,
  				content: "",
  				published
  			};
  			let returnedType = {
  				value: typeName,
  				label: typeName,
  				isRequired: true
  			};
  			if(TypesRegistery.types.some(type => type.name === graphqlType.name)){
  				return [returnedType];
  			}
  			TypesRegistery.types.push(graphqlType);
  			element.getProperties().forEach(property => {
  				const field = property.getName();
  			  const declaration = property.getDeclarations()[0];
  			  if(declaration){
  			  	let [propertyType, paramsType] = getTypeFromCallSignature(declaration.getType(), field, name, handleParams);
  			  	const [_type] = getFieldType(typeName + "__" + field + suffixType(nodeType), propertyType, nodeType, true);
  	  	  	if(_type){
  	  				graphqlType.fields.push({
  	  					field: field,
  	  					type: _type,
  	  					paramsType
  	  				});
  	  	  	}
  			  }
  			});
  			return [
  				returnedType
  			];
  		}
  	} else if (element.isIntersection()){
  		const types = element.getIntersectionTypes();
  		for(let i =0; i < types.length; i++){
  			let type = types[i];
  			if(type.isObject()){
  				let property = type.getProperty("__gqly_type__")!;
  				let value = property.getValueDeclaration()!.getType().getLiteralValue();
  				if(typeof value === "string"){
  					return [
  						{
  							label: value,
  							value: value,
  							isRequired: true,
  						}
  					];
  				}
  				break;
  			}
  		}
  	}
  	return [undefined];
  }

  function toString(){
  	// console.log(JSON.stringify(TypesRegistery.types, null, 2));
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
  						if(t.paramsType){
  							res += (
  								"(" +
  								t.paramsType.fields
  									.map(param => {
  										return param.field+ ": " + param.type.label + (param.type.isRequired ? "!" : "");
  									})
  									.join(", ") +
  								")"
  							);
  						}
  						return res + ": " + t.type.label + (t.type.isRequired ? "!" : "");
  					}
  				).join("\n") +
  				"\n}"
  			);
  			return output;
  		}).concat(`scalar Any`).join("\n");
  }

  file.getExportedDeclarations().forEach(exp => {
  	let exported = exp[0];
  	const symbol = exported.getSymbol();
  	if(!symbol){
  		return;
  	}
  	const name = symbol.getName()!;
  	getFieldType(
  		name,
  		exported.getType(),
  		"type",
  		true
  	);
  });

  return toString();

}

function getTypeFromCallSignature(propertyType: mo.Type, field: string, name: string, handleParams: (name: string, params: mo.Symbol[]|null) => GraphqlType|undefined){
	const callSig = propertyType.getCallSignatures()[0];
  let paramsType: GraphqlType|undefined;
	if(callSig){
		propertyType = callSig.getReturnType();
		paramsType = handleParams(name + "__" + field + "Input", callSig.getParameters());
	}
	return [propertyType, paramsType] as const;
}

export type Field = {
	field: string
	type: {
		value: string
		label: string
		isArray?: boolean
		isRequired: boolean
	}
	paramsType?: GraphqlType
}

export type GraphqlOperationType = "input"|"type";

export type GraphqlType = {
	extends: string|undefined
	type: GraphqlOperationType
	name: string
	content: string
	published: boolean
	fields: Field[]
};