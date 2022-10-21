
export type A = {
	id: string
	acc?
	nest:{
		age: string
		multiNest:{
			address: string|null
			nonNullAddress: string
		}
	}
}

type Q = {
	name: string
};

type mutationArgs = {
	id: number
	name: string
}

export default class {

	static Mutation = {
		async updateUser(_, opts: mutationArgs){
			return {
				id: opts.id,
				name: opts.name,
				nullName: opts.name as string|null
			}
		}
	}

	static Query = {

		this(this: never, _){},
		// arrayParams(_, [aio]){}, // not supported
		assignObjectParam(_, a = {}){},
		literalParam(_, a : {a: string, complex: A}){},
		// assignSimpleParam(_, a = ""){}, // not supported
		unknownParamType(_, a){},
		// restParam(_, ...res){}, // not supported
		// restParam(_, {...rest}){},


		user(_, tp, ctx){
			let a = {
				id: tp.id,
				age: tp.nest.age as number,
				name: "userName" as string
			};
			return a as typeof a|null;
		},
		async emptyAsync(){},

		multiReturnWithExplicit(_, tp, ctx){
			if(true){
				return null;
			}
			return "hello" as string;
		},
		multiReturnWithoutExplicit(_, tp, ctx){
			if(true){
				return null;
			}
			return "hello" as string;
		},

		explicitStringOrNull(_, tp, ctx){
			return "hello" as string|null
		},
		explicitStringOrUndefined(_, tp, ctx){
			return "hello" as string|undefined;
		},
		string(_, tp, ctx){
			return "hello";
		},
		explicitString(_, tp, ctx){
			return "hello" as string;
		},

		number(){
			return 23;
		},

		null(_, tp, ctx){
			return null;
		},
		undefined(_, tp, ctx){
			return undefined;
		},
		void(_, tp, ctx){},
		emptyReturn(){return},
		explicitNullOrUndefined(){
			return null as null|undefined;
		},

		noArgs(){
			return 22;
		},
		typeOrNull(_, tp, ctx){
			let a : Q|null = null as any;
			return a;
		},
		nonNulltype(_, tp, ctx): Q{
			return undefined as any;
		},
	}


}
