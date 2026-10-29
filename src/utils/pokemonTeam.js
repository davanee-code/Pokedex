export const MAX_TEAM_SIZE = 6;

export function togglePokemonInTeam(teamIds, pokemonId) {
	if (teamIds.includes(pokemonId)) {
		return teamIds.filter((id) => id !== pokemonId);
	}
	if (teamIds.length >= MAX_TEAM_SIZE) {
		return teamIds;
	}
	return [...teamIds, pokemonId];
}
