import transform from "./transform";
import fs from "fs";
import {readFiles} from "./utils";
import path from "path";

const args = process.argv.slice(2);

if(!args[0]){
	throw "entry file is required";
}

if(!args[1]){
	throw "packages.json path is required";
}

if(!args[3]){
	throw "destination path is required";
}


const schema = transform(args[0], args[1]);

fs.writeFileSync(path.resolve(process.cwd(), args[3]), schema);