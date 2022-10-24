const chai = require('chai');
const expect = chai.expect;
const {default: transform} = require("../bundle/src/transform");
const fs = require("fs");
const path = require("path");
const {dedent, readFiles} = require("../bundle/src/utils");

const emptyFile = "scalar Any";

describe('Main', function () {

	it('Referenced function', function () {

		const files = {
			"file.ts": `
				import {res3 as res2, Hi} from "./other";
				function res1(): string{
					return "hi";
				}
				type Foo = {
					name: string
				}
				export default class {
					static Query = {
						res1: res1,
						res2: res2,
						res3(): Hi{
							return null as any;
						},
						res4(): Foo{
							return null as any;
						}
					}
				}
			`,
			[process.cwd() + "/other.ts"]:`
				export function res3(): string{
					return "hi"
				}
				export type Hi = {
					msg: string
				}
			`
		};

		let schema = transform(
			"file.ts",
			{
				fileExists(e, originalFileExists){
					if(files[e]){
						return true;
					}
					return originalFileExists(e);
				},
				readFile: readFiles(files)
			}
		);

		expect(schema).to.equal(
			dedent`
				type Query {
					res1: String!
					res2: String!
					res3: HiType!
					res4: FooType!
				}
				type HiType {
					msg: String!
				}
				type FooType {
					name: String!
				}
				scalar Any
			`
		);
	});

	it('Empty File ', function () {
		let schema = transform(
			"file.ts",
			{
				readFile(){
					return "";
				}
			}
		);
		expect(schema).to.equal(emptyFile);
	});

	it('Scalars', function () {
		let schema = transform(
			"file.ts",
			{
				readFile(){
					return `
						export default class {
							static Query = {
								boolean(){
									return true;
								},
								string(){
									return "string";
								},
								int(){
									return 22;
								},
								float(){
									return 22.33;
								},
								optional(){
									return true as boolean|null;
								},
								optionalUsingUndefined(){
									return "string" as string|undefined;
								},
							}
						}
					`
				}
			}
		);
		expect(schema).to.equal(
			dedent`
				type Query {
					boolean: Boolean!
					string: String!
					int: Float!
					float: Float!
					optional: Boolean
					optionalUsingUndefined: String
				}
				scalar Any
			`
		);
	});

	it('Any', function () {
		let schema = transform(
			"file.ts",
			{
				readFile(){
					return `
						export default class {
							static Query = {
								any(): any{
									return "";
								}
							}
						}
					`
				}
			}
		);
		expect(schema).to.equal(
			dedent`
				type Query {
					any: Any!
				}
				scalar Any
			`
		);
	});

	it('Async', function () {
		let schema = transform(
			"file.ts",
			{
				readFile: readFiles({
					"file.ts":`
						export type Q = {
							name: string
						}
						export default class {
							static Query = {
								async string(){return "str"}
								async void(){return}
								async type(){return undefined as Q}
								async literal(){return {a: "hi"}}
							}
						}
					`
				})
			}
		);
		expect(schema).to.equal(
			dedent`
				type Query {
					string: String!
					void: Any
					type: QType!
					literal: Query__literalType!
				}
				type QType {
					name: String!
				}
				type Query__literalType {
					a: String!
				}
				scalar Any
			`
		);
	});

	it('Custom type', function () {
		let files = {
			"file.ts": `
				export type Obj = {
					name: string
					obj2: Obj2
				}
				export type Obj2 = {
					age: number
				}
				export default class {
					static Query = {
						custom() : Obj{
							return undefined as any;
						},
						optionalCustom() : Obj|null{
							return undefined as any;
						}
					}
				}
			`
		}
		let schema = transform(
			"file.ts",
			{
				readFile: readFiles(files)
			}
		);
		expect(schema).to.equal(
			dedent`
				type Query {
					custom: ObjType!
					optionalCustom: ObjType
				}
				type ObjType {
					name: String!
					obj2: Obj2Type!
				}
				type Obj2Type {
					age: Float!
				}
				scalar Any
			`
		);
	});

	it('Type methods', function () {
		let files = {
			"file.ts": `
				type Obj = {
					name(_, args: {format: string}) : number {
						return 0;
					}
				}
				export default class {
					static Query = {
						custom(_, args): Obj{
							return undefined as any;
						}
					}
				}
			`
		}
		let schema = transform("file.ts", {readFile: readFiles(files)});
		
		expect(schema).to.equal(
			dedent`
				type Query {
					custom: ObjType!
				}
				type ObjType {
					name(format: String!): Float!
				}
				scalar Any
			`
		);
	});

	it('External module', function () {
		const files = {
			"file.ts": `
				import {resolvers} from "./other";
				export default class {
					static Query = {
						hi(): string => void,
						...resolvers
					}
				}
			`,
			[process.cwd() + "/other.ts"]:`
				export type User = {
					name: string
				}
				export const resolvers = {
					user() : User => void
				}
				export default class {
					static Query = {
						ignore(){}
					}
				}
			`
		};
		let schema = transform(
			"file.ts",
			{
				fileExists(e, originalFileExists){
					if(files[e]){
						return true;
					}
					return originalFileExists(e);
				},
				readFile: readFiles(files)
			}
		);
		expect(schema).to.equal(
			dedent`
				type Query {
					user: UserType!
					hi: String!
				}
				type Query__userType {
					name: String!
				}
				scalar Any
			`
		);
	});

	it('Literals Type', function () {
		let files = {
			"file.ts": `
				export type Obj = {
					name: string
					nested:{
						field: string
					}
					optionalNested:null|{
						field: string
					}
				}
				export default class {
					static Query = {
						q(){
							return undefined as any as Obj;
						}
					}
				}
			`
		}
		let schema = transform(
			"file.ts",
			{
				readFile: readFiles(files)
			}
		);
		expect(schema).to.equal(
			dedent`
				type Query {
					q: ObjType!
				}
				type ObjType {
					name: String!
					nested: ObjType__nestedType!
					optionalNested: ObjType__optionalNestedType
				}
				type ObjType__nestedType {
					field: String!
				}
				type ObjType__optionalNestedType {
					field: String!
				}
				scalar Any
			`
		);
	});

	it('Local Literal Type', function () {
		let files = {
			"file.ts": `
				export default class {
					static Query = {
						q(){
							type Hi = {
								name: string
							}
							return undefined as Hi;
						}
					}
				}
			`
		}
		let schema = transform(
			"file.ts",
			{
				readFile: readFiles(files)
			}
		);
		expect(schema).to.equal(
			dedent`
				type Query {
					q: Query__qType!
				}
				type Query__qType {
					name: String!
				}
				scalar Any
			`
		);
	});

	it('Assign args', function () {
		let files = {
			"file.ts": `
				export default class {
					static Query = {
						q(_, args = {msg: "hi"}, ctx: Ctx){
							return undefined as any;
						}
					}
				}
			`
		}
		let schema = transform(
			"file.ts",
			{
				readFile: readFiles(files)
			}
		);
		expect(schema).to.equal(
			dedent`
				type Query {
					q(msg: String!): Any!
				}
				scalar Any
			`
		);
	});

	it('empty', function () {
		let files = {
			"file.ts": `
				export default class {
					static Query = {
						null(_, tp, ctx){
							return null;
						},
						undefined(_, tp, ctx){
							return undefined;
						},
						void(_, tp, ctx){},
						emptyReturn(){return},
						explicitNullOrUndefined(){
							return null as null|undefined;
						}
					}
				}
			`
		}
		let schema = transform(
			"file.ts",
			{
				readFile: readFiles(files)
			}
		);
		expect(schema).to.equal(
			dedent`
				type Query {
					null: Any
					undefined: Any
					void: Any
					emptyReturn: Any
					explicitNullOrUndefined: Any
				}
				scalar Any
			`
		);
	});

	it('Mutation', function () {
		let files = {
			"file.ts": `
				export default class {
					static Mutation = {
						addUser(){
							return {
								msg: "Hello world"
							}
						}
					}
				}
			`
		}
		let schema = transform(
			"file.ts",
			{
				readFile: readFiles(files)
			}
		);
		expect(schema).to.equal(
			dedent`
				type Mutation {
					addUser: Mutation__addUserType!
				}
				type Mutation__addUserType {
					msg: String!
				}
				scalar Any
			`
		);
	});

	it('No Types args', function () {
		let files = {
			"file.ts": `
				export default class {
					static Mutation = {
						addUser(_, args){
							return true
						}
					}
				}
			`
		}
		let schema = transform(
			"file.ts",
			{
				readFile: readFiles(files)
			}
		);
		expect(schema).to.equal(
			dedent`
				type Mutation {
					addUser: Boolean!
				}
				scalar Any
			`
		);
	});

	it('Literal args', function () {
		let files = {
			"file.ts": `
				export default class {
					static Mutation = {
						addUser(_, args: {id: number, details: {age: number, name: string}}){
							return true
						}
					}
				}
			`
		}
		let schema = transform(
			"file.ts",
			{
				readFile: readFiles(files)
			}
		);
		expect(schema).to.equal(
			dedent`
				type Mutation {
					addUser(id: Float!, details: addUserInput__detailsInput!): Boolean!
				}
				input addUserInput__detailsInput {
					age: Float!
					name: String!
				}
				scalar Any
			`
		);
	});

	it('Ignore this arg', function () {
		let files = {
			"file.ts": `
				type AddUserArgs = {
					id: number
					details:{
						age: number
						name: string
					}
				}
				export default class {
					static Mutation = {
						addUser(this: never, _, args: AddUserArgs){
							return true
						}
					}
				}
			`
		}
		let schema = transform(
			"file.ts",
			{
				readFile: readFiles(files)
			}
		);
		expect(schema).to.equal(
			dedent`
				type Mutation {
					addUser(id: Float!, details: AddUserArgsInput__detailsInput!): Boolean!
				}
				input AddUserArgsInput__detailsInput {
					age: Float!
					name: String!
				}
				scalar Any
			`
		);
	});

	it('Ignore first param when using this arg', function () {
		let files = {
			"file.ts": `
				export default class {
					static Mutation = {
						addUser(this: never, _){
							return true
						}
					}
				}
			`
		}
		let schema = transform(
			"file.ts",
			{
				readFile: readFiles(files)
			}
		);
		expect(schema).to.equal(
			dedent`
				type Mutation {
					addUser: Boolean!
				}
				scalar Any
			`
		);
	});

	it('throw on arrayParams', function () {
		let files = {
			"file.ts": `
				export default class {
					static Query = {
						arrayParams(_, [aio]){},
					}
				}
			`
		}
		let schema = transform("file.ts", {readFile: readFiles(files)});
		expect(schema).to.equal(
			dedent`
				type Query {
					arrayParams: Any
				}
				scalar Any
			`
		);
	});

	it('Ignore Args when assigning scalar type', function () {
		let files = {
			"file.ts": `
				export default class {
					static Query = {
						assignSimpleParam(_, a = ""){},
					}
				}
			`
		}
		let schema = transform("file.ts", {readFile: readFiles(files)});
		expect(schema).to.equal(
			dedent`
				type Query {
					assignSimpleParam: Any
				}
				scalar Any
			`
		);
	});

	it('throw on restParam', function () {
		let files = {
			"file.ts": `
				export default class {
					static Query = {
						restParam(_, ...res){},
					}
				}
			`
		}
		let schema = transform("file.ts", {readFile: readFiles(files)});
		expect(schema).to.equal(
			dedent`
				type Query {
					restParam: Any
				}
				scalar Any
			`
		);
	});

});
