type Int = number & {__gqly_type__: "Int"};
type ID = string & {__gqly_type__: "ID"};

export class Query {
  test(){
		const val = <Int>1.2;
  	return val;
  }
  testID(){
		const val = <ID>"hello";
  	return val;
  }
}