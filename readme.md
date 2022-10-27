### WIP

### Features
Generate GraphQL schema directly from Typescript code
It does support objects too
### How to use
First u need to generate the .d.ts files of your project then run
```
yarn graphqly run --definition bundle/backend/src/api/schema/def.d.ts --package ./package.json --destination ./a.gql --tsconfig tsconfig.json
```

W'll output this: schema.gql
```
type Query {
	boolean: Boolean!
	string: String!
	int: Float!
	float: Float!
	optional: Boolean
	optionalUsingUndefined: String
}
scalar Any
```

Spec:
- when function returns empty values eg:
	null
	undefined
	void
	the query response is Any
- when function returns Any keyword
	the query response is Any!
- when function returns union of a type and values eg:
	null|Type
	undefined|Type
	void|Type
	the query response is optional Type

