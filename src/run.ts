import run from "./main";
import fs from "fs";
import {readFiles} from "./utils";

console.log(
	run(
		"a.ts",
		{
			readFile: readFiles({
				"a.ts":`
					import {a} from "./b";
					export default class {
						static Query = {
							hi(){
								return "hi";
							},
							...a,
						}
					}
				`,
				[process.cwd() + "/b.ts"]:`
					type T = {
						name: string
					}
					/* to test this / shouldnt be outputed */
					type B = {
						id: number
					}
					export default class {
						static Query = {
							duplicate(){
								return "hi";
							}
						}
					}
					/* end */
					export const a = {
						name(_, a: T){
							return null as T;
						}
					}
				`
			})
		}
	)
);