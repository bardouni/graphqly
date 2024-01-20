
import Node, {Model, NonDef} from "./node";

export class Account extends Node {}

export class Query {
  user: Node;
  static nodes = nodes;
}

export class User extends Node {}

export class Project extends NonDef {}

export class Test extends Model{
	id: string;
}

export {Node, NonDef};

async function nodes(args: {ids: string[]}) : Promise<(Node|null)[]>{
	return []
}
