import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { getTypeRelations } from '../services/pokeApi';
import { analyzeTeam, statNames } from '../utils/teamAnalysis';
import { pokemonTypeNames } from '../utils/pokemonTypes';
import TypeIcon from './TypeIcon';

function AnalysisTypeList({ entries, emptyMessage }) {
	if (!entries.length) return <p>{emptyMessage}</p>;

	return (
		<ul className="flex flex-col gap-sm">
			{entries.map(({ type, detail }) => (
				<li key={type} className="team-analysis-row">
					<span className="flex items-center gap-xs">
						<TypeIcon type={type} />
						{pokemonTypeNames[type] || type}
					</span>
					<span className="text-muted">{detail}</span>
				</li>
			))}
		</ul>
	);
}

AnalysisTypeList.propTypes = {
	entries: PropTypes.arrayOf(
		PropTypes.shape({
			type: PropTypes.string.isRequired,
			detail: PropTypes.string.isRequired,
		})
	).isRequired,
	emptyMessage: PropTypes.string.isRequired,
};

function TeamAnalysis({ pokemon, loading, failedCount }) {
	const [relations, setRelations] = useState(null);
	const [error, setError] = useState(false);
	const [attempt, setAttempt] = useState(0);
	const [showAllWeaknesses, setShowAllWeaknesses] = useState(false);
	const [showAllStrengths, setShowAllStrengths] = useState(false);
	const typeKey = [...new Set(pokemon.flatMap((member) => member.types))]
		.sort()
		.join(',');

	useEffect(() => {
		let cancelled = false;
		setRelations(null);
		setError(false);
		if (!typeKey || loading || failedCount) return;
		Promise.all(
			typeKey.split(',').map(async (type) => [type, await getTypeRelations(type)])
		)
			.then((entries) => {
				if (!cancelled) setRelations(Object.fromEntries(entries));
			})
			.catch(() => {
				if (!cancelled) setError(true);
			});
		return () => {
			cancelled = true;
		};
	}, [typeKey, loading, failedCount, attempt]);

	let content;
	if (loading) {
		content = <p role="status">Chargement de l’équipe…</p>;
	} else if (failedCount) {
		content = (
			<p role="status">
				Analyse indisponible : certains Pokémon n’ont pas pu être chargés. Utilisez «
				Réessayer » dans la galerie.
			</p>
		);
	} else if (!pokemon.length) {
		content = (
			<p>Ajoutez des Pokémon pour découvrir les forces et faiblesses de votre équipe.</p>
		);
	} else if (error) {
		content = (
			<div role="status">
				<p>Impossible de charger les relations de types.</p>
				<button
					type="button"
					className="filter-toggle"
					onClick={() => setAttempt((value) => value + 1)}
				>
					Réessayer
				</button>
			</div>
		);
	} else if (!relations || typeKey.split(',').some((type) => !relations[type])) {
		content = <p role="status">Chargement de l’analyse…</p>;
	} else {
		const analysis = analyzeTeam(pokemon, relations);
		const weaknesses = analysis.defense
			.filter(({ weak }) => weak > 0)
			.sort((a, b) => b.weak - a.weak || b.quadruple - a.quadruple)
			.map(({ type, weak, quadruple }) => ({
				type,
				detail: `${weak} Pokémon${quadruple > 0 ? ` · dont ${quadruple} à ×4` : ''}`,
			}));
		const strengths = analysis.defense
			.filter(({ resistant, immune }) => resistant + immune > 0)
			.sort((a, b) =>
				(b.resistant + b.immune) - (a.resistant + a.immune) || b.immune - a.immune
			)
			.map(({ type, resistant, immune }) => ({
				type,
				detail: [
					resistant > 0 ? `${resistant} résistant${resistant > 1 ? 's' : ''}` : '',
					immune > 0 ? `${immune} immunisé${immune > 1 ? 's' : ''}` : '',
				].filter(Boolean).join(' · '),
			}));
		content = (
			<>
				<p className="text-muted">
					Votre équipe réunit {analysis.types.length} types différents. Voici les attaques
					qu’elle encaisse moins bien et les types adverses qu’elle peut contrer.
				</p>
				<section className="team-analysis-section">
					<h3 className="font-bold">Attaques à craindre</h3>
					<p className="text-xs text-muted">
						×2 : vulnérable · ×4 : très vulnérable
					</p>
					<p className="text-xs text-muted">
						{showAllWeaknesses ? 'Tous les risques' : 'Principaux risques'} · équipe de {pokemon.length} Pokémon
					</p>
					<div id="team-weaknesses">
						<AnalysisTypeList
							entries={showAllWeaknesses ? weaknesses : weaknesses.slice(0, 3)}
							emptyMessage="Aucune faiblesse de type."
						/>
					</div>
					{weaknesses.length > 3 && (
						<button
							type="button"
							className="filter-toggle self-start text-left"
							aria-expanded={showAllWeaknesses}
							aria-controls="team-weaknesses"
							onClick={() => setShowAllWeaknesses((visible) => !visible)}
						>
							{showAllWeaknesses ? 'Réduire la liste' : `Voir toutes les faiblesses (${weaknesses.length})`}
						</button>
					)}
					<details className="flex flex-col">
						<summary className="team-analysis-help-toggle">Comprendre les faiblesses</summary>
						<div className="flex flex-col gap-sm py-sm text-muted">
							<p>Chaque ligne compte les membres vulnérables à ce type d’attaque. « 2 Pokémon · dont 1 à ×4 » signifie que l’un reçoit le double des dégâts normaux, et l’autre le quadruple.</p>
							<p>Les types qui menacent le plus de membres sont affichés en premier. À égalité, ceux avec le plus de faiblesses ×4 passent devant.</p>
							<p>Consultez les badges sur les cartes pour identifier les Pokémon concernés et ajuster votre équipe.</p>
						</div>
					</details>
				</section>
				<section className="team-analysis-section">
					<h3 className="font-bold">Résistances et immunités</h3>
					<p className="text-xs text-muted">
						×½ ou ×¼ : résistant · ×0 : immunisé
					</p>
					<p className="text-xs text-muted">
						{showAllStrengths ? 'Tous les avantages' : 'Principaux avantages'} · équipe de {pokemon.length} Pokémon
					</p>
					<div id="team-strengths">
						<AnalysisTypeList
							entries={showAllStrengths ? strengths : strengths.slice(0, 3)}
							emptyMessage="Aucune résistance ni immunité de type."
						/>
					</div>
					{strengths.length > 3 && (
						<button
							type="button"
							className="filter-toggle self-start text-left"
							aria-expanded={showAllStrengths}
							aria-controls="team-strengths"
							onClick={() => setShowAllStrengths((visible) => !visible)}
						>
							{showAllStrengths ? 'Réduire la liste' : `Voir toutes les résistances et immunités (${strengths.length})`}
						</button>
					)}
					<details className="flex flex-col">
						<summary className="team-analysis-help-toggle">Comprendre les résistances et immunités</summary>
						<div className="flex flex-col gap-sm py-sm text-muted">
							<p>Un Pokémon résistant reçoit la moitié ou le quart des dégâts normaux. Un Pokémon immunisé ne reçoit aucun dégât de ce type d’attaque.</p>
							<p>« 2 résistants · 1 immunisé » désigne trois Pokémon différents. Les types avec le plus de membres résistants ou immunisés sont affichés en premier. À égalité, ceux avec le plus d’immunités passent devant.</p>
							<p>Un type peut aussi apparaître dans les faiblesses : certains membres y sont vulnérables, tandis que d’autres y résistent.</p>
						</div>
					</details>
				</section>
				<section className="team-analysis-section">
					<h3 className="font-bold">Types adverses que vos types peuvent contrer</h3>
					<p className="text-muted">
						Une attaque d’un type de votre équipe peut infliger le double des dégâts à
						un adversaire possédant uniquement l’un des types ci-dessous. Par exemple,
						une attaque Feu est super efficace contre un adversaire de type Plante.
					</p>
					<p className="text-muted">
						Ce calcul suppose que vos Pokémon utilisent des attaques de leur type :
						il ne vérifie pas les attaques qu’ils connaissent réellement.
					</p>
					{analysis.coverage.length ? (
						<ul className="flex flex-wrap gap-sm">
							{analysis.coverage.map((type) => (
								<li key={type} className="flex items-center gap-xs">
									<TypeIcon type={type} />
									{pokemonTypeNames[type] || type}
								</li>
							))}
						</ul>
					) : (
						<p>Aucun type couvert super efficacement.</p>
					)}
				</section>
				<section className="team-analysis-section">
					<h3 className="font-bold">Statistiques de base moyennes</h3>
					<p className="text-muted">
						La moyenne des caractéristiques de base de vos Pokémon, arrondie à
						l’unité. Ce ne sont pas leurs valeurs en combat : le niveau et
						l’entraînement ne sont pas pris en compte.
					</p>
					<dl className="flex flex-col gap-sm">
						{analysis.averages.map(({ stat, value }) => (
							<div key={stat} className="team-analysis-row">
								<dt>{statNames[stat]}</dt>
								<dd className="font-bold">{value ?? 'Indisponible'}</dd>
							</div>
						))}
					</dl>
				</section>
				<p className="text-xs text-muted">
					Relations de types actuelles de PokéAPI. Talents, objets, capacités choisies et
					conditions de combat ne sont pas pris en compte.
				</p>
			</>
		);
	}

	return (
		<aside
			aria-labelledby="team-analysis-title"
			tabIndex={0}
			className="team-analysis-panel flex min-w-0 flex-col gap-md rounded-md border border-ink/10 bg-white p-md text-sm shadow-sm focus-visible:outline-ink"
		>
			<h2 id="team-analysis-title" className="text-base font-bold">
				Analyse de l’équipe
			</h2>
			{content}
		</aside>
	);
}

TeamAnalysis.propTypes = {
	pokemon: PropTypes.arrayOf(
		PropTypes.shape({
			types: PropTypes.arrayOf(PropTypes.string).isRequired,
			stats: PropTypes.objectOf(PropTypes.number),
		})
	).isRequired,
	loading: PropTypes.bool.isRequired,
	failedCount: PropTypes.number.isRequired,
};

export default TeamAnalysis;
