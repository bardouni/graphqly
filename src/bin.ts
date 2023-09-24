import transform from "./";
import fs from "fs";
import path from "path";
import yargs from "yargs";
import { hideBin } from 'yargs/helpers';

type Def = {
	definition: string
	package: string
	destination: string
	tsconfig: string
}

yargs(hideBin(process.argv))
  .command<Def>(
  	'run',
  	'Generates the schema',
  	function (yargs) {
	    return yargs
	      .option('definition', {
	        description: '.d.ts file',
	      })
	      .option('package', {
	        description: 'package.json',
	        default: 'package.json'
	      })
	      .option('destination', {
	        description: 'graphql.gql destination',
	      })
	      .option('tsconfig', {
	        description: 'tsconfig.json',
	        default: 'tsconfig.json'
	      })
	      .demandOption(['definition', 'package', 'destination', 'tsconfig']);
  	},
  	function (argv) {

  		try {

		    const schema = transform({
		    	definition: argv.definition,
		    	package: argv.package,
		    	tsconfig: argv.tsconfig,
		    });

		    fs.writeFileSync(path.resolve(process.cwd(), argv.destination), schema);

  		} catch (e){
  			console.error(e);
  		}

	  }
	).parse();