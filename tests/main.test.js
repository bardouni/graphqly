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
  			scalar Any
  			type Query{
  				boolean: Boolean!
  				string: String!
  				int: Float!
  				float: Float!
  				optional: Boolean
  				optionalUsingUndefined: String
  			}
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
  			type literalType {
  				a: String!
  			}
  			scalar Any
  			type Query{
  				string: String!
  				void: Any!
  				type: QType!
  				literal: literalType!
  			}
  		`
  	);
  });

  it('Custom Type', function () {
  	let files = {
  		"a.ts": `
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
  		"a.ts",
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
  			scalar Any
  			type Query{
  				custom: ObjType!
  				optionalCustom: ObjType
  			}
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
  			scalar Any
  			type Query{
  				user: UserType!
  				hi: String!
  			}
  		`
  	);
  });

  it('Literals Type', function () {
  	let files = {
  		"a.ts": `
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
  		"a.ts",
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
  			scalar Any
  			type Query{
  				q: ObjType!
  			}
  		`
  	);
  });

  it('Local Literal Type', function () {
  	let files = {
  		"a.ts": `
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
  		"a.ts",
  		{
  			readFile: readFiles(files)
  		}
  	);
  	expect(schema).to.equal(
  		dedent`
  			type qType {
  				name: String!
  			}
  			scalar Any
  			type Query{
  				q: qType!
  			}
  		`
  	);
  });

  it('Assign args', function () {
  	let files = {
  		"a.ts": `
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
  		"a.ts",
  		{
  			readFile: readFiles(files)
  		}
  	);
  	expect(schema).to.equal(
  		dedent`
  			input qInput {
  				msg: String!
  			}
  			scalar Any
  			type Query{
  				q(msg: String!): Any!
  			}
  		`
  	);
  });

  it('empty', function () {
  	let files = {
  		"a.ts": `
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
  		"a.ts",
  		{
  			readFile: readFiles(files)
  		}
  	);
  	expect(schema).to.equal(
  		dedent`
  			scalar Any
  			type Query{
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
  		"a.ts": `
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
  		"a.ts",
  		{
  			readFile: readFiles(files)
  		}
  	);
  	expect(schema).to.equal(
  		dedent`
  			type addUserType {
  				msg: String!
  			}
  			scalar Any
  			type Mutation{
  				addUser: addUserType!
  			}
  		`
  	);
  });

  it('No Types args', function () {
  	let files = {
  		"a.ts": `
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
  		"a.ts",
  		{
  			readFile: readFiles(files)
  		}
  	);
  	expect(schema).to.equal(
  		dedent`
  			scalar Any
  			type Mutation{
  				addUser: Boolean!
  			}
  		`
  	);
  });

  it('Literal args', function () {
  	let files = {
  		"a.ts": `
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
  		"a.ts",
  		{
  			readFile: readFiles(files)
  		}
  	);
  	expect(schema).to.equal(
  		dedent`
  			input addUserInput {
  				id: Float!
  				details: addUserInput__detailsInput!
  			}
  			input addUserInput__detailsInput {
  				age: Float!
  				name: String!
  			}
  			scalar Any
  			type Mutation{
  				addUser(id: Float!, details: addUserInput__detailsInput!): Boolean!
  			}
  		`
  	);
  });

  it('Type args', function () {
  	let files = {
  		"a.ts": `
  			type AddUserArgs = {
  				id: number
  				details:{
  					age: number
  					name: string
  				}
  			}
				export default class {
					static Mutation = {
						addUser(_, args: AddUserArgs){
							return true
						}
					}
				}
			`
  	}
  	let schema = run(
  		"a.ts",
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
  			scalar Any
  			type Mutation{
  				addUser(id: Float!, details: AddUserArgsInput__detailsInput!): Boolean!
  			}
  		`
  	);
  });

  it('Ignore this arg', function () {
  	let files = {
  		"a.ts": `
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
  		"a.ts",
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
  			scalar Any
  			type Mutation{
  				addUser(id: Float!, details: AddUserArgsInput__detailsInput!): Boolean!
  			}
  		`
  	);
  });

  it('Ignore first param when using this arg', function () {
  	let files = {
  		"a.ts": `
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
  		"a.ts",
  		{
  			readFile: readFiles(files)
  		}
  	);
  	expect(schema).to.equal(
  		dedent`
  			scalar Any
  			type Mutation{
  				addUser: Boolean!
  			}
  		`
  	);
  });

  it('throw on arrayParams', function () {
  	let files = {
  		"a.ts": `
				export default class {
					static Query = {
						arrayParams(_, [aio]){},
					}
				}
			`
  	}
  	try {
  		let schema = run("a.ts", {readFile: readFiles(files)});
  	} catch (error){
  		expect(error).to.equal("zUBP");
  		return;
  	}
  	throw "7OUcnavm9zOpmCV7ezm8"
  });

  it('throw on assignSimpleParam', function () {
  	let files = {
  		"a.ts": `
				export default class {
					static Query = {
						assignSimpleParam(_, a = ""){},
					}
				}
			`
  	}
  	try {
  		let schema = run("a.ts", {readFile: readFiles(files)});
  	} catch (error){
  		expect(error).to.equal("krDaV80luhuyPvQg");
  		return;
  	}
  	throw "Nl6qEbJ8fkenghVCAlc"
  });

  it('throw on restParam', function () {
  	let files = {
  		"a.ts": `
				export default class {
					static Query = {
						restParam(_, ...res){},
					}
				}
			`
  	}
  	try {
  		let schema = run("a.ts", {readFile: readFiles(files)});
  	} catch (error){
  		expect(error).to.equal("zUBP");
  		return;
  	}
  	throw "Nl6qEbJ8fkenghVCAlc"
  });

});
