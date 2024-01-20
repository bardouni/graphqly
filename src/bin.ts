import fs from "fs";
import path from "path";
import yargs from "yargs";
import { hideBin } from 'yargs/helpers';
import transform from "./";

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
	      .option('destination', {
	        description: 'graphql.gql destination',
	      })
	      .option('tsconfig', {
	        description: 'tsconfig.json',
	        default: 'tsconfig.json'
	      })
	      .demandOption(['definition', 'destination', 'tsconfig']);
  	},
  	function (argv) {

  		try {

		    const schema = transform({
		    	definition: argv.definition,
		    	tsconfig: argv.tsconfig,
		    });

		    fs.writeFileSync(path.resolve(process.cwd(), argv.destination), schema);

  		} catch (e){
  			console.error(e);
  		}

	  }
	).parse();