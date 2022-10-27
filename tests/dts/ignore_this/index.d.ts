declare type AddUserArgs = {
    id: number;
    details: {
        age: number;
        name: string;
    };
};
export default class Root {
    static Mutation: {
        addUser(this: never, _: any, args: AddUserArgs): boolean;
    };
}
export {};