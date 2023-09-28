export declare type Q = {
	name: string;
};
export default class Query {
	string(): Promise<string>;
	void(): Promise<void>;
	type(): Promise<Q>;
	literal(): Promise<{
		a: string;
	}>;
};
