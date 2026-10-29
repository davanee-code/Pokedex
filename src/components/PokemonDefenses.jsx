import { useEffect, useId, useState } from 'react';
import PropTypes from 'prop-types';
import { getTypeRelations } from '../services/pokeApi';
import { getPokemonWeaknesses, getPokemonResistances } from '../utils/teamAnalysis';
import { pokemonTypeNames } from '../utils/pokemonTypes';
import TypeIcon from './TypeIcon';

const resistanceLabels = { 0: '×0', 0.25: '×¼', 0.5: '×½' };

function PokemonDefenses({ types }) {
	const [result, setResult] = useState(null);
	const [attempt, setAttempt] = useState(0);
	const [showAllWeaknesses, setShowAllWeaknesses] = useState(false);
	const [showAllResistances, setShowAllResistances] = useState(false);
	const weaknessesId = useId();
	const resistancesId = useId();
	const typeKey = [...types].sort().join(',');

	useEffect(() => {
		let cancelled = false;
		const memberTypes = typeKey.split(',');
		setResult(null);
		Promise.all(memberTypes.map(async (type) => [type, await getTypeRelations(type)]))
			.then((entries) => {
				if (!cancelled) {
					const relations = Object.fromEntries(entries);
					setResult({
						typeKey,
						weaknesses: getPokemonWeaknesses(memberTypes, relations),
						resistances: getPokemonResistances(memberTypes, relations),
					});
				}
			})
			.catch(() => {
				if (!cancelled) setResult({ typeKey, error: true });
			});
		return () => { cancelled = true; };
	}, [typeKey, attempt]);

	let content;
	if (!result || result.typeKey !== typeKey) {
		content = <p role="status">Chargement des forces et faiblesses…</p>;
	} else if (result.error) {
		content = (
			<div className="flex flex-wrap items-center gap-xs">
				<p role="status">Forces et faiblesses indisponibles.</p>
				<button type="button" className="filter-toggle" onClick={() => setAttempt((value) => value + 1)}>Réessayer</button>
			</div>
		);
	} else if (!result.weaknesses.length) {
		content = <p>Aucune faiblesse de type.</p>;
	} else {
		content = (
			<ul id={weaknessesId} aria-label="Types d’attaques et dégâts reçus" className="flex flex-wrap items-center gap-xs">
				{(showAllWeaknesses ? result.weaknesses : result.weaknesses.slice(0, 3)).map(({ type, multiplier }) => (
					<li key={type} className={`pokemon-weakness-badge${multiplier === 4 ? ' pokemon-weakness-critical' : ''}`}>
						<TypeIcon type={type} />
						{pokemonTypeNames[type]} <strong>×{multiplier}</strong>
						{multiplier === 4 && <span className="sr-only"> : très vulnérable</span>}
					</li>
				))}
				{result.weaknesses.length > 3 && (
					<li>
						<button type="button" className="pokemon-card-expand" aria-label={showAllWeaknesses ? 'Voir moins de faiblesses' : 'Voir toutes les faiblesses'} aria-expanded={showAllWeaknesses} aria-controls={weaknessesId} onClick={() => setShowAllWeaknesses((visible) => !visible)}>
							<span aria-hidden="true">{showAllWeaknesses ? '−' : '+'}</span>
						</button>
					</li>
				)}
			</ul>
		);
	}

	return (
		<section aria-label="Forces et faiblesses défensives" className="relative z-10 flex min-w-0 flex-col gap-xs border-t border-ink/10 pt-sm text-xs">
			<h4 className="font-bold">Faiblesses</h4>
			{content}
			{result?.typeKey === typeKey && !result.error && (
				<div className="flex min-w-0 flex-col gap-xs pt-xs">
					<h4 className="font-bold">Résistances et immunités</h4>
					{result.resistances.length ? (
						<ul id={resistancesId} aria-label="Types d’attaques résistés ou sans effet" className="flex flex-wrap items-center gap-xs py-xs">
							{(showAllResistances ? result.resistances : result.resistances.slice(0, 3)).map(({ type, multiplier }) => (
								<li key={type} className={`pokemon-weakness-badge${multiplier === 0 ? ' pokemon-immunity-badge' : ''}`}>
									<TypeIcon type={type} />
									{pokemonTypeNames[type]} <strong>{resistanceLabels[multiplier]}</strong>
									{multiplier === 0 && <span className="sr-only"> · immunisé</span>}
								</li>
							))}
							{result.resistances.length > 3 && (
								<li>
									<button type="button" className="pokemon-card-expand" aria-label={showAllResistances ? 'Voir moins de résistances et immunités' : 'Voir toutes les résistances et immunités'} aria-expanded={showAllResistances} aria-controls={resistancesId} onClick={() => setShowAllResistances((visible) => !visible)}>
										<span aria-hidden="true">{showAllResistances ? '−' : '+'}</span>
									</button>
								</li>
							)}
						</ul>
					) : <p>Aucune résistance ni immunité de type.</p>}
				</div>
			)}
		</section>
	);
}

PokemonDefenses.propTypes = {
	types: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default PokemonDefenses;
