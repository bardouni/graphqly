export async function external(){
	const summary = [].reduce<{visits: number, installs: number, revenue: number}>((ac, cv) => {
		return ac;
	}, {
		visits: 0,
		installs: 0,
		revenue: 0,
	});
	return {
		summary,
		periods: [] as {node: Period}[],
		pageInfo:{
			startCursor: null as string|null,
			hasPreviousPage: false,

			endCursor: "something" as string|null,
			hasNextPage: false,
		}
	}
}

class Period {
	date: string
}