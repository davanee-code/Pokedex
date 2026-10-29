import { pokemonTypeNames } from './pokemonTypes.js';

export const statNames = {
	hp: 'PV',
	attack: 'Attaque',
	defense: 'Défense',
	'special-attack': 'Attaque spéciale',
	'special-defense': 'Défense spéciale',
	speed: 'Vitesse',
};

export function getDamageMultiplier(types, attackType, relations) {
	return types.reduce((multiplier, type) => {
		const relation = relations[type];
		if (relation.no_damage_from.includes(attackType)) return 0;
		if (relation.double_damage_from.includes(attackType)) return multiplier * 2;
		if (relation.half_damage_from.includes(attackType)) return multiplier / 2;
		return multiplier;
	}, 1);
}

export function getPokemonWeaknesses(types, relations) {
	return Object.keys(pokemonTypeNames)
		.map((type) => ({ type, multiplier: getDamageMultiplier(types, type, relations) }))
		.filter(({ multiplier }) => multiplier > 1)
		.sort((left, right) => right.multiplier - left.multiplier);
}

export function getPokemonResistances(types, relations) {
	return Object.keys(pokemonTypeNames)
		.map((type) => ({ type, multiplier: getDamageMultiplier(types, type, relations) }))
		.filter(({ multiplier }) => multiplier < 1)
		.sort((left, right) => left.multiplier - right.multiplier);
}

export function analyzeTeam(pokemon, relations) {
	const types = [...new Set(pokemon.flatMap((member) => member.types))];
	const defense = Object.keys(pokemonTypeNames).map((type) => {
		const multipliers = pokemon.map((member) =>
			getDamageMultiplier(member.types, type, relations)
		);
		return {
			type,
			weak: multipliers.filter((value) => value > 1).length,
			resistant: multipliers.filter((value) => value > 0 && value < 1).length,
			immune: multipliers.filter((value) => value === 0).length,
			quadruple: multipliers.filter((value) => value === 4).length,
		};
	});
	const coverage = [
		...new Set(types.flatMap((type) => relations[type].double_damage_to)),
	];
	const averages = Object.keys(statNames).map((stat) => {
		const values = pokemon.map((member) => member.stats?.[stat]);
		if (!values.length || values.some((value) => !Number.isFinite(value) || value < 0)) {
			return { stat, value: null };
		}
		const total = values.reduce((sum, value) => sum + value, 0);
		return { stat, value: Math.round(total / values.length) };
	});
	return { types, defense, coverage, averages };
}
