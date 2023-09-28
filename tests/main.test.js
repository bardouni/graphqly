const chai = require('chai');
const expect = chai.expect;
const {default: transform} = require("../bundle/src/index");
const fs = require("fs");
const path = require("path");
const {dedent, readFiles} = require("../bundle/src/utils");
const ts = require("typescript");

it('Node', function () {
	let schema = transform({
		definition: "./tests/dts/main/index.d.ts",
		package: "./tests/dts/package.json",
		tsconfig: "./tests/tsconfig.json"
	});
	expect(schema).to.equal(
		dedent`
			type Account implements Node_2 {

			}
			type Query {
				user: Node_2!
			}
			type Node_2 {
				id: String!
			}
			type User implements Node_2 {

			}
			scalar Any
		`
	);
});

it('Scalars', function () {
	let schema = transform({
		definition: "./tests/dts/scalars/index.d.ts",
		package: "./tests/dts/package.json",
		tsconfig: "./tests/tsconfig.json"
	});
	expect(schema).to.equal(
		dedent`
			type Mutation {
				addUser: Mutation__addUser!
			}
			type Mutation__addUser {
				msg: String!
			}
			type Query {
				boolean: Boolean!
				string: String!
				int: Float!
				float: Float!
				optional: Boolean
				optionalUsingUndefined: String
				any: Any
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
				user: User!
				user2: User!
			}
			type User {
				name: String!
				likes: [Like!]!
			}
			type Like {
				from: String!
			}
			scalar Any
		`
	);
});

it('Reference Array', function () {
	let schema = transform({
		definition: "./tests/dts/array/index.d.ts",
		package: "./tests/dts/package.json",
		tsconfig: "./tests/tsconfig.json"
	});
	expect(schema).to.equal(
		dedent`
			type Query {
				users: [EdgesItem!]!
			}
			type EdgesItem {
				node: User!
				cursor: String!
			}
			type User {
				name: String!
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
				type: Q!
				literal: Query__literal!
			}
			type Q {
				name: String!
			}
			type Query__literal {
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
				custom: Obj!
				optionalCustom: Obj
			}
			type Obj {
				name: String!
				obj2: Obj2!
			}
			type Obj2 {
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
				custom: Obj!
				func(id: Float!): String!
				func2: Query__func2!
				func3: Obj!
			}
			type Obj {
				name: Float!
			}
			type Query__func2 {
				name: String!
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
				q: Obj!
			}
			type Obj {
				name: String!
				nested: Obj__nested!
				optionalNested: Obj__optionalNested
			}
			type Obj__nested {
				field: String!
			}
			type Obj__optionalNested {
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
				q: Query__q!
			}
			type Query__q {
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
				q(msg: String!): Any
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

it('Arguments', function () {
	let schema = transform({
		definition: "./tests/dts/arguments/index.d.ts",
		package: "./tests/dts/package.json",
		tsconfig: "./tests/tsconfig.json"
	});
	expect(schema).to.equal(
		dedent`
			type Mutation {
				addUser: Boolean!
				addUser2(id: Float!, details: Mutation__addUser2Input__detailsInput!): Boolean!
				addUser3(id: Float!, details: AddUserArgsInput__detailsInput!): Boolean!
				addUser4(name: String!, age: Float!): Boolean!
				arrayParams: Any
				assignSimpleParam: Any
				restParam: Any
			}
			input Mutation__addUser2Input__detailsInput {
				age: Float!
				name: String!
			}
			input AddUserArgsInput__detailsInput {
				age: Float!
				name: String!
			}
			scalar Any
		`
	);
});
