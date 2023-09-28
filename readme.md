# WIP

### Features
Generate GraphQL schema directly from Typescript code
It does support Types and Classes.

**This is still a work in progress, and any pull requests are welcome, you can find more examples on the tests folder.**
### How to use
Your typescript code should export a class named Root with Query/Mutation properties: **/def.ts**
```
export default class Root {
	static Query = {
		hi({name: string}){
			return "hi " + name;
		}
	}
}
```
Then you run tsc on your code which will output something like this: **/def.d.ts**
```
export default class Root {
    static Query: {
        hi({ name: string }: {
            name: any;
        }): string;
    };
}
```
3th. you run graphqly with the required parameters:
```
yarn graphqly run --definition ./def.d.ts --package ./package.json --destination ./out.gql --tsconfig tsconfig.json
```

Eventually, Graphqly w'll output this: **schema.gql**
```
type Query {
	hi(name: String!): String!
}
scalar Any
```

Spec:
- when function returns empty values eg:
	null
	undefined
	void
	the query response is Any
- when function returns any keyword
	the query response is Any!
- when function returns union of a type and values eg:
	null|Type
	undefined|Type
	void|Type
	the query response is optional Type

