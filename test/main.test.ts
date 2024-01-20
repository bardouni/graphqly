import transform from "../src";
import { dedent } from "../src/utils";

it('Node', function () {
	let schema = transform({
		definition: "./test/dts/main/index.ts",
		tsconfig: "./test/dts/tsconfig.json"
	});
	expect(schema).toStrictEqual(
		dedent`
			type Account implements Node {
				id: String!
			}
			type Query {
				user: Node!
				nodes(ids: [String!]!): [Node]!
			}
			interface Node {
				id: String!
			}
			type User implements Node {
				id: String!
			}
			type Project implements NonDef {
				id: String!
			}
			type Test {
				id: String!
			}
			interface NonDef {
				id: String!
			}
			scalar Any
		`
	);
});

it('External', function () {
	let schema = transform({
		definition: "./test/dts/external/index.ts",
		tsconfig: "./test/dts/tsconfig.json"
	});
	expect(schema).toStrictEqual(
		dedent`
			type Query {
				external: Query__external!
			}
			type Query__external {
				summary: Query__external__summary!
				periods: [Query__external__periodsItem!]!
				pageInfo: Query__external__pageInfo!
			}
			type Query__external__summary {
				visits: Float!
				installs: Float!
				revenue: Float!
			}
			type Query__external__periodsItem {
				node: Period!
			}
			type Period {
				date: String!
			}
			type Query__external__pageInfo {
				startCursor: String
				hasPreviousPage: Boolean!
				endCursor: String
				hasNextPage: Boolean!
			}
			scalar Any
		`
	);
});


it('Scalars', function () {
	let schema = transform({
		definition: "./test/dts/scalars/index.ts",
		tsconfig: "./test/dts/tsconfig.json"
	});
	expect(schema).toStrictEqual(
		dedent`
			type Query {
				boolean: Boolean!
				string: String!
				int: Float!
				float: Float!
				optional: Boolean
				optionalUsingUndefined: String
				any: Any
			}
			type Mutation {
				addUser: Mutation__addUser!
			}
			type Mutation__addUser {
				msg: String!
			}
			scalar Any
		`
	);
});

it('Class', function () {
	let schema = transform({
		definition: "./test/dts/class/index.ts",
		tsconfig: "./test/dts/tsconfig.json"
	});
	expect(schema).toStrictEqual(
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

it('Async', function () {
	let schema = transform({
		definition: "./test/dts/async/index.ts",
		tsconfig: "./test/dts/tsconfig.json"
	});
	expect(schema).toStrictEqual(
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
		definition: "./test/dts/custom_type/index.ts",
		tsconfig: "./test/dts/tsconfig.json"
	});
	expect(schema).toStrictEqual(
		dedent`
			type Query {
				custom: Obj!
				optionalCustom: Obj
			}
			type Obj {
				name: String!
				obj2: Obj2!
				field: String!
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
		definition: "./test/dts/type_methods/index.ts",
		tsconfig: "./test/dts/tsconfig.json"
	});
	expect(schema).toStrictEqual(
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
		definition: "./test/dts/literal/index.ts",
		tsconfig: "./test/dts/tsconfig.json"
	});
	expect(schema).toStrictEqual(
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
		definition: "./test/dts/local_literal/index.ts",
		tsconfig: "./test/dts/tsconfig.json"
	});
	expect(schema).toStrictEqual(
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
		definition: "./test/dts/assign/index.ts",
		tsconfig: "./test/dts/tsconfig.json"
	});
	expect(schema).toStrictEqual(
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
		definition: "./test/dts/empty/index.ts",
		tsconfig: "./test/dts/tsconfig.json"
	});
	expect(schema).toStrictEqual(
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
		definition: "./test/dts/arguments/index.ts",
		tsconfig: "./test/dts/tsconfig.json"
	});
	expect(schema).toStrictEqual(
		dedent`
			type Mutation {
				addUser: Boolean!
				addUser2(id: Float!, details: Mutation__addUser2Input__detailsInput!): Boolean!
				addUser3(id: Float!, details: AddUserArgs__detailsInput!): Boolean!
				addUser4(name: String!, age: Float!): Boolean!
				arrayParams: Any
				assignSimpleParam: Any
				restParam: Any
			}
			input Mutation__addUser2Input__detailsInput {
				age: Float!
				name: String!
			}
			input AddUserArgs__detailsInput {
				age: Float!
				name: String!
			}
			scalar Any
		`
	);
});
