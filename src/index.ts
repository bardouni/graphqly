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

	function handleDTS(content: string){
		// console.group("Out");
		// console.log(content)
		// console.groupEnd();
		ast = parse(content);
		// console.dir(ast, {depth: 10});
		ast.body.forEach(exp => {
			if(
				(exp.type === "ClassDeclaration") &&
				exp.id &&
				(exp.id.name === "Root")
			){
				fromTypeNode(
					"",
					"Root",
					exp,
					"type",
					true,
				);
			}
		});
	}

	function fromTypeNode(
		namePrefix: string,
		name: string,
		e: TSESTree.TypeNode|TSESTree.ClassDeclarationWithName|TSESTree.TSTypeAnnotation,
		gType: GType,
		published: boolean,
	): [string, TSESTree.Parameter[]|null]{
		if(e.type === "TSTypeLiteral"){
			const [gqlType, old] = assertType(gType, name, published);
			if(!old){
				e.members.forEach(prop => {
					let ovParams: TSESTree.Parameter[]|undefined,
							ts: TSESTree.TypeNode
					if(prop.type === "TSMethodSignature"){
						if(!("name" in prop.key)){
							throw "pJygNn9e";
						}
						ts = prop.returnType!.typeAnnotation;
						ovParams = prop.params;
					} else if (prop.type === "TSPropertySignature") {
						if(!("name" in prop.key)){
							throw "pJygNn9e";
						}
						ts = prop.typeAnnotation!.typeAnnotation!;
					} else {
						return;
					}

					const fieldTypeName = name + "__" + prop.key.name + lodash.capitalize(gType);

					let [type, params] = fromTypeNode(
						namePrefix,
						fieldTypeName,
						ts,
						gType,
						true
					);

					if(ovParams){
						params = ovParams;
					}

					const [gqlParams] = handleParams(fieldTypeName, params);

					gqlType.members.push({
						field: prop.key.name,
						type: type === "null" ? "Any" : type,
						params: gqlParams
					});
				});
			}
			return [name + "!", null];
		} else if (e.type === "TSBooleanKeyword") {
			return ["Boolean!", null];
		} else if (e.type === "TSStringKeyword") {
			return ["String!", null];
		} else if (e.type === "TSNumberKeyword") {
			return ["Float!", null];
		} else if (e.type === "TSUnionType") {

			// to add ndx ltr here
			const types = e.types.map((_) => fromTypeNode(namePrefix, name, _, gType, true));

			if(types.length > 2){
				throw "GW6aX84OhSQHFjqUJvUL";
			}

			if(
				types.length === 1 && types.some(_ => _[0] === "null")
			){
				return ["Any", null];
			}
			
			const t = types.find(_ => _[0] !== "null");

			if(!t){
				return ["Any", null];
			}

			return [t[0].slice(0, -1), null];
		} else if (e.type === "TSTypeReference") {
			if("name" in e.typeName){
				if(e.typeName.name === "Promise"){
					return fromTypeNode(namePrefix, name, e.typeParameters!.params[0], gType, true);
				}
				for(let ndx in ast.body){
					const st = ast.body[ndx];
					if(
						st.type === "ClassDeclaration" &&
						st.id.name === e.typeName.name){
						return fromTypeNode("", e.typeName.name + lodash.capitalize(gType), st, gType, true);
					} else if (
						st.type === "TSTypeAliasDeclaration" &&
						st.id.name === e.typeName.name
					){
						return fromTypeNode(namePrefix, e.typeName.name + lodash.capitalize(gType), st.typeAnnotation!, gType, true);
					} else if (
						st.type === "ExportNamedDeclaration" &&
						st.declaration &&
						"id" in st.declaration &&
						st.declaration.id &&
						"name" in st.declaration.id &&
						st.declaration.id.name === e.typeName.name
					) {
						if("typeAnnotation" in st.declaration){
							return fromTypeNode(namePrefix, e.typeName.name + lodash.capitalize(gType), st.declaration.typeAnnotation!, gType, true);
						} else {
							throw "eNyU4k8Kcz1Tc3Xz";
						}
					}
				}
				console.dir(e, {depth: 10})
				throw "m57FVIOSD2";
			}
			throw "9MFL"
		} else if (e.type === "TSUndefinedKeyword") {
			return ["null", null];
		} else if (e.type === "TSNullKeyword") {
			return ["null", null];
		} else if (e.type === "TSVoidKeyword") {
			return ["null", null];
		} else if (e.type === "TSAnyKeyword") {
			return ["Any!", null];
		} else if (e.type === "TSArrayType") {
			const [type] = fromTypeNode(namePrefix, name + "Item", e.elementType!, gType, true);
			return ["[" + type + "]!", null];
		} else if (e.type === "TSTypeQuery") {
			if("name" in e.exprName){
				for(let ndx in ast.body){
					const st = ast.body[ndx];
					if(
						st.type === "TSDeclareFunction" &&
						st.id &&
						st.id.name === e.exprName.name
					){
						const [type] = fromTypeNode(namePrefix, name, st.returnType!.typeAnnotation, gType, true);
						return [
							type,
							st.params
						];
					}
				}
				throw "TujZG0IR5mbrYKxLEw";
			}
			throw "9QQZ2uaRGCSoiGdqUuHj"
		} else if (e.type === "ClassDeclaration"){
			const [gqlType, old] = assertType(gType, name, published);
			if(!old){
				e.body.body.forEach(prop => {
					let t: TSESTree.TypeNode;
					if(
						(prop.type === "PropertyDefinition") &&
						("name" in prop.key) &&
						prop.typeAnnotation
					){
						t = prop.typeAnnotation!.typeAnnotation;
					} else if (
						prop.type === "MethodDefinition" &&
						("name" in prop.key) &&
						prop.value.returnType
					){
						t = prop.value.returnType.typeAnnotation;
					} else {
						// unsupported types
						return;
					}
					const [type, params] = fromTypeNode(namePrefix, prop.key.name, t, gType, true);
					gqlType.members.push({
						field: prop.key.name,
						type: type === "null" ? "Any" : type,
						params: []
					});
				});
			}
			return [name + "!", null];
		} else if (e.type === "TSIntersectionType") {
			let gqlType: string|undefined;
			for(let i = 0; i < e.types.length; i++){
				let type = e.types[i];
				if("members" in type){
					for(let j = 0; j < type.members.length; j++){
						let _type = type.members[j];
						if(
							"key" in _type &&
							"name" in _type.key &&
							_type.key.name === "__graphqly_type__" &&
							"typeAnnotation" in _type &&
							_type.typeAnnotation &&
							_type.typeAnnotation.typeAnnotation.type === "TSLiteralType" &&
							"value" in _type.typeAnnotation.typeAnnotation.literal &&
							_type.typeAnnotation.typeAnnotation.literal.value
						){
							gqlType = _type.typeAnnotation.typeAnnotation.literal.value.toString();
						}
						if(gqlType) break;
					}
				}
				if(gqlType) break;
			}
			if(!gqlType) {
				throw "JHuuBMmastKfKw";
			}
			return [gqlType + "!", null];
		} else {
			console.dir(e, {depth: 10})
			throw "4Umuy1L1WsYOUMo";
		}
	}

	function handleParams(parentName: string, params: TSESTree.Parameter[]|null): [Member["params"]|[]]{

		if(!params){
			return [[]];
		}

		if(params.length >= 1){
			let firstType = params[0];
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
				let ts: TSESTree.TypeNode|undefined;
				let expectedTypeName: string|undefined;

				if(tsArgsType.type === "TSTypeLiteral"){
					if(tsArgsType.members.length){
						expectedTypeName = parentName + "Input";
						ts = paramsType.typeAnnotation.typeAnnotation!
					} else {
						return [[]];
					}
				} else if (tsArgsType.type === "TSTypeReference") {
					if(!("name" in tsArgsType.typeName)){
						throw "IB7JQCcPDzXxYQcee7"
					}
					for(let ndx in ast.body){
						let item = ast.body[ndx];
						if(
							item.type === "TSTypeAliasDeclaration" &&
							item.id.name === tsArgsType.typeName.name
						){
							expectedTypeName = tsArgsType.typeName.name + "Input";
							ts = item.typeAnnotation;
							break;
						}
					}
					if(!ts || !expectedTypeName){
						return [[]];
					}
				} else {
					return [[]];
				}

				const [gqlTypeName] = fromTypeNode("", expectedTypeName, ts, "input", false);
				const gqlType = TypesRegistery.findType(gqlTypeName.slice(0, -1));
				return [gqlType.members];

			}
		}

		return [[]];
	}

	function assertType(gtype: GType, name: string, published: boolean){
		let type = TypesRegistery.types.find(t => t.name === name);
		if(type) return [type, true] as const;
		let i = TypesRegistery.types.push({
			type: gtype,
			members: [],
			name: name,
			content: "",
			published
		}) - 1;
		return [TypesRegistery.types[i], false] as const;
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

	handleDTS(content);

	fs.unlinkSync(outFilePath);

	return TypesRegistery.types
		.filter(type => type.published)
		.filter(type => type.name !== "Root")
		.map(type => {
			return (
				type.type + ` ` + type.name + " {\n" +
				type.members.map(
					t => {
						let res = "\t" + t.field;
						if(t.params.length){
							res += ("(" + t.params.map(param => param.field+ ": " + param.type).join(", ") + ")");
						}
						return res + ": " + t.type;
					}
				).join("\n") +
				"\n}"
			);
		}).concat(`scalar Any`).join("\n");
}

type DefaultOptions = {
	readFile?: (name: string) => string|undefined,
	fileExists?: (name: string, original: (name: string) => boolean ) => boolean
	types?: string[]
};

type Member = {
	field: string
	type: string
	params: {field: string, type: string}[]
}

type GType = "input"|"type";

type GraphqlType = {
	type: GType
	name: string
	content: string
	published: boolean
	members: Member[]
};