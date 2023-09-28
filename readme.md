# Graphqly

## Features
Generate a GraphQL schema directly from your TypeScript code. Supports both Types and Classes.

If you've worked with APIs, GraphQL, and Relay, you know that the code-first approach can be time-consuming. Graphqly simplifies this by generating a GraphQL schema based on your TypeScript resolvers.

**This project is a work in progress. Pull requests are welcome. Check the `tests` folder for more examples.**

## How to Use

### Step 1: Create Your TypeScript Definitions
Create a TypeScript file (e.g., `def.ts`) and export a class like `Query` `Mutation`.

```typescript
export class Query {
    hi({name: string}){
        return "hi " + name;
    }
}
```
### Step 2: Compile TypeScript
Run tsc to compile your code. This will generate a definition file (e.g., def.d.ts).
```
export declare class Query {
    hi({ name }: {
        name: any;
    }): string;
}
```
### Step 3: Generate GraphQL Schema

Run Graphqly with the required parameters.
```
yarn graphqly run --definition ./def.d.ts --package ./package.json --destination ./out.gql --tsconfig tsconfig.json
```
### Output

Graphqly will generate a GraphQL schema file (e.g., schema.gql).
```
type Query {
	hi(name: String!): String!
}
scalar Any

```
### Specification
- Field type is `Any` for null, undefined, void, or any.
- Field type is optional `Type` for `null|Type`, `undefined|Type`, `void|Type`.
- All exported classes are included in the generated GraphQL schema.
- Types are automatically converted to interfaces when extended.
- If an extended class is not exported, the extension will be ignored.
- If an extended class is not exported, the extension will be ignored.
