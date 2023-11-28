export declare class Account extends Node_2 {
}
class Model {

}
export declare class Node_2 extends Model {
    id: string;
}
export { Node_2 as Node }

export declare class Query {
    user: Node_2;
    static nodes: typeof nodes;
}

export declare class User extends Node_2 {
}

export class Test extends Model{
	id: string
}

declare function nodes(args: {
    ids: string[];
}): Promise<(Node_2 | null)[]>;

export { }
