import fs from "fs";
import path from "path";
import * as mo from "ts-morph";
import * as ts from "typescript";
import { handleDTS } from "./parse";

type TransformOptions = {
	definition: string
	tsconfig: string
};

export default function transform(opts: TransformOptions){

	const cwd = process.cwd();

	const tsConfigPath = path.resolve(cwd, opts.tsconfig);
	const config = ts.parseConfigFileTextToJson(tsConfigPath, fs.readFileSync(tsConfigPath, 'utf8'));
	const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(tsConfigPath));

	// Creating a TypeScript program instance
	const program = ts.createProgram(parsed.fileNames, parsed.options);
	const checker = program.getTypeChecker();

	// const files = program.getRootFileNames();

	const def = path.resolve(cwd, opts.definition);

  const sourceFile = program.getSourceFile(def);

  if (!sourceFile) {
  	throw new Error("can't find schema file at: " + def);
  }

  const project = new mo.Project({
    tsConfigFilePath: tsConfigPath
  });

  const file = project.getSourceFile(def)!;

  const [getFieldType, toString] = handleDTS(program, checker);

  file.getExportedDeclarations().forEach(exp => {
  	let cl = exp[0];
  	if(mo.Node.isClassDeclaration(cl)){
			const name = cl.getName()!;
			if(
				!["Mutation", "Query", "Subscription"].includes(name) &&
	  		!cl.isExported()
			){
				return;
			}
			getFieldType(
				name,
				cl.getType(),
				"type",
				true
			);
  	}
  });

  return toString();

}
