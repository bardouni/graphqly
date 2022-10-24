import transform from "./transform";
import fs from "fs";
import {readFiles} from "./utils";
import path from "path";

const file = process.argv.slice(2)[0];
if(!file){
	throw "entry file is required";
}

const schema = transform(file);

fs.writeFileSync(
	path.resolve(process.cwd(), path.dirname(file), "schema.gql"),
	schema
);