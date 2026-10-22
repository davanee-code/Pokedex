import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { getGenerationSpecies, getPokemon } from '../services/pokeApi';
import {
	matchesPokemonFilters,
	toggleSelection,
} from '../utils/pokemonFilters';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import TypeIcon from './TypeIcon';
import { pokemonTypeNames } from '../utils/pokemonTypes';

const BATCH_SIZE = 6;
const PAGE_SIZE = 8;
const numberFormat = new Intl.NumberFormat('fr-FR', {
	maximumFractionDigits: 1,
});

function PokemonCard({ pokemon, isFavorite, onToggleFavorite }) {
	const [imageFailed, setImageFailed] = useState(false);
	return (
		<article
			className="pokemon-result-card"
			style={{
				'--pokemon-type-color': `var(--color-type-${pokemon.types[0] || 'normal'})`,
			}}
		>
			<header className="flex min-h-11 items-center pr-12">
				<span className="text-xs font-bold text-muted">
					#{String(pokemon.id).padStart(3, '0')}
				</span>
				<button
					type="button"
					aria-label={`${isFavorite ? 'Retirer' : 'Ajouter'} ${pokemon.displayName} ${isFavorite ? 'des' : 'aux'} favoris`}
					aria-pressed={isFavorite}
					onClick={() => onToggleFavorite(pokemon.id)}
					className="pokemon-favorite-button"
					title="Favoris conservés dans cet onglet pour la session"
				>
					<FontAwesomeIcon icon={faHeart} aria-hidden="true" />
				</button>
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
								className="pokemon-type-badge rounded-full px-md py-sm text-xs font-bold"
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
			<dl className="relative z-10 flex flex-wrap gap-x-lg gap-y-xs text-xs">
				<div className="flex gap-xs">
					<dt className="text-muted">Taille</dt>
					<dd className="font-bold">{numberFormat.format(pokemon.height)} m</dd>
				</div>
				<div className="flex gap-xs">
					<dt className="text-muted">Poids</dt>
					<dd className="font-bold">
						{numberFormat.format(pokemon.weight)} kg
					</dd>
				</div>
			</dl>
		</article>
	);
}

function SearchResults({
	query,
	matches,
	favoriteIds,
	onToggleFavorite,
	favoritesStorageError,
	favoritesOnly,
}) {
	const [page, setPage] = useState(1);
	const [pokemonList, setPokemonList] = useState([]);
	const [loading, setLoading] = useState(matches.length > 0);
	const [failedCount, setFailedCount] = useState(0);
	const [attempt, setAttempt] = useState(0);
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [selectedTypes, setSelectedTypes] = useState([]);
	const [selectedGenerations, setSelectedGenerations] = useState([]);
	const [selectedCapabilities, setSelectedCapabilities] = useState([]);
	const [sort, setSort] = useState('id-asc');
	const [generationSpecies, setGenerationSpecies] = useState(null);
	const [generationLoading, setGenerationLoading] = useState(false);
	const [generationError, setGenerationError] = useState('');
	const needsFullCollection =
		selectedTypes.length > 0 ||
		selectedGenerations.length > 0 ||
		selectedCapabilities.length > 0 ||
		sort !== 'id-asc';
	const loadStart = needsFullCollection ? 0 : (page - 1) * PAGE_SIZE;
	const loadEnd = needsFullCollection
		? matches.length
		: Math.min(page * PAGE_SIZE, matches.length);

	function resetFilters() {
		setSelectedTypes([]);
		setSelectedGenerations([]);
		setSelectedCapabilities([]);
		setSort('id-asc');
		setPage(1);
	}

	function updateFilter(setter, value) {
		setter(value);
		setPage(1);
	}

	function toggleFilter(setter, value) {
		setter((selection) => toggleSelection(selection, value));
		setPage(1);
	}

	useEffect(() => {
		let cancelled = false;
		if (!matches.length) return;
		setLoading(true);
		setPokemonList([]);
		setFailedCount(0);
		// Filters and sorting cover the entire search; otherwise only load this page.
		// Small batches limit concurrent requests; successful responses stay cached.
		async function loadResults() {
			const loaded = [];
			let failures = 0;
			for (let offset = loadStart; offset < loadEnd; offset += BATCH_SIZE) {
				if (cancelled) return;
				const results = await Promise.allSettled(
					matches
						.slice(offset, Math.min(offset + BATCH_SIZE, loadEnd))
						.map(async (entry) => ({
							...(await getPokemon(entry.id)),
							displayName: entry.displayName,
						})),
				);
				if (cancelled) return;
				for (const result of results) {
					if (result.status === 'fulfilled') loaded.push(result.value);
					else failures += 1;
				}
				setPokemonList([...loaded]);
			}
			setFailedCount(failures);
			setLoading(false);
		}
		loadResults();
		return () => {
			cancelled = true;
		};
	}, [matches, attempt, loadStart, loadEnd]);

	useEffect(() => {
		let cancelled = false;
		setGenerationError('');
		setGenerationSpecies(null);
		if (!selectedGenerations.length) {
			setGenerationLoading(false);
			return;
		}
		setGenerationLoading(true);
		Promise.all(selectedGenerations.map(getGenerationSpecies))
			.then((groups) => {
				if (!cancelled)
					setGenerationSpecies(
						new Set(groups.flatMap((species) => [...species])),
					);
			})
			.catch(() => {
				if (!cancelled)
					setGenerationError(
						'Impossible de charger les générations. Réessayez ou réinitialisez les filtres.',
					);
			})
			.finally(() => {
				if (!cancelled) setGenerationLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [selectedGenerations, attempt]);

	const filteredPokemon = pokemonList
		.filter((pokemon) =>
			matchesPokemonFilters(pokemon, {
				types: selectedTypes,
				generations: selectedGenerations,
				species: generationSpecies,
				capabilities: selectedCapabilities,
			}),
		)
		.sort((left, right) => {
			if (sort === 'name')
				return left.displayName.localeCompare(right.displayName, 'fr');
			return sort === 'id-desc' ? right.id - left.id : left.id - right.id;
		});
	const busy = loading || generationLoading;
	const activeFilterCount =
		selectedTypes.length +
		selectedGenerations.length +
		selectedCapabilities.length;
	const hasFilters = activeFilterCount > 0;
	const resultCount = hasFilters ? filteredPokemon.length : matches.length;
	const totalPages = Math.ceil(resultCount / PAGE_SIZE);
	const currentPage = Math.min(page, Math.max(1, totalPages));
	const pageOffset = (currentPage - 1) * PAGE_SIZE;
	const visiblePokemon = needsFullCollection
		? filteredPokemon.slice(pageOffset, pageOffset + PAGE_SIZE)
		: filteredPokemon;
	const pageNumbers = Array.from(
		{ length: totalPages },
		(_, index) => index + 1,
	).filter(
		(number) =>
			number === 1 ||
			number === totalPages ||
			Math.abs(number - currentPage) <= 1,
	);

	return (
		<section
			aria-labelledby="search-results-title"
			className="search-results-layout"
		>
			<aside aria-label="Filtres de recherche" className="search-filters-panel flex min-w-0 flex-col gap-md self-start rounded-md border border-ink/10 bg-white p-md shadow-sm">
				<div className="flex items-center justify-between gap-md">
					<h2 className="hidden text-base font-bold lg:block">
						Affiner{' '}
						<span className="text-sm font-normal text-muted">
							({activeFilterCount})
						</span>
					</h2>
					<button
						type="button"
						aria-expanded={filtersOpen}
						aria-controls="search-filter-controls"
						onClick={() => setFiltersOpen((open) => !open)}
						className="filter-toggle lg:hidden"
					>
						Affiner ({activeFilterCount}) {filtersOpen ? '−' : '+'}
					</button>
					<button
						type="button"
						onClick={resetFilters}
						className="min-h-11 rounded-sm text-xs font-bold text-primary-strong focus-visible:outline-ink"
					>
						Réinitialiser
					</button>
				</div>
				<div
					id="search-filter-controls"
					className={`${filtersOpen ? 'flex' : 'hidden'} flex-col gap-xl lg:flex`}
				>
					<p className="text-xs leading-relaxed text-muted">
						Combinez plusieurs choix par catégorie.
					</p>
					<fieldset className="filter-group">
						<legend className="filter-legend">Types</legend>
						<button
							type="button"
							aria-pressed={!selectedTypes.length}
							onClick={() => updateFilter(setSelectedTypes, [])}
							className="filter-all"
						>
							Tous les types
						</button>
						<div className="filter-types-grid">
							{Object.entries(pokemonTypeNames).map(([value, label]) => (
								<button
									key={value}
									type="button"
									aria-pressed={selectedTypes.includes(value)}
									onClick={() => toggleFilter(setSelectedTypes, value)}
									className="filter-chip filter-type-chip"
								>
									<TypeIcon type={value} />
									<span>{label}</span>
								</button>
							))}
						</div>
					</fieldset>
					<fieldset className="filter-group">
						<legend className="filter-legend">Génération</legend>
						<button
							type="button"
							aria-pressed={!selectedGenerations.length}
							onClick={() => updateFilter(setSelectedGenerations, [])}
							className="filter-all"
						>
							Toutes les générations
						</button>
						<div className="grid grid-cols-3 gap-sm">
							{[
								['first', 'I'],
								['middle', 'II–IV'],
								['later', 'V+'],
							].map(([value, label]) => (
								<button
									key={value}
									type="button"
									aria-pressed={selectedGenerations.includes(value)}
									onClick={() => toggleFilter(setSelectedGenerations, value)}
									className="filter-chip justify-center"
								>
									{label}
									<span aria-hidden="true">
										{selectedGenerations.includes(value) ? '✓' : '+'}
									</span>
								</button>
							))}
						</div>
					</fieldset>
					<fieldset className="filter-group">
						<legend className="filter-legend">Capacités</legend>
						<label className="filter-checkbox">
							<input
								type="checkbox"
								checked={selectedCapabilities.includes('fast')}
								onChange={() => toggleFilter(setSelectedCapabilities, 'fast')}
								className="accent-ink"
							/>
							<span className="flex flex-col gap-xs">
								<span className="font-medium">Rapide</span>
								<span className="text-xs text-muted">
									Vitesse de base ≥ 100
								</span>
							</span>
						</label>
						<label className="filter-checkbox">
							<input
								type="checkbox"
								checked={selectedCapabilities.includes('dual')}
								onChange={() => toggleFilter(setSelectedCapabilities, 'dual')}
								className="accent-ink"
							/>
							<span className="flex flex-col gap-xs">
								<span className="font-medium">Double type</span>
								<span className="text-xs text-muted">Possède deux types</span>
							</span>
						</label>
					</fieldset>
				</div>
			</aside>
			<div className="search-results-content flex min-w-0 flex-col gap-sm">
				<header className="flex flex-wrap items-center justify-between gap-md">
					<div className="flex min-w-0 flex-col gap-xs">
						<h2 id="search-results-title" className="text-base font-bold">
							{favoritesOnly
								? `Mes favoris · ${resultCount} Pokémon`
								: `${resultCount} Pokémon${query ? ` pour « ${query} »` : ''}`}
						</h2>
						<p className="text-xs text-muted">
							Une galerie claire pour parcourir le Pokédex
						</p>
						{favoritesStorageError && (
							<p role="status" className="text-xs text-primary-strong">
								Le stockage est indisponible : vos favoris seront perdus au
								rechargement.
							</p>
						)}
					</div>
					<label className="flex items-center gap-sm text-xs">
						<span className="sr-only">Trier les Pokémon</span>
						<select
							value={sort}
							onChange={(event) => updateFilter(setSort, event.target.value)}
							className="min-h-11 rounded-sm border border-ink/10 bg-white px-md focus-visible:outline-ink"
						>
							<option value="id-asc">Numéro croissant</option>
							<option value="id-desc">Numéro décroissant</option>
							<option value="name">Nom A–Z</option>
						</select>
					</label>
				</header>
				{!busy && !generationError && !visiblePokemon.length && (
					<p
						role="status"
						className="rounded-sm border border-ink/10 bg-warm-background p-lg text-sm"
					>
						{favoritesOnly && !matches.length
							? 'Aucun favori pour le moment. Ajoutez des Pokémon avec le cœur de leur carte dans Explorer.'
							: 'Aucun résultat. Essayez un autre nom ou retirez un filtre.'}
					</p>
				)}
				<div aria-busy={busy} className="pokemon-results-grid">
					{visiblePokemon.map((pokemon) => (
						<PokemonCard
							key={pokemon.id}
							pokemon={pokemon}
							isFavorite={favoriteIds.includes(pokemon.id)}
							onToggleFavorite={onToggleFavorite}
						/>
					))}
				</div>
				{busy && (
					<p role="status" className="text-sm text-muted">
						Chargement des résultats et des filtres…
					</p>
				)}
				{generationError && (
					<div
						role="status"
						className="flex flex-wrap items-center gap-md text-sm text-primary-strong"
					>
						<p>{generationError}</p>
						<button
							type="button"
							onClick={() => setAttempt((value) => value + 1)}
							className="filter-toggle"
						>
							Réessayer
						</button>
					</div>
				)}
				{failedCount > 0 && (
					<div
						role="status"
						className="flex flex-wrap items-center gap-md rounded-sm bg-primary-tint p-lg text-sm"
					>
						<p>{failedCount} Pokémon n’ont pas pu être chargés.</p>
						<button
							type="button"
							onClick={() => setAttempt((value) => value + 1)}
							disabled={loading}
							className="min-h-11 rounded-sm px-md font-bold underline"
						>
							Réessayer
						</button>
					</div>
				)}
				{matches.length > 0 && (
					<footer className="pagination-footer flex flex-wrap items-center gap-md py-sm">
						<p className="text-xs text-muted" aria-live="polite">
							Affichage{' '}
							{visiblePokemon.length
								? `${pageOffset + 1}–${pageOffset + visiblePokemon.length}`
								: '0'}{' '}
							sur {resultCount}
							{busy ? ' · chargement en cours' : ''}
						</p>
						{totalPages > 1 && (
							<nav
								aria-label="Pagination des Pokémon"
								className="flex w-full flex-wrap items-center justify-center gap-xs"
							>
								<button
									type="button"
									disabled={busy || currentPage === 1}
									onClick={() => setPage(currentPage - 1)}
									className="pagination-button"
									aria-label="Page précédente"
								>
									←
								</button>
								{pageNumbers.map((number, index) => (
									<span key={number} className="flex items-center gap-xs">
										{index > 0 && number - pageNumbers[index - 1] > 1 && (
											<span aria-hidden="true" className="text-muted">
												…
											</span>
										)}
										<button
											type="button"
											aria-label={`Page ${number}`}
											aria-current={number === currentPage ? 'page' : undefined}
											disabled={busy}
											onClick={() => setPage(number)}
											className="pagination-button"
										>
											{number}
										</button>
									</span>
								))}
								<button
									type="button"
									disabled={busy || currentPage === totalPages}
									onClick={() => setPage(currentPage + 1)}
									className="pagination-button"
									aria-label="Page suivante"
								>
									→
								</button>
							</nav>
						)}
					</footer>
				)}
			</div>
		</section>
	);
}

PokemonCard.propTypes = {
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
SearchResults.propTypes = {
	favoriteIds: PropTypes.arrayOf(PropTypes.number).isRequired,
	onToggleFavorite: PropTypes.func.isRequired,
	favoritesOnly: PropTypes.bool.isRequired,
	favoritesStorageError: PropTypes.bool.isRequired,
	query: PropTypes.string.isRequired,
	matches: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.number.isRequired,
			displayName: PropTypes.string.isRequired,
		}),
	).isRequired,
};

export default SearchResults;
