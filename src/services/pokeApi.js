const API_URL = 'https://pokeapi.co/api/v2';
const FRENCH_NAMES_URL =
	'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_species_names.csv';

const cache = new Map();
let pokemonListRequest = null;

async function getResource(url, { format = 'json', validate } = {}) {
	if (!cache.has(url)) {
		// Cache the pending promise so concurrent callers share the same request.
		const request = fetch(url, { signal: AbortSignal.timeout(15000) })
			.then((response) => {
				if (response.status === 404) {
					throw new Error('Aucun Pokémon trouvé.');
				}

				if (!response.ok) {
					throw new Error(`PokéAPI : erreur HTTP ${response.status}`);
				}

				return format === 'text' ? response.text() : response.json();
			})
			.then((data) => {
				if (validate && !validate(data)) {
					throw new Error('Les données reçues de PokéAPI sont invalides.');
				}
				return data;
			})
			.catch((error) => {
				cache.delete(url);
				throw error;
			});

		cache.set(url, request);
	}

	return cache.get(url);
}

function isResourceList(data) {
	return Array.isArray(data) && data.every(
		(entry) => typeof entry?.name === 'string' && typeof entry?.url === 'string'
	);
}

function isPokemon(data) {
	return Number.isSafeInteger(data?.id) && data.id > 0 &&
		Number.isFinite(data.height) && data.height >= 0 &&
		Number.isFinite(data.weight) && data.weight >= 0 &&
		typeof data.species?.url === 'string' &&
		Array.isArray(data.types) && data.types.length > 0 &&
		data.types.every((entry) => typeof entry?.type?.name === 'string') &&
		Array.isArray(data.stats) && data.stats.every(
			(entry) => typeof entry?.stat?.name === 'string' &&
				Number.isFinite(entry.base_stat) && entry.base_stat >= 0
		);
}

function formatPokemon(pokemon) {
	return {
		id: pokemon.id,
		height: pokemon.height / 10,
		weight: pokemon.weight / 10,
		stats: Object.fromEntries(
			pokemon.stats.map(({ stat, base_stat }) => [stat.name, base_stat])
		),
		types: pokemon.types.map(({ type }) => type.name),
		speciesId: Number(pokemon.species?.url.split('/').filter(Boolean).pop()),
		speed: pokemon.stats?.find(({ stat }) => stat.name === 'speed')?.base_stat || 0,
		imgSrc:
			pokemon.sprites?.other?.['official-artwork']?.front_default ||
			pokemon.sprites?.front_default || null,
	};
}

export async function getTypeRelations(type) {
	const keys = [
		'double_damage_from',
		'half_damage_from',
		'no_damage_from',
		'double_damage_to',
	];
	const data = await getResource(`${API_URL}/type/${encodeURIComponent(type)}`, {
		validate: (data) => keys.every((key) =>
			Array.isArray(data?.damage_relations?.[key]) &&
			data.damage_relations[key].every((entry) => typeof entry?.name === 'string')
		),
	});
	const relations = data.damage_relations;
	return Object.fromEntries(
		keys.map((key) => [key, relations[key].map(({ name }) => name)])
	);
}

export async function getGenerationSpecies(group) {
	const generations = await getResource(`${API_URL}/generation?limit=100`, {
		validate: (data) => isResourceList(data?.results),
	});
	const selected = generations.results.filter((_, index) => {
		if (group === 'first') return index === 0;
		if (group === 'middle') return index >= 1 && index <= 3;
		return index >= 4;
	});
	const details = await Promise.all(selected.map(({ url }) => getResource(url, {
		validate: (data) => isResourceList(data?.pokemon_species),
	})));
	return new Set(
		details.flatMap(({ pokemon_species }) =>
			pokemon_species.map(({ url }) => Number(url.split('/').filter(Boolean).pop()))
		)
	);
}

export function getPokemonList() {
	if (!pokemonListRequest) {
		// Reuse the translated list as well as the underlying HTTP responses.
		pokemonListRequest = loadPokemonList().catch((error) => {
			pokemonListRequest = null;
			throw error;
		});
	}
	return pokemonListRequest;
}

async function loadPokemonList() {
	const results = [];
	let url = `${API_URL}/pokemon?limit=2000`;

	while (url) {
		const page = await getResource(url, {
			validate: (data) => isResourceList(data?.results) &&
				(data.next === null || typeof data.next === 'string'),
		});
		results.push(...page.results);
		url = page.next;
	}

	// Official PokéAPI translations avoid one species request per Pokémon.
	const translations = await getResource(FRENCH_NAMES_URL, { format: 'text' });
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
	const searchValue = String(nameOrId ?? '').trim().toLowerCase();

	if (!searchValue) {
		throw new Error('Veuillez saisir un nom ou un numéro.');
	}

	const pokemon = await getResource(
		`${API_URL}/pokemon/${encodeURIComponent(searchValue)}`,
		{ validate: isPokemon }
	);

	return formatPokemon(pokemon);
}
