export declare type Obj = {
    name: string;
    obj2: Obj2;
};
export declare type Obj2 = {
    age: number;
};
export default class Query {
    custom(): Obj;
    optionalCustom(): Obj | null;
};
