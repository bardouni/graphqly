export class Query {
    boolean(){
    	return true as boolean
    }
    string(){
    	return undefined as any as string;
    };
    int(){
    	return undefined as any as number;
    };
    float(){
    	return undefined as any as number;
    };
    optional(){
    	return undefined as any as boolean | null;
    };
    optionalUsingUndefined(){
    	return undefined as any as string | undefined;
    };
    any(){
    	return undefined as any;
    }
};

export class Mutation{
    addUser(){
    	return {
		    msg: "string" as string
		  }
    };
};