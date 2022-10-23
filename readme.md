### Features

Generate GraphQL schema directly from Typescript code
download and run
```
yarn graphqly file.ts
```
file.ts
```
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

