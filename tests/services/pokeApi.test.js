/* eslint-env node */
import assert from 'node:assert/strict';
import test from 'node:test';
import { getGenerationSpecies, getPokemon, getPokemonList, getTypeRelations } from '../../src/services/pokeApi.js';

function pokemonResponse(id) {
	return {
		id,
		height: 4,
		weight: 60,
		types: [{ type: { name: 'electric' } }],
		species: { url: `https://pokeapi.co/api/v2/pokemon-species/${id}/` },
		stats: [{ stat: { name: 'speed' }, base_stat: 90 }],
	};
}

function jsonResponse(data, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

test('Pokémon details convert units and support missing images', async (context) => {
	context.mock.method(globalThis, 'fetch', async () => jsonResponse(pokemonResponse(25)));
	const pokemon = await getPokemon(25);
	assert.equal(pokemon.height, 0.4);
	assert.equal(pokemon.weight, 6);
	assert.deepEqual(pokemon.types, ['electric']);
	assert.equal(pokemon.speciesId, 25);
	assert.equal(pokemon.stats.speed, 90);
	assert.equal(pokemon.imgSrc, null);
});

test('simultaneous requests and subsequent reads share one network request', async (context) => {
	const fetchMock = context.mock.method(globalThis, 'fetch', async () => jsonResponse(pokemonResponse(26)));
	const [first, second] = await Promise.all([getPokemon(26), getPokemon(26)]);
	assert.deepEqual(first, second);
	assert.deepEqual(await getPokemon(26), first);
	assert.equal(fetchMock.mock.callCount(), 1);
});

test('failed HTTP requests can be retried', async (context) => {
	let requests = 0;
	context.mock.method(globalThis, 'fetch', async () => {
		requests += 1;
		return requests === 1 ? jsonResponse({}, 503) : jsonResponse(pokemonResponse(27));
	});
	await assert.rejects(getPokemon(27), /HTTP 503/);
	assert.equal((await getPokemon(27)).id, 27);
	assert.equal(requests, 2);
});

test('malformed Pokémon data are rejected and do not poison the cache', async (context) => {
	let requests = 0;
	context.mock.method(globalThis, 'fetch', async () => {
		requests += 1;
		return jsonResponse(requests === 1 ? { id: 28, types: null } : pokemonResponse(28));
	});
	await assert.rejects(getPokemon(28), /invalides/);
	assert.equal((await getPokemon(28)).id, 28);
});

test('missing search values are rejected before fetching', async (context) => {
	const fetchMock = context.mock.method(globalThis, 'fetch', async () => {
		throw new Error('Unexpected request');
	});
	for (const value of [null, undefined, '', '  ']) {
		await assert.rejects(getPokemon(value), /Veuillez saisir/);
	}
	assert.equal(fetchMock.mock.callCount(), 0);
});

test('malformed type relations fail gracefully and can be retried', async (context) => {
	let requests = 0;
	context.mock.method(globalThis, 'fetch', async () => {
		requests += 1;
		if (requests === 1) return jsonResponse(null);
		return jsonResponse({ damage_relations: {
			double_damage_from: [{ name: 'water' }],
			half_damage_from: [],
			no_damage_from: [],
			double_damage_to: [{ name: 'grass' }],
		} });
	});
	await assert.rejects(getTypeRelations('fire'), /invalides/);
	assert.deepEqual((await getTypeRelations('fire')).double_damage_from, ['water']);
});

test('type relations share pending requests and remain cached for other components', async (context) => {
	let respond;
	const fetchMock = context.mock.method(globalThis, 'fetch', () => new Promise((resolve) => {
		respond = resolve;
	}));
	const first = getTypeRelations('water');
	const second = getTypeRelations('water');
	assert.equal(fetchMock.mock.callCount(), 1);
	respond(jsonResponse({ damage_relations: {
		double_damage_from: [], half_damage_from: [], no_damage_from: [], double_damage_to: [],
	} }));
	assert.deepEqual(await first, await second);
	await getTypeRelations('water');
	assert.equal(fetchMock.mock.callCount(), 1);
});

test('generation filters reuse both the generation index and species details', async (context) => {
	const generationUrl = 'https://pokeapi.co/api/v2/generation/1/';
	const fetchMock = context.mock.method(globalThis, 'fetch', async (url) => {
		if (url === generationUrl) {
			return jsonResponse({ pokemon_species: [{ name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon-species/25/' }] });
		}
		return jsonResponse({ results: [{ name: 'generation-i', url: generationUrl }] });
	});
	const [first, second] = await Promise.all([getGenerationSpecies('first'), getGenerationSpecies('first')]);
	assert.deepEqual([...first], [25]);
	assert.deepEqual(second, first);
	await getGenerationSpecies('first');
	assert.equal(fetchMock.mock.callCount(), 2);
});

test('translated lists are shared and retry only failed resources', async (context) => {
	const requests = [];
	let translationAttempts = 0;
	context.mock.method(globalThis, 'fetch', async (url) => {
		requests.push(url);
		if (url.includes('/pokemon?')) {
			return jsonResponse({ results: [{ name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' }], next: null });
		}
		translationAttempts += 1;
		if (translationAttempts === 1) return jsonResponse({}, 503);
		return new Response('pokemon_species_id,local_language_id,name,genus\n25,5,Pikachu,Souris\n');
	});
	const failed = await Promise.allSettled([getPokemonList(), getPokemonList()]);
	assert.ok(failed.every(({ status }) => status === 'rejected'));
	const [first, second] = await Promise.all([getPokemonList(), getPokemonList()]);
	assert.deepEqual(first, [{ id: 25, name: 'pikachu', displayName: 'Pikachu' }]);
	assert.strictEqual(first, second);
	assert.strictEqual(await getPokemonList(), first);
	assert.equal(requests.filter((url) => url.includes('/pokemon?')).length, 1);
	assert.equal(translationAttempts, 2);
});
