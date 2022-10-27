export default class Root {
    static Mutation: {
        addUser(_: any, args: {
            id: number;
            details: {
                age: number;
                name: string;
            };
        }): boolean;
    };
}
