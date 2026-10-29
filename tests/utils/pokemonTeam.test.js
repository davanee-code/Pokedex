/* eslint-env node */
import assert from 'node:assert/strict';
import test from 'node:test';
import { togglePokemonInTeam, MAX_TEAM_SIZE } from '../../src/utils/pokemonTeam.js';

test('adds a Pokémon without changing the previous team', () => {
	const team = [25];
	assert.deepEqual(togglePokemonInTeam(team, 6), [25, 6]);
	assert.deepEqual(team, [25]);
});

test('clicking a selected Pokémon removes it without changing the previous team', () => {
	const team = [25, 6];
	assert.deepEqual(togglePokemonInTeam(team, 25), [6]);
	assert.deepEqual(team, [25, 6]);
});

test('a full team allows removal and then another addition', () => {
	const team = [1, 2, 3, 4, 5, 6];
	const smallerTeam = togglePokemonInTeam(team, 3);
	assert.deepEqual(smallerTeam, [1, 2, 4, 5, 6]);
	assert.deepEqual(togglePokemonInTeam(smallerTeam, 7), [1, 2, 4, 5, 6, 7]);
});

test('allows the sixth Pokémon and refuses subsequent additions', () => {
	const team = [1, 2, 3, 4, 5];
	const fullTeam = togglePokemonInTeam(team, 6);
	assert.equal(fullTeam.length, MAX_TEAM_SIZE);
	assert.deepEqual(togglePokemonInTeam(fullTeam, 7), [1, 2, 3, 4, 5, 6]);
});
