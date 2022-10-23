import run from "./main";
import fs from "fs";
import {readFiles} from "./utils";
import path from "path";

const schema = run(process.argv.slice(2)[0]);

fs.writeFileSync(path.resolve(process.cwd(), "schema.gql"), schema);