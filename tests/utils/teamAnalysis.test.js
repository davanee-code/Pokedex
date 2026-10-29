/* eslint-env node */
import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeTeam, getDamageMultiplier, getPokemonWeaknesses, getPokemonResistances } from '../../src/utils/teamAnalysis.js';

function relation(overrides = {}) {
	return { double_damage_from: [], half_damage_from: [], no_damage_from: [], double_damage_to: [], ...overrides };
}

test('card resistances include immunities first and combine dual types', () => {
	const typeRelations = {
		fire: relation({ half_damage_from: ['grass', 'water'], double_damage_from: ['rock'] }),
		flying: relation({ half_damage_from: ['grass', 'rock'], no_damage_from: ['ground'] }),
	};
	assert.deepEqual(getPokemonResistances(['fire', 'flying'], typeRelations), [
		{ type: 'ground', multiplier: 0 },
		{ type: 'grass', multiplier: 0.25 },
		{ type: 'water', multiplier: 0.5 },
	]);
	assert.deepEqual(getPokemonResistances(['normal'], { normal: relation() }), []);
});

const relations = {
	fire: relation({ double_damage_from: ['rock', 'water'], half_damage_from: ['grass'], double_damage_to: ['grass', 'ice'] }),
	flying: relation({ double_damage_from: ['rock'], half_damage_from: ['grass'], no_damage_from: ['ground'], double_damage_to: ['grass', 'fighting'] }),
	water: relation({ half_damage_from: ['water'], double_damage_to: ['fire'] }),
};

test('dual types multiply weaknesses and resistances and preserve immunity', () => {
	assert.equal(getDamageMultiplier(['fire', 'flying'], 'rock', relations), 4);
	assert.equal(getDamageMultiplier(['fire', 'flying'], 'grass', relations), 0.25);
	assert.equal(getDamageMultiplier(['fire', 'flying'], 'ground', relations), 0);
	assert.equal(getDamageMultiplier(['flying', 'fire'], 'ground', relations), 0);
	assert.equal(getDamageMultiplier(['fire'], 'normal', relations), 1);
});

test('opposite type effects cancel out', () => {
	assert.equal(getDamageMultiplier(['fire', 'water'], 'water', relations), 1);
});

test('card weaknesses put quadruple damage first and exclude neutral, resisted and immune attacks', () => {
	assert.deepEqual(getPokemonWeaknesses(['fire', 'flying'], relations), [
		{ type: 'rock', multiplier: 4 },
		{ type: 'water', multiplier: 2 },
	]);
	assert.deepEqual(getPokemonWeaknesses(['fire', 'water'], relations), [
		{ type: 'rock', multiplier: 2 },
	]);
	assert.deepEqual(getPokemonWeaknesses(['water'], relations), []);
});

test('analysis counts members, separates immunities and deduplicates coverage', () => {
	const team = [{ types: ['fire', 'flying'], stats: { speed: 100 } }, { types: ['fire'], stats: { speed: 60 } }];
	const result = analyzeTeam(team, relations);
	assert.deepEqual(result.defense.find(({ type }) => type === 'rock'), { type: 'rock', weak: 2, resistant: 0, immune: 0, quadruple: 1 });
	assert.equal(result.defense.find(({ type }) => type === 'ground').immune, 1);
	assert.deepEqual(result.coverage, ['grass', 'ice', 'fighting']);
	assert.equal(result.averages.find(({ stat }) => stat === 'speed').value, 80);
	assert.equal(result.averages.find(({ stat }) => stat === 'hp').value, null);
});

test('empty teams do not produce misleading averages', () => {
	const result = analyzeTeam([], {});
	assert.deepEqual(result.coverage, []);
	assert.ok(result.averages.every(({ value }) => value === null));
});
