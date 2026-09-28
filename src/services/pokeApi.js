const API_URL = 'https://pokeapi.co/api/v2';
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
				if (response.status === 404) {
					throw new Error('Aucun Pokémon trouvé.');
				}

				if (!response.ok) {
					throw new Error(`PokéAPI : erreur HTTP ${response.status}`);
				}

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

function formatPokemon(pokemon) {
	const primaryType = pokemon.types[0]?.type.name;

	return {
		id: pokemon.id,
		name: pokemon.name,
		imgSrc:
			pokemon.sprites.other?.['official-artwork']?.front_default ||
			pokemon.sprites.front_default,
		color: typeColors[primaryType] || typeColors.normal,
	};
}

export async function getPokemonPage(page = 0) {
	const offset = page * PAGE_SIZE;

	const list = await getResource(
		`${API_URL}/pokemon?limit=${PAGE_SIZE}&offset=${offset}`,
	);

	const pokemonList = await Promise.all(
		list.results.map(async ({ url }) => {
			const pokemon = await getResource(url);
			return formatPokemon(pokemon);
		}),
	);

	return {
		pokemonList,
		hasNextPage: Boolean(list.next),
		totalPages: Math.ceil(list.count / PAGE_SIZE),
	};
}

export async function getPokemon(nameOrId) {
	const searchValue = nameOrId.toString().trim().toLowerCase();

	if (!searchValue) {
		throw new Error('Veuillez saisir un nom ou un numéro.');
	}

	const pokemon = await getResource(
		`${API_URL}/pokemon/${encodeURIComponent(searchValue)}`,
	);

	return formatPokemon(pokemon);
}
