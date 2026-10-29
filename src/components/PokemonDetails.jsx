import { useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import PokemonDefenses from './PokemonDefenses';
import TypeIcon from './TypeIcon';
import { pokemonTypeNames } from '../utils/pokemonTypes';
import { statNames } from '../utils/teamAnalysis';

const numberFormat = new Intl.NumberFormat('fr-FR', {
	maximumFractionDigits: 1,
});

function PokemonDetails({ pokemon, onClose }) {
	const dialogRef = useRef(null);
	const titleId = useId();
	const [imageFailed, setImageFailed] = useState(false);

	useEffect(() => {
		const dialog = dialogRef.current;
		const trigger = document.activeElement;
		const previousOverflow = document.body.style.overflow;
		dialog.showModal();
		document.body.style.overflow = 'hidden';
		return () => {
			dialog.close();
			document.body.style.overflow = previousOverflow;
			if (trigger instanceof HTMLElement && trigger.isConnected)
				trigger.focus();
		};
	}, []);

	return (
		<dialog
			ref={dialogRef}
			aria-labelledby={titleId}
			className="pokemon-details-dialog"
			onClose={() => {
				if (!dialogRef.current.open) onClose();
			}}
		>
			<div className="flex min-w-0 flex-col gap-lg">
				<header className="flex items-start justify-between gap-md">
					<div className="flex min-w-0 flex-col gap-xs">
						<p className="text-sm font-bold text-muted">
							#{String(pokemon.id).padStart(3, '0')}
						</p>
						<h2
							id={titleId}
							className="wrap-anywhere text-2xl font-bold capitalize"
						>
							{pokemon.displayName}
						</h2>
					</div>
					<button
						type="button"
						className="filter-all shrink-0"
						onClick={() => dialogRef.current.close()}
					>
						Fermer
					</button>
				</header>
				<div className="grid min-w-0 items-center gap-lg sm:grid-cols-2">
					{pokemon.imgSrc && !imageFailed ? (
						<img
							src={pokemon.imgSrc}
							alt={pokemon.displayName}
							width="475"
							height="475"
							className="w-full max-w-full object-contain"
							onError={() => setImageFailed(true)}
						/>
					) : (
						<p className="text-sm text-muted">Image indisponible</p>
					)}
					<div className="flex min-w-0 flex-col gap-lg">
						<section className="flex flex-col gap-sm" aria-label="Types">
							<h3 className="font-bold">Types</h3>
							<ul className="flex flex-wrap gap-xs">
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
						</section>
						<dl className="flex flex-wrap gap-lg text-sm">
							<div>
								<dt className="text-muted">Taille</dt>
								<dd className="font-bold">
									{numberFormat.format(pokemon.height)} m
								</dd>
							</div>
							<div>
								<dt className="text-muted">Poids</dt>
								<dd className="font-bold">
									{numberFormat.format(pokemon.weight)} kg
								</dd>
							</div>
						</dl>
					</div>
				</div>
				<section className="flex flex-col gap-md">
					<h3 className="font-bold">Statistiques de base</h3>
					<dl className="grid gap-sm sm:grid-cols-2">
						{Object.entries(statNames).map(([stat, label]) => (
							<div
								key={stat}
								className="flex items-center justify-between gap-md rounded-sm bg-warm-background p-md text-sm"
							>
								<dt>{label}</dt>
								<dd className="font-bold">
									{Number.isFinite(pokemon.stats?.[stat])
										? pokemon.stats[stat]
										: 'Indisponible'}
								</dd>
							</div>
						))}
					</dl>
				</section>
				<section className="flex flex-col gap-sm">
					<h3 className="font-bold">Défenses selon les types</h3>
					<PokemonDefenses types={pokemon.types} />
				</section>
			</div>
		</dialog>
	);
}

PokemonDetails.propTypes = {
	pokemon: PropTypes.shape({
		id: PropTypes.number.isRequired,
		displayName: PropTypes.string.isRequired,
		imgSrc: PropTypes.string,
		height: PropTypes.number.isRequired,
		weight: PropTypes.number.isRequired,
		types: PropTypes.arrayOf(PropTypes.string).isRequired,
		stats: PropTypes.objectOf(PropTypes.number),
	}).isRequired,
	onClose: PropTypes.func.isRequired,
};

export default PokemonDetails;
