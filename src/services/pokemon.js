const PAGE_SIZE = 8;
const cache = new Map();

const typeColors = {
	grass: '#78a85b',
	fire: '#d77950',
	water: '#588fb8',
	bug: '#8b9948',
	normal: '#999080',
	poison: '#a269a8',
	electric: '#b99a32',
	ground: '#b29165',
	fairy: '#c57d9a',
	fighting: '#b76558',
	psychic: '#c96187',
	rock: '#9c9059',
	ghost: '#756595',
	ice: '#62a5ae',
	dragon: '#7761b8',
	dark: '#73665f',
	steel: '#818f9d',
	flying: '#8b90bd',
};

async function getResource(url) {
	if (!cache.has(url)) {
		const request = fetch(url)
			.then((response) => {
				if (!response.ok) throw new Error(`PokéAPI: HTTP ${response.status}`);
				return response.json();
			})
			.catch((error) => {
				cache.delete(url);
				throw error;
			});
		cache.set(url, request);
	}
	return cache.get(url);
}

export async function getPokemonPage(page) {
	const list = await getResource(
		`https://pokeapi.co/api/v2/pokemon?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`,
	);
	const pokemonList = await Promise.all(
		list.results.map(async ({ url }) => {
			const pokemon = await getResource(url);
			return {
				id: pokemon.id,
				name: pokemon.name,
				imgSrc:
					pokemon.sprites.other?.['official-artwork']?.front_default ||
					pokemon.sprites.front_default,
				color: typeColors[pokemon.types[0]?.type.name] || '#999080',
			};
		}),
	);
	return { pokemonList, next: list.next, totalPages: Math.ceil(list.count / PAGE_SIZE) };
}
