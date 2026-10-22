import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import SearchBar from './components/SearchBar';
import SearchResults from './components/SearchResults';
import { getPokemonList } from './services/pokeApi';
import { readSessionFavorites, saveSessionFavorites } from './services/favorites';
import { toggleSelection } from './utils/pokemonFilters';

function App() {
	const [searchRequest, setSearchRequest] = useState(null);
	const [pokemonList, setPokemonList] = useState(null);
	const [listError, setListError] = useState(false);
	const [attempt, setAttempt] = useState(0);
	const [favoriteIds, setFavoriteIds] = useState(readSessionFavorites);
	const [favoritesStorageError, setFavoritesStorageError] = useState(false);
	const [view, setView] = useState('explore');

	function handleSearch(query, matches) {
		setView('explore');
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
	if (view === 'favorites') {
		results = pokemonList ? {
			query: '',
			matches: pokemonList.filter(({ id }) => favoriteIds.includes(id)),
			version: `favorites-${favoriteIds.join('-')}`,
		} : null;
	} else if (!results && pokemonList) {
		results = { query: '', matches: pokemonList, version: 0 };
	}

	return (
		<main className="app-shell w-full min-w-0 min-h-screen bg-background text-ink">
			<Navbar selectedCount={0} activeView={view} onNavigate={setView} />
			<div className="app-content flex w-full min-w-0 flex-col gap-md px-md py-md sm:px-lg">
				<SearchBar onSearch={handleSearch} />
				{results && (
					<SearchResults
						key={`${view}-${results.version}`}
						query={results.query}
						matches={results.matches}
						favoriteIds={favoriteIds}
						onToggleFavorite={toggleFavorite}
						favoritesStorageError={favoritesStorageError}
						favoritesOnly={view === 'favorites'}
					/>
				)}
				{!results && listError && (
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
					<p role="status" className="text-sm text-muted">Chargement du Pokédex…</p>
				)}
			</div>
		</main>
	);
}

export default App;
