export default class Root{
    static Query: {
        boolean(): boolean;
        string(): string;
        int(): number;
        float(): number;
        optional(): boolean | null;
        optionalUsingUndefined(): string | undefined;
    };
}