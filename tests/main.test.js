const chai = require('chai');
const expect = chai.expect;
const {default: transform} = require("../bundle/src/index");
const fs = require("fs");
const path = require("path");
const {dedent, readFiles} = require("../bundle/src/utils");
const ts = require("typescript");

const emptyFile = "scalar Any";

describe('Main', function () {

	it('Scalars', function () {
		let schema = transform({
			definition: "./tests/dts/scalars/index.d.ts",
			package: "./tests/dts/package.json",
			tsconfig: "./tests/tsconfig.json"
		});
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

	it('Class', function () {
		let schema = transform({
			definition: "./tests/dts/class/index.d.ts",
			package: "./tests/dts/package.json",
			tsconfig: "./tests/tsconfig.json"
		});
		expect(schema).to.equal(
			dedent`
				type Query {
					user: UserType!
				}
				type UserType {
					name: String!
					likes: [LikeType!]!
				}
				type LikeType {
					from: String!
				}
				scalar Any
			`
		);
	});

	it('Array', function () {
		let schema = transform({
			definition: "./tests/dts/array/index.d.ts",
			package: "./tests/dts/package.json",
			tsconfig: "./tests/tsconfig.json"
		});
		expect(schema).to.equal(
			dedent`
				type Query {
					users: [EdgesTypeItem!]!
				}
				type EdgesTypeItem {
					node: UserType!
					cursor: String!
				}
				type UserType {
					name: String!
				}
				scalar Any
			`
		);
	});

	it('Any', function () {
		let schema = transform({
			definition: "./tests/dts/any/index.d.ts",
			package: "./tests/dts/package.json",
			tsconfig: "./tests/tsconfig.json"
		});
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
		let schema = transform({
			definition: "./tests/dts/async/index.d.ts",
			package: "./tests/dts/package.json",
			tsconfig: "./tests/tsconfig.json"
		});
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
		let schema = transform({
			definition: "./tests/dts/custom_type/index.d.ts",
			package: "./tests/dts/package.json",
			tsconfig: "./tests/tsconfig.json"
		});
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
		let schema = transform({
			definition: "./tests/dts/type_methods/index.d.ts",
			package: "./tests/dts/package.json",
			tsconfig: "./tests/tsconfig.json"
		});
		expect(schema).to.equal(
			dedent`
				type Query {
					custom: ObjType!
					func(id: Float!): String!
				}
				type ObjType {
					name(format: String!): Float!
				}
				scalar Any
			`
		);
	});

	it('Literals Type', function () {
		const schema = transform({
			definition: "./tests/dts/literal/index.d.ts",
			package: "./tests/dts/package.json",
			tsconfig: "./tests/tsconfig.json"
		});
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
		let schema = transform({
			definition: "./tests/dts/local_literal/index.d.ts",
			package: "./tests/dts/package.json",
			tsconfig: "./tests/tsconfig.json"
		});
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
		let schema = transform({
			definition: "./tests/dts/assign/index.d.ts",
			package: "./tests/dts/package.json",
			tsconfig: "./tests/tsconfig.json"
		});
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
		let schema = transform({
			definition: "./tests/dts/empty/index.d.ts",
			package: "./tests/dts/package.json",
			tsconfig: "./tests/tsconfig.json"
		});
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
		let schema = transform({
			definition: "./tests/dts/mutation/index.d.ts",
			package: "./tests/dts/package.json",
			tsconfig: "./tests/tsconfig.json"
		});
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
		let schema = transform({
			definition: "./tests/dts/no_type_args/index.d.ts",
			package: "./tests/dts/package.json",
			tsconfig: "./tests/tsconfig.json"
		});
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
		let schema = transform({
			definition: "./tests/dts/literal_args/index.d.ts",
			package: "./tests/dts/package.json",
			tsconfig: "./tests/tsconfig.json"
		});
		expect(schema).to.equal(
			dedent`
				type Mutation {
					addUser(id: Float!, details: Mutation__addUserTypeInput__detailsInput!): Boolean!
				}
				input Mutation__addUserTypeInput__detailsInput {
					age: Float!
					name: String!
				}
				scalar Any
			`
		);
	});

	it('Ignore this arg', function () {
		let schema = transform({
			definition: "./tests/dts/ignore_this/index.d.ts",
			package: "./tests/dts/package.json",
			tsconfig: "./tests/tsconfig.json"
		});
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
		let schema = transform({
			definition: "./tests/dts/ignore_this2/index.d.ts",
			package: "./tests/dts/package.json",
			tsconfig: "./tests/tsconfig.json"
		});
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
		let schema = transform({
			definition: "./tests/dts/array_params/index.d.ts",
			package: "./tests/dts/package.json",
			tsconfig: "./tests/tsconfig.json"
		});
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
		let schema = transform({
			definition: "./tests/dts/ignore_args3/index.d.ts",
			package: "./tests/dts/package.json",
			tsconfig: "./tests/tsconfig.json"
		});
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
		let schema = transform({
			definition: "./tests/dts/rest_params/index.d.ts",
			package: "./tests/dts/package.json",
			tsconfig: "./tests/tsconfig.json"
		});
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
