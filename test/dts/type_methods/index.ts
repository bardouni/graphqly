type Obj = {
  name: number
}
function func(params: {
    id: number;
}){
	return "omse";
};
function func2(){
	return {name: "string"}
};
function func3(){
	return {} as Obj;
};
export default class Query {
  custom(_: any, args: any){
  	return {} as Obj;
  }
  static func = func;
  static func2 = func2;
  static func3 = func3;
};
export {};