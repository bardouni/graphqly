import { Extractor, ExtractorConfig } from "@microsoft/api-extractor";
import fs from "fs";
import path from "path";
import { handleDTS } from "./parse";

type TransformOptions = {
	definition: string
	package: string
	tsconfig: string
};

export default function transform(opts: TransformOptions){

	const cwd = process.cwd();

	const configObjectFullPath = path.resolve(__dirname, `../../src/api-extractor.json`);
	const packageJsonFullPath = path.resolve(cwd, opts.package);
	const tsconfigFilePath = path.resolve(cwd, opts.tsconfig);

	const extractorConfig = ExtractorConfig.loadFile(configObjectFullPath);
	extractorConfig.mainEntryPointFilePath = path.resolve(cwd, opts.definition);
	extractorConfig.compiler!.tsconfigFilePath = tsconfigFilePath;

	const econfig = ExtractorConfig.prepare({
		configObject: extractorConfig,
		configObjectFullPath: configObjectFullPath,
		packageJsonFullPath: packageJsonFullPath,
	});

	Extractor.invoke(econfig);

	const outFilePath = path.resolve(__dirname, "./../../dist/out.d.ts");

	const content = fs.readFileSync(outFilePath, "utf-8");

	return handleDTS(
		content,
		tsconfigFilePath,
		outFilePath,
	);

}
