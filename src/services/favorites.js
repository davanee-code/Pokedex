import { readSessionPokemonIds, saveSessionPokemonIds } from './sessionStorage.js';

const FAVORITES_KEY = 'pokedex:favorites:v1';

export function readSessionFavorites() {
	return readSessionPokemonIds(FAVORITES_KEY);
}

export function saveSessionFavorites(ids) {
	return saveSessionPokemonIds(FAVORITES_KEY, ids);
}
