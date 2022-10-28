declare class Like{
	from: string
}
declare class User {
    name: string;
    likes(): Like[]
}
export default class Root {
    static Query: {
        user(): User;
    };
}
export {};