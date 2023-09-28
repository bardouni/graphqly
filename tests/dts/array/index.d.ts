export declare type User = {
  name: string;
};
export declare type Edges = {
  node: User;
  cursor: string;
}[];
export default class Query {
    users(): Edges;
};
export {};