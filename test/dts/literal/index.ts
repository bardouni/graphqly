export declare type Obj = {
  name: string;
  nested: {
    field: string;
  };
  optionalNested: null | {
    field: string;
  };
};
export class Query {
    q(){
    	return {} as Obj;
    };
};

