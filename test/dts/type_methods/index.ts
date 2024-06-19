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
export class Query {
  custom(_: any, args: any){
  	return {} as Obj;
  }
  func = func;
  func2 = func2;
  func3 = func3;
};
export {};