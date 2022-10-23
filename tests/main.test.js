const chai = require('chai');
const expect = chai.expect;
const {default: run} = require("../bundle/src/main");
const fs = require("fs");
const path = require("path");
const {dedent, readFiles} = require("../bundle/src/utils");

const emptyFile = "scalar Any";

describe('Main', function () {

	it('Empty File ', function () {
		let schema = run(
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
		let schema = run(
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

	it('Async', function () {
		let schema = run(
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
				type QType {
					name: String!
				}
				input QInput {
					name: String!
				}
				type Query {
					string: String!
					void: Any!
					type: QType!
					literal: Query__literalType!
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
		let schema = run(
			"file.ts",
			{
				readFile: readFiles(files)
			}
		);
		expect(schema).to.equal(
			dedent`
				type ObjType {
					name: String!
					obj2: Obj2Type!
				}
				input ObjInput {
					name: String!
					obj2: Obj2Input!
				}
				type Obj2Type {
					age: Float!
				}
				input Obj2Input {
					age: Float!
				}
				type Query {
					custom: ObjType!
					optionalCustom: ObjType
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
		let schema = run("file.ts", {readFile: readFiles(files)});
		
		expect(schema).to.equal(
			dedent`
				type ObjType {
					name(format: String!): Float!
				}
				input ObjInput {
					name: Float!
				}
				type Query {
					custom: ObjType!
				}
				scalar Any
			`
		);
	});

	it('External module', function () {
		let schema = run(
			"file.ts",
			{
				readFile: readFiles({
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
				})
			}
		);
		expect(schema).to.equal(
			dedent`
				type UserType {
					name: String!
				}
				input UserInput {
					name: String!
				}
				type Query {
					user: UserType!
					hi: String!
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
		let schema = run(
			"file.ts",
			{
				readFile: readFiles(files)
			}
		);
		expect(schema).to.equal(
			dedent`
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
				input ObjInput {
					name: String!
					nested: ObjInput__nestedInput!
					optionalNested: ObjInput__optionalNestedInput
				}
				input ObjInput__nestedInput {
					field: String!
				}
				input ObjInput__optionalNestedInput {
					field: String!
				}
				type Query {
					q: ObjType!
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
		let schema = run(
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
						q(_, args = {msg: "hi"}){
							return undefined as any;
						}
					}
				}
			`
		}
		let schema = run(
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
		let schema = run(
			"file.ts",
			{
				readFile: readFiles(files)
			}
		);
		expect(schema).to.equal(
			dedent`
				scalar Any
				type Query {
					null: Any
					undefined: Any
					void: Any
					emptyReturn: Any
					explicitNullOrUndefined: Any
				}
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
		let schema = run(
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
		let schema = run(
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
		let schema = run(
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
		let schema = run(
			"file.ts",
			{
				readFile: readFiles(files)
			}
		);
		expect(schema).to.equal(
			dedent`
				type AddUserArgsType {
					id: Float!
					details: AddUserArgsType__detailsType!
				}
				type AddUserArgsType__detailsType {
					age: Float!
					name: String!
				}
				input AddUserArgsInput {
					id: Float!
					details: AddUserArgsInput__detailsInput!
				}
				input AddUserArgsInput__detailsInput {
					age: Float!
					name: String!
				}
				type Mutation {
					addUser(id: Float!, details: AddUserArgsInput__detailsInput!): Boolean!
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
		let schema = run(
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
		try {
			let schema = run("file.ts", {readFile: readFiles(files)});
		} catch (error){
			expect(error).to.equal("zUBP");
			return;
		}
		throw "7OUcnavm9zOpmCV7ezm8"
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
		let schema = run("file.ts", {readFile: readFiles(files)});
		expect(schema).to.equal(
			dedent`
				type Query {
					assignSimpleParam: Any!
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
		try {
			let schema = run("file.ts", {readFile: readFiles(files)});
		} catch (error){
			expect(error).to.equal("zUBP");
			return;
		}
		throw "Nl6qEbJ8fkenghVCAlc"
	});

});
