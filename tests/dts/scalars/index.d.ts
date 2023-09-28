export class Query {
    boolean(): boolean;
    string(): string;
    int(): number;
    float(): number;
    optional(): boolean | null;
    optionalUsingUndefined(): string | undefined;
    any(): any;
};

export class Mutation{
    addUser(): {
        msg: string;
    };
};