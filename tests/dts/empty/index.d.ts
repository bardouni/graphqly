export default class Root {
    static Query: {
        null(_: any, tp: any, ctx: any): null;
        undefined(_: any, tp: any, ctx: any): undefined;
        void(_: any, tp: any, ctx: any): void;
        emptyReturn(): void;
        explicitNullOrUndefined(): null | undefined;
    };
}