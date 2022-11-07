declare type Obj = {
    name(args: {format: string; }): number;
};
declare function func(params: {
    id: number;
}): string;
export default class Root {
  Query: {
      custom(_: any, args: any): Obj;
      func: typeof func
  };
}
export {};