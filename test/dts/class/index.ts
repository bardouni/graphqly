class Like{
	from: string
}
class User {
  name: string;
  likes(){
  	return [] as Like[];
  }
}
export default class Query {
  user() {
  	return {} as User;
  };
  user2() {
  	return {} as User;
  }; // avoid duplication
};
export {};