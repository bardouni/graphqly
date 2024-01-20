type Obj = {
  name: string;
  obj2: Obj2;
  field(): Promise<string>
};
type Obj2 = {
  age: number;
};
export default class Query {
    custom() {return {} as Obj};
    optionalCustom() {return {} as Obj | null};
};
