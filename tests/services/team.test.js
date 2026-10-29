/* eslint-env node */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readSessionTeam, saveSessionTeam } from '../../src/services/team.js';
import { readSessionFavorites, saveSessionFavorites } from '../../src/services/favorites.js';

function setWindow(context, value) {
	const previous = Object.getOwnPropertyDescriptor(globalThis, 'window');
	globalThis.window = value;
	context.after(() => {
		if (previous) Object.defineProperty(globalThis, 'window', previous);
		else delete globalThis.window;
	});
}

test('teams survive reading again and clearing them preserves favorites', (context) => {
	const entries = new Map();
	setWindow(context, { sessionStorage: {
		getItem: (key) => entries.get(key) ?? null,
		setItem: (key, value) => entries.set(key, value),
		removeItem: (key) => entries.delete(key),
	} });
	assert.deepEqual(readSessionTeam(), []);
	assert.equal(saveSessionFavorites([700]), true);
	assert.equal(saveSessionTeam([25, 6]), true);
	assert.deepEqual(readSessionTeam(), [25, 6]);
	assert.equal(saveSessionTeam([]), true);
	assert.deepEqual(readSessionTeam(), []);
	assert.deepEqual(readSessionFavorites(), [700]);
});

test('saved teams reject invalid data, remove duplicates and enforce the team limit', (context) => {
	let stored;
	setWindow(context, { sessionStorage: {
		getItem: () => stored,
		setItem: (_, value) => { stored = value; },
	} });
	for (const value of ['invalid JSON', '{}', 'null']) {
		stored = value;
		assert.deepEqual(readSessionTeam(), []);
	}
	stored = '[25,25,-1,0,"6",null,1,2,3,4,5,6]';
	assert.deepEqual(readSessionTeam(), [25, 1, 2, 3, 4, 5]);
	assert.equal(saveSessionTeam([1, 2, 3, 4, 5, 6, 7]), true);
	assert.deepEqual(JSON.parse(stored), [1, 2, 3, 4, 5, 6]);
});

test('blocked session storage does not prevent using the team', (context) => {
	setWindow(context, { get sessionStorage() {
		throw new Error('Blocked');
	} });
	assert.deepEqual(readSessionTeam(), []);
	assert.equal(saveSessionTeam([25]), false);
});
