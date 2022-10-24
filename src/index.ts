import transform from "./transform";
import fs from "fs";
import {readFiles} from "./utils";
import path from "path";

const args = process.argv.slice(2);

const file = args[0];

if(!file){
	throw "entry file is required";
}

const schema = transform(file);

fs.writeFileSync(
	args[1] ?
		path.resolve(process.cwd(), args[1]) :
		path.resolve(process.cwd(), path.dirname(file), "schema.gql"),
	schema
);