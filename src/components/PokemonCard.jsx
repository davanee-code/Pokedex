import { useState } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faHeart, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import TypeIcon from './TypeIcon';
import PokemonDefenses from './PokemonDefenses';
import PokemonDetails from './PokemonDetails';
import { pokemonTypeNames } from '../utils/pokemonTypes';
import { MAX_TEAM_SIZE } from '../utils/pokemonTeam';

const numberFormat = new Intl.NumberFormat('fr-FR', {
	maximumFractionDigits: 1,
});

function PokemonCard({
	pokemon,
	isFavorite,
	onToggleFavorite,
	isInTeam,
	isTeamFull,
	onToggleTeam,
	showDefenses,
}) {
	const [imageFailed, setImageFailed] = useState(false);
	const [detailsOpen, setDetailsOpen] = useState(false);
	const [teamButtonHovered, setTeamButtonHovered] = useState(false);
	const [teamButtonFocused, setTeamButtonFocused] = useState(false);
	let teamIcon = faPlus;
	if (isInTeam) {
		teamIcon = teamButtonHovered || teamButtonFocused ? faMinus : faCheck;
	}
	let teamActionLabel = `Ajouter ${pokemon.displayName} à l’équipe`;
	if (isInTeam) {
		teamActionLabel = `Retirer ${pokemon.displayName} de l’équipe`;
	} else if (isTeamFull) {
		teamActionLabel = `Équipe complète : ${MAX_TEAM_SIZE} Pokémon maximum`;
	}
	return (
		<article
			className="pokemon-result-card"
			style={{
				'--pokemon-type-color': `var(--color-type-${pokemon.types[0] || 'normal'})`,
			}}
		>
			<button
				type="button"
				className="pokemon-card-details-button"
				aria-label={`Voir les détails de ${pokemon.displayName}`}
				aria-haspopup="dialog"
				onClick={() => setDetailsOpen(true)}
			/>
			<header className="pointer-events-none relative z-30 flex min-h-11 items-center justify-between gap-xs">
				<span className="text-xs font-bold text-muted">
					#{String(pokemon.id).padStart(3, '0')}
				</span>
				<div className="pointer-events-auto flex shrink-0 items-center">
					<button
						type="button"
						aria-label={teamActionLabel}
						title={teamActionLabel}
						aria-pressed={isInTeam}
						disabled={!isInTeam && isTeamFull}
						onClick={() => onToggleTeam(pokemon.id)}
						onMouseEnter={() => setTeamButtonHovered(true)}
						onMouseLeave={() => setTeamButtonHovered(false)}
						onFocus={(event) =>
							setTeamButtonFocused(event.currentTarget.matches(':focus-visible'))
						}
						onBlur={() => setTeamButtonFocused(false)}
						className="pokemon-card-action pokemon-team-button disabled:cursor-not-allowed disabled:opacity-50"
					>
						<FontAwesomeIcon icon={teamIcon} aria-hidden="true" />
					</button>
					<button
						type="button"
						aria-label={`${isFavorite ? 'Retirer' : 'Ajouter'} ${pokemon.displayName} ${isFavorite ? 'des' : 'aux'} favoris`}
						aria-pressed={isFavorite}
						onClick={() => onToggleFavorite(pokemon.id)}
						className="pokemon-card-action pokemon-favorite-button"
						title="Favoris conservés dans cet onglet pour la session"
					>
						<FontAwesomeIcon icon={faHeart} aria-hidden="true" />
					</button>
				</div>
			</header>
			<div className="pokemon-card-body relative z-10 grid min-h-0 min-w-0 items-center gap-sm">
				<div className="pokemon-card-info flex min-w-0 flex-col items-start justify-center gap-md">
					<h3 className="wrap-anywhere text-lg font-bold capitalize leading-tight">
						{pokemon.displayName}
					</h3>
					<ul aria-label="Types" className="flex flex-wrap gap-xs">
						{pokemon.types.map((type) => (
							<li
								key={type}
								className="pokemon-type-badge"
								style={{
									'--pokemon-type-color': `var(--color-type-${type}, var(--color-type-normal))`,
								}}
							>
								<TypeIcon type={type} />
								{pokemonTypeNames[type] || type}
							</li>
						))}
					</ul>
				</div>
				<div className="pokemon-card-portrait flex min-h-0 min-w-0 items-center justify-center">
					{pokemon.imgSrc && !imageFailed ? (
						<img
							src={pokemon.imgSrc}
							alt={pokemon.displayName}
							width="475"
							height="475"
							loading="lazy"
							onError={() => setImageFailed(true)}
							className="pokemon-card-image"
						/>
					) : (
						<p className="text-center text-xs text-muted">Image indisponible</p>
					)}
				</div>
			</div>
			{!showDefenses && <dl className="relative z-10 flex flex-wrap gap-x-lg gap-y-xs text-xs">
				<div className="flex gap-xs">
					<dt className="text-muted">Taille</dt>
					<dd className="font-bold">{numberFormat.format(pokemon.height)} m</dd>
				</div>
				<div className="flex gap-xs">
					<dt className="text-muted">Poids</dt>
					<dd className="font-bold">{numberFormat.format(pokemon.weight)} kg</dd>
				</div>
			</dl>}
			{showDefenses && <div className="pokemon-card-defenses relative z-30"><PokemonDefenses types={pokemon.types} /></div>}
			{detailsOpen && <PokemonDetails pokemon={pokemon} onClose={() => setDetailsOpen(false)} />}
		</article>
	);
}

PokemonCard.propTypes = {
	showDefenses: PropTypes.bool.isRequired,
	isInTeam: PropTypes.bool.isRequired,
	isTeamFull: PropTypes.bool.isRequired,
	onToggleTeam: PropTypes.func.isRequired,
	isFavorite: PropTypes.bool.isRequired,
	onToggleFavorite: PropTypes.func.isRequired,
	pokemon: PropTypes.shape({
		id: PropTypes.number.isRequired,
		displayName: PropTypes.string.isRequired,
		imgSrc: PropTypes.string,
		height: PropTypes.number.isRequired,
		weight: PropTypes.number.isRequired,
		types: PropTypes.arrayOf(PropTypes.string).isRequired,
	}).isRequired,
};

export default PokemonCard;
