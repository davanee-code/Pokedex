/* eslint-env node */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readSessionFavorites, saveSessionFavorites } from '../../src/services/favorites.js';

test('session favorites persist only IDs and clear only their own storage key', () => {
	const entries = new Map([['unrelated', 'keep']]);
	globalThis.window = { sessionStorage: {
		getItem: (key) => entries.get(key) ?? null,
		setItem: (key, value) => entries.set(key, value),
		removeItem: (key) => entries.delete(key),
	} };
	assert.deepEqual(readSessionFavorites(), []);
	assert.equal(saveSessionFavorites([25, 700]), true);
	assert.deepEqual(readSessionFavorites(), [25, 700]);
	assert.equal(saveSessionFavorites([]), true);
	assert.deepEqual([...entries], [['unrelated', 'keep']]);
	delete globalThis.window;
});

test('malformed or invalid saved data cannot break the gallery', () => {
	for (const [raw, expected] of [
		['invalid JSON', []], ['{}', []],
		['[25,25,-1,0,"700",null,700]', [25, 700]],
	]) {
		globalThis.window = { sessionStorage: { getItem: () => raw } };
		assert.deepEqual(readSessionFavorites(), expected);
	}
	delete globalThis.window;
});

test('blocked session storage fails gracefully without a fallback tracker', () => {
	globalThis.window = { get sessionStorage() { throw new Error('Blocked'); } };
	assert.deepEqual(readSessionFavorites(), []);
	assert.equal(saveSessionFavorites([25]), false);
	delete globalThis.window;
});
