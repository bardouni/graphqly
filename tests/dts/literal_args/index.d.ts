export default class Root {
    static Mutation: {
        addUser(args: {
            id: number;
            details: {
                age: number;
                name: string;
            };
        }): boolean;
    };
}
