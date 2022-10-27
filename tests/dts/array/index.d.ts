declare type User = {
    name: string;
};
declare type Edges = {
    node: User;
    cursor: string;
}[];
export default class Root{
    static Query: {
        users(): Edges;
    };
}
export {};