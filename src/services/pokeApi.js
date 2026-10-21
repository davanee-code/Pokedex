const API_URL = 'https://pokeapi.co/api/v2';
const PAGE_SIZE = 8;
const FRENCH_NAMES_URL = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_species_names.csv';

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

async function getResource(url, format = 'json') {
	if (!cache.has(url)) {
		const request = fetch(url)
			.then((response) => {
				if (response.status === 404) {
					throw new Error('Aucun Pokémon trouvé.');
				}

				if (!response.ok) {
					throw new Error(`PokéAPI : erreur HTTP ${response.status}`);
				}

				return format === 'text' ? response.text() : response.json();
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

export async function getPokemonList() {
	const results = [];
	let url = `${API_URL}/pokemon?limit=2000`;

	while (url) {
		const page = await getResource(url);
		results.push(...page.results);
		url = page.next;
	}

	// Official PokéAPI translations avoid one species request per Pokémon.
	const translations = await getResource(FRENCH_NAMES_URL, 'text');
	const frenchNames = new Map();
	for (const line of translations.split(/\r?\n/)) {
		const match = line.match(/^(\d+),5,("(?:[^"]|"")*"|[^,]*),/);
		if (match) {
			const name = match[2].replace(/^"|"$/g, '').replace(/""/g, '"');
			frenchNames.set(Number(match[1]), name);
		}
	}

	return results.map(({ name, url }) => {
		const id = Number(url.split('/').filter(Boolean).pop());
		return { name, id, displayName: frenchNames.get(id) || name };
	});
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
