const API_URL = 'https://pokeapi.co/api/v2';
const FRENCH_NAMES_URL =
	'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_species_names.csv';

const cache = new Map();

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
	return {
		id: pokemon.id,
		name: pokemon.name,
		height: pokemon.height / 10,
		weight: pokemon.weight / 10,
		types: pokemon.types.map(({ type }) => type.name),
		speciesId: Number(pokemon.species?.url.split('/').filter(Boolean).pop()),
		speed: pokemon.stats?.find(({ stat }) => stat.name === 'speed')?.base_stat || 0,
		imgSrc:
			pokemon.sprites.other?.['official-artwork']?.front_default ||
			pokemon.sprites.front_default,
	};
}

export async function getGenerationSpecies(group) {
	const generations = await getResource(`${API_URL}/generation?limit=100`);
	const selected = generations.results.filter((_, index) => {
		if (group === 'first') return index === 0;
		if (group === 'middle') return index >= 1 && index <= 3;
		return index >= 4;
	});
	const details = await Promise.all(selected.map(({ url }) => getResource(url)));
	return new Set(
		details.flatMap(({ pokemon_species }) =>
			pokemon_species.map(({ url }) =>
				Number(url.split('/').filter(Boolean).pop()),
			),
		),
	);
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
