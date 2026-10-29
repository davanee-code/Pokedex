import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import SearchBar from './components/SearchBar';
import SearchResults from './components/SearchResults';
import { getPokemonList } from './services/pokeApi';
import { readSessionFavorites, saveSessionFavorites } from './services/favorites';
import { readSessionTeam, saveSessionTeam } from './services/team';
import { toggleSelection } from './utils/pokemonFilters';
import { togglePokemonInTeam, MAX_TEAM_SIZE } from './utils/pokemonTeam';

function App() {
	const [searchRequest, setSearchRequest] = useState(null);
	const [pokemonList, setPokemonList] = useState(null);
	const [listError, setListError] = useState(false);
	const [attempt, setAttempt] = useState(0);
	const [favoriteIds, setFavoriteIds] = useState(readSessionFavorites);
	const [favoritesStorageError, setFavoritesStorageError] = useState(false);
	const [view, setView] = useState('explore');
	const [exploreVersion, setExploreVersion] = useState(0);
	const [teamIds, setTeamIds] = useState(readSessionTeam);
	const [teamStorageError, setTeamStorageError] = useState(false);

	function handleNavigate(nextView) {
		setView(nextView);
		if (nextView === 'explore') {
			setSearchRequest(null);
			setExploreVersion((previous) => previous + 1);
		}
	}

	function toggleTeam(id) {
		const nextIds = togglePokemonInTeam(teamIds, id);
		setTeamIds(nextIds);
		setTeamStorageError(!saveSessionTeam(nextIds));
	}

	function handleSearch(query, matches) {
		setView('explore');
		if (!query) {
			setSearchRequest(null);
			return;
		}
		setSearchRequest((previous) => ({
			query,
			matches,
			version: (previous?.version || 0) + 1,
		}));
	}

	function toggleFavorite(id) {
		const nextIds = toggleSelection(favoriteIds, id);
		setFavoriteIds(nextIds);
		setFavoritesStorageError(!saveSessionFavorites(nextIds));
	}

	useEffect(() => {
		let cancelled = false;
		setListError(false);
		getPokemonList()
			.then((list) => {
				if (!cancelled) setPokemonList(list);
			})
			.catch(() => {
				if (!cancelled) setListError(true);
			});
		return () => {
			cancelled = true;
		};
	}, [attempt]);

	let results = searchRequest;
	if (view === 'favorites' || view === 'team') {
		const selectedIds = view === 'team' ? teamIds : favoriteIds;
		results = pokemonList
			? {
					query: '',
					matches: pokemonList.filter(({ id }) => selectedIds.includes(id)),
					version: `${view}-${selectedIds.join('-')}`,
				}
			: null;
	} else if (!results && pokemonList) {
		results = { query: '', matches: pokemonList, version: 0 };
	}

	return (
		<main className="app-shell w-full min-w-0 min-h-screen bg-background text-ink">
			<Navbar selectedCount={teamIds.length} activeView={view} onNavigate={handleNavigate} />
			<p role="status" className="sr-only">
				{teamIds.length} Pokémon sur {MAX_TEAM_SIZE} dans votre équipe.
				{teamIds.length === MAX_TEAM_SIZE ? ' Équipe complète.' : ''}
			</p>
			<div className="app-content flex w-full min-w-0 flex-col gap-md px-md py-md sm:px-lg">
				{teamStorageError && (
					<p role="status" className="text-sm text-primary-strong">
						Le stockage est indisponible : votre équipe sera perdue au rechargement.
					</p>
				)}
				{view === 'explore' && (
					<SearchBar
						key={exploreVersion}
						pokemonList={pokemonList || []}
						loading={!pokemonList && !listError}
						error={listError ? 'Impossible de charger les Pokémon.' : ''}
						onRetry={() => setAttempt((value) => value + 1)}
						onSearch={handleSearch}
					/>
				)}
				{results && (
					<SearchResults
						key={`${view}-${exploreVersion}-${results.version}`}
						query={results.query}
						matches={results.matches}
						favoriteIds={favoriteIds}
						teamIds={teamIds}
						onToggleTeam={toggleTeam}
						onToggleFavorite={toggleFavorite}
						favoritesStorageError={favoritesStorageError}
						view={view}
					/>
				)}
				{!results && listError && view !== 'explore' && (
					<div role="status" className="flex flex-wrap items-center gap-md text-sm">
						<p>Impossible de charger la galerie.</p>
						<button
							type="button"
							onClick={() => setAttempt((value) => value + 1)}
							className="filter-toggle"
						>
							Réessayer
						</button>
					</div>
				)}
				{!results && !listError && (
					<p role="status" className="text-sm text-muted">
						Chargement du Pokédex…
					</p>
				)}
			</div>
		</main>
	);
}

export default App;
