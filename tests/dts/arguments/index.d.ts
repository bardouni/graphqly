export declare type AddUserArgs = {
    id: number;
    details: {
        age: number;
        name: string;
    };
};
export default class Mutation {
    addUser(_: any, args: any): boolean;
    addUser2(args: {
        id: number;
        details: {
            age: number;
            name: string;
        };
    }): boolean;
    addUser3(this: never, args: AddUserArgs): boolean;
    addUser4({name, age}:{name: string, age: number}): boolean;
    arrayParams(_: any, [aio]: [any]): void;
    assignSimpleParam(_: any, a?: string): void;
    restParam(_: any, ...res: any[]): void;
};
