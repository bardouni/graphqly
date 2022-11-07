type int = number & {__graphqly_type__: "Int"};

export default class Root {
  static Mutation: {
    addUser(_: {id: int}, args: any): boolean;
  };
}
