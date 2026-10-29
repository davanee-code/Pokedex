export function toggleSelection(selection, value) {
	return selection.includes(value)
		? selection.filter((item) => item !== value)
		: [...selection, value];
}

export function comparePokemon(left, right, sort) {
	if (sort === 'name') return left.displayName.localeCompare(right.displayName, 'fr');
	if (sort === 'id-desc') return right.id - left.id;
	return left.id - right.id;
}

export function matchesPokemonFilters(
	pokemon,
	{ types, generations, species, capabilities },
) {
	if (types.length && !types.some((type) => pokemon.types.includes(type))) return false;
	if (generations.length && !species?.has(pokemon.speciesId)) return false;
	if (capabilities.length) {
		return capabilities.some(
			(capability) =>
				(capability === 'fast' && pokemon.speed >= 100) ||
				(capability === 'dual' && pokemon.types.length >= 2),
		);
	}
	return true;
}
