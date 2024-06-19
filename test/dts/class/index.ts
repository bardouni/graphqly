class Like{
	from: string
}
class User {
  name: string;
  likes(){
  	return [] as Like[];
  }
}
export class Query {
	static field(){
		return "hello world"
	}
  user() {
  	return {} as User;
  };
  user2() {
  	return {} as User;
  }; // avoid duplication
};
export {};