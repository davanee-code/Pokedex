import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { getGenerationSpecies, getPokemon } from '../services/pokeApi';
import { comparePokemon, matchesPokemonFilters } from '../utils/pokemonFilters';
import TeamAnalysis from './TeamAnalysis';
import PokemonCard from './PokemonCard';
import SearchFilters from './SearchFilters';
import SearchPagination from './SearchPagination';
import { MAX_TEAM_SIZE } from '../utils/pokemonTeam';

const BATCH_SIZE = 6;
const PAGE_SIZE = 8;

function getTeamPageSize() {
	if (!window.matchMedia('(min-width: 64rem)').matches) return MAX_TEAM_SIZE;
	const columns = window.matchMedia('(min-width: 80rem)').matches ? 3 : 2;
	return window.matchMedia('(min-height: 56rem)').matches ? columns * 2 : columns;
}

function SearchResults({
	query,
	matches,
	favoriteIds,
	onToggleFavorite,
	favoritesStorageError,
	view,
	teamIds,
	onToggleTeam,
}) {
	const [page, setPage] = useState(1);
	const [teamPageSize, setTeamPageSize] = useState(getTeamPageSize);
	const pageSize = view === 'team' ? teamPageSize : PAGE_SIZE;

	useEffect(() => {
		if (view !== 'team') return;
		const queries = [
			window.matchMedia('(min-width: 64rem)'),
			window.matchMedia('(min-width: 80rem)'),
			window.matchMedia('(min-height: 56rem)'),
		];
		function updateTeamPageSize() {
			setTeamPageSize(getTeamPageSize());
			setPage(1);
		}
		queries.forEach((query) => query.addEventListener('change', updateTeamPageSize));
		return () => {
			queries.forEach((query) => query.removeEventListener('change', updateTeamPageSize));
		};
	}, [view]);
	const [pokemonList, setPokemonList] = useState([]);
	const [loading, setLoading] = useState(matches.length > 0);
	const [failedCount, setFailedCount] = useState(0);
	const [attempt, setAttempt] = useState(0);
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
		selectedCapabilities.length > 0;
	const loadStart = needsFullCollection || view === 'team' ? 0 : (page - 1) * pageSize;
	const loadEnd = needsFullCollection || view === 'team'
		? matches.length
		: Math.min(page * pageSize, matches.length);

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

	useEffect(() => {
		let cancelled = false;
		if (!matches.length) return;
		setLoading(true);
		setPokemonList([]);
		setFailedCount(0);
		// Sort list metadata before fetching details, so sorting only loads one page.
		// Small batches limit concurrent requests; successful responses stay cached.
		async function loadResults() {
			const sortedMatches = [...matches].sort((left, right) => comparePokemon(left, right, sort));
			const loaded = [];
			let failures = 0;
			for (let offset = loadStart; offset < loadEnd; offset += BATCH_SIZE) {
				const results = await Promise.allSettled(
					sortedMatches
						.slice(offset, Math.min(offset + BATCH_SIZE, loadEnd))
						.map(async (entry) => ({
							...(await getPokemon(entry.id)),
							displayName: entry.displayName,
						}))
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
	}, [matches, attempt, loadStart, loadEnd, sort]);

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
					setGenerationSpecies(new Set(groups.flatMap((species) => [...species])));
			})
			.catch(() => {
				if (!cancelled)
					setGenerationError(
						'Impossible de charger les générations. Réessayez ou réinitialisez les filtres.'
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
			})
		)
		.sort((left, right) => comparePokemon(left, right, sort));
	const busy = loading || generationLoading;
	const hasFilters =
		selectedTypes.length > 0 || selectedGenerations.length > 0 || selectedCapabilities.length > 0;
	const resultCount = hasFilters ? filteredPokemon.length : matches.length;
	let resultsTitle = `${resultCount} Pokémon${query ? ` pour « ${query} »` : ''}`;
	let emptyMessage = 'Aucun résultat. Essayez un autre nom ou retirez un filtre.';
	if (view === 'team') {
		resultsTitle = `Mon équipe · ${teamIds.length} / ${MAX_TEAM_SIZE} Pokémon`;
		if (!matches.length) {
			emptyMessage =
				'Votre équipe est vide. Ajoutez des Pokémon avec le bouton + de leur carte dans Explorer.';
		}
	} else if (view === 'favorites') {
		resultsTitle = `Mes favoris · ${resultCount} Pokémon`;
		if (!matches.length) {
			emptyMessage =
				'Aucun favori pour le moment. Ajoutez des Pokémon avec le cœur de leur carte dans Explorer.';
		}
	}
	const totalPages = Math.ceil(resultCount / pageSize);
	const currentPage = Math.min(page, Math.max(1, totalPages));
	const pageOffset = (currentPage - 1) * pageSize;
	const visiblePokemon = needsFullCollection || view === 'team'
		? filteredPokemon.slice(pageOffset, pageOffset + pageSize)
		: filteredPokemon;

	return (
		<section
			aria-labelledby="search-results-title"
			className={`search-results-layout${view === 'team' ? ' team-results-layout' : ''}${view === 'favorites' ? ' favorites-results-layout' : ''}`}
		>
			{view === 'team' ? (
				<TeamAnalysis pokemon={pokemonList} loading={loading} failedCount={failedCount} />
			) : (
				<SearchFilters
					selectedTypes={selectedTypes}
					selectedGenerations={selectedGenerations}
					selectedCapabilities={selectedCapabilities}
					onTypesChange={(value) => updateFilter(setSelectedTypes, value)}
					onGenerationsChange={(value) => updateFilter(setSelectedGenerations, value)}
					onCapabilitiesChange={(value) => updateFilter(setSelectedCapabilities, value)}
					onReset={resetFilters}
				/>
			)}
			<div className="search-results-content flex min-w-0 flex-col gap-sm">
				<header className="flex flex-wrap items-center justify-between gap-md">
					<div className="flex min-w-0 flex-col gap-xs">
						<h2 id="search-results-title" className="wrap-anywhere text-base font-bold">
							{resultsTitle}
						</h2>
						<p className="text-xs text-muted">
							Une galerie claire pour parcourir le Pokédex
						</p>
						{favoritesStorageError && (
							<p role="status" className="text-xs text-primary-strong">
								Le stockage est indisponible : vos favoris seront perdus au rechargement.
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
				{busy && (
					<p role="status" className="text-sm text-muted">
						Chargement des résultats et des filtres…
					</p>
				)}
				{!busy && !generationError && !failedCount && !visiblePokemon.length && (
					<p
						role="status"
						className="rounded-sm border border-ink/10 bg-warm-background p-lg text-sm"
					>
						{emptyMessage}
					</p>
				)}
				<div aria-busy={busy} className="pokemon-results-grid">
					{visiblePokemon.map((pokemon) => (
						<PokemonCard
							key={pokemon.id}
							pokemon={pokemon}
							showDefenses={view === 'team'}
							isFavorite={favoriteIds.includes(pokemon.id)}
							isInTeam={teamIds.includes(pokemon.id)}
							isTeamFull={teamIds.length >= MAX_TEAM_SIZE}
							onToggleTeam={onToggleTeam}
							onToggleFavorite={onToggleFavorite}
						/>
					))}
				</div>
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
					<SearchPagination
						currentPage={currentPage}
						totalPages={totalPages}
						pageOffset={pageOffset}
						visibleCount={visiblePokemon.length}
						resultCount={resultCount}
						busy={busy}
						onPageChange={setPage}
					/>
				)}
			</div>
		</section>
	);
}

SearchResults.propTypes = {
	teamIds: PropTypes.arrayOf(PropTypes.number).isRequired,
	onToggleTeam: PropTypes.func.isRequired,
	favoriteIds: PropTypes.arrayOf(PropTypes.number).isRequired,
	onToggleFavorite: PropTypes.func.isRequired,
	view: PropTypes.oneOf(['explore', 'favorites', 'team']).isRequired,
	favoritesStorageError: PropTypes.bool.isRequired,
	query: PropTypes.string.isRequired,
	matches: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.number.isRequired,
			displayName: PropTypes.string.isRequired,
		})
	).isRequired,
};

export default SearchResults;
