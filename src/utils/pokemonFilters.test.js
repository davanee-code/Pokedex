/* eslint-env node */
import assert from 'node:assert/strict';
import test from 'node:test';
import { matchesPokemonFilters, toggleSelection } from './pokemonFilters.js';

const pikachu = { types: ['electric'], speciesId: 25, speed: 90 };
const charizard = { types: ['fire', 'flying'], speciesId: 6, speed: 100 };
const emptyFilters = { types: [], generations: [], species: null, capabilities: [] };

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
