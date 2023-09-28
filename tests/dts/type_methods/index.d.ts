declare type Obj = {
    name(args: {format: string; }): number;
};
declare function func(params: {
    id: number;
}): string;
declare function func2(): {name: string};
declare function func3(): Obj;
export default class Query {
    custom(_: any, args: any): Obj;
    func: typeof func;
    func2: typeof func2;
    func3: typeof func3;
};
export {};