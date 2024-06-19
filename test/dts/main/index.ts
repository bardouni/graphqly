
import Node, {Model, NonDef} from "./node";

export class Account extends Node {}

export class Query {
  user: Node;
  nodes = nodes;
  projects = projects;
}

export class User extends Node {}

export class Project extends NonDef {}

class Custom extends NonDef {
	customField: string
}

export class Test extends Model{
	id: string;
}

export {Node, NonDef};

type Ctx = {
	models:{
		Custom: typeof Custom
	}
};

async function nodes(args: {ids: string[]}) : Promise<(Node|null)[]>{
	return []
}

function projects(){
	return [] as Ctx["models"]["Custom"][];
}
