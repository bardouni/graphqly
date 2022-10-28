declare type Obj = {
    name(args: {
        format: string;
    }): number;
};
export default class Root {
    static Query: {
        custom(_: any, args: any): Obj;
    };
}
export {};