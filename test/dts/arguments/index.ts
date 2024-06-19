type AddUserArgs = {
  id: number;
  details: {
    age: number;
    name: string;
  };
};
export class Mutation {
  addUser(_: any, args: any){return true};
  addUser2(args: {
      id: number;
    details: {
        age: number;
        name: string;
    };
	}){return true};
  addUser3(this: never, args: AddUserArgs){return true};
  addUser4({name, age}:{name: string, age: number}){return true};
  arrayParams(_: any, [aio]: [any]){}
  assignSimpleParam(_: any, a?: string){}
  restParam(_: any, ...res: any[]){}
};
