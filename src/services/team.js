import { MAX_TEAM_SIZE } from '../utils/pokemonTeam.js';
import { readSessionPokemonIds, saveSessionPokemonIds } from './sessionStorage.js';

const TEAM_KEY = 'pokedex:team:v1';

export function readSessionTeam() {
	return readSessionPokemonIds(TEAM_KEY, MAX_TEAM_SIZE);
}

export function saveSessionTeam(ids) {
	return saveSessionPokemonIds(TEAM_KEY, ids.slice(0, MAX_TEAM_SIZE));
}
