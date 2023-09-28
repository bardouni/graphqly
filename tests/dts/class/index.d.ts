declare class Like{
	from: string
}
declare class User {
    name: string;
    likes(): Like[]
}
export default class Query {
    user(): User;
    user2(): User; // avoid duplication
};
export {};