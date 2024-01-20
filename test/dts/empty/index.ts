export class Query {
  null(_: any, tp: any, ctx: any){
  	return {} as any as null;
  }
  undefined(_: any, tp: any, ctx: any){
  	return {} as any as undefined;
  }
  void(_: any, tp: any, ctx: any){
  	return {} as any as void;
  }
  emptyReturn(){
  	return {} as any as void;
  }
  explicitNullOrUndefined(){
  	return {} as any as null | undefined;
  }
};