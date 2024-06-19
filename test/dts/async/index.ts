type Q = {
	name: string;
}
export class Query {
	string(){
		return new Promise<string>(resolve => resolve(""));
	};
	void(){return new Promise<void>(resolve => {})};
	type(){return new Promise<Q>(resolve => {})};
	literal(){
		return {} as Promise<{a: string}>;
	};
};
