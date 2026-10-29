/* eslint-env node */
import assert from 'node:assert/strict';
import test from 'node:test';
import { comparePokemon, matchesPokemonFilters, toggleSelection } from '../../src/utils/pokemonFilters.js';

const pikachu = { types: ['electric'], speciesId: 25, speed: 90 };
const charizard = { types: ['fire', 'flying'], speciesId: 6, speed: 100 };
const emptyFilters = { types: [], generations: [], species: null, capabilities: [] };

test('metadata sorting orders all results before pagination without mutating the source', () => {
	const entries = [
		{ id: 25, displayName: 'Pikachu' },
		{ id: 1, displayName: 'Bulbizarre' },
		{ id: 7, displayName: 'Carapuce' },
	];
	assert.deepEqual([...entries].sort((a, b) => comparePokemon(a, b, 'id-asc')).slice(0, 2).map(({ id }) => id), [1, 7]);
	assert.deepEqual([...entries].sort((a, b) => comparePokemon(a, b, 'id-desc')).slice(0, 2).map(({ id }) => id), [25, 7]);
	assert.deepEqual([...entries].sort((a, b) => comparePokemon(a, b, 'name')).map(({ id }) => id), [1, 7, 25]);
	assert.deepEqual(entries.map(({ id }) => id), [25, 1, 7]);
});

test('toggle adds and removes one choice while preserving the others', () => {
	const selected = ['electric'];
	assert.deepEqual(toggleSelection(selected, 'fire'), ['electric', 'fire']);
	assert.deepEqual(toggleSelection(['electric', 'fire'], 'fire'), ['electric']);
	assert.deepEqual(selected, ['electric']);
});

test('empty categories allow all Pokémon', () => {
	assert.equal(matchesPokemonFilters(pikachu, emptyFilters), true);
});

test('types within a category use OR', () => {
	const filters = { ...emptyFilters, types: ['electric', 'fire'] };
	assert.equal(matchesPokemonFilters(pikachu, filters), true);
	assert.equal(matchesPokemonFilters(charizard, filters), true);
	assert.equal(matchesPokemonFilters({ ...pikachu, types: ['water'] }, filters), false);
});

test('different categories use AND and generation accepts the species union', () => {
	const filters = { ...emptyFilters, types: ['electric', 'fire'], generations: ['first', 'later'], species: new Set([25, 700]) };
	assert.equal(matchesPokemonFilters(pikachu, filters), true);
	assert.equal(matchesPokemonFilters(charizard, filters), false);
	assert.equal(matchesPokemonFilters({ ...pikachu, types: ['water'] }, filters), false);
});

test('capabilities use OR and combine with the other categories', () => {
	const filters = { ...emptyFilters, capabilities: ['fast', 'dual'] };
	assert.equal(matchesPokemonFilters(pikachu, filters), false);
	assert.equal(matchesPokemonFilters({ ...pikachu, speed: 100 }, filters), true);
	assert.equal(matchesPokemonFilters({ ...pikachu, types: ['electric', 'normal'] }, filters), true);
	assert.equal(matchesPokemonFilters(charizard, { ...filters, types: ['water'] }), false);
});
