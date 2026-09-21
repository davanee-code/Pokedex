import { useEffect, useState } from 'react';
import Title from './Components/Title.jsx';
import PokemonCard from './Components/PokemonCard';
import { getPokemonPage } from './services/pokemon.js';
import './App.css';

function App() {
	const [page, setPage] = useState(0);
	const [retry, setRetry] = useState(0);
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [totalPages, setTotalPages] = useState(0);
	const firstVisiblePage = Math.max(0, Math.min(page - 2, totalPages - 5));
	const visiblePages = Array.from(
		{ length: Math.min(5, totalPages) },
		(_, index) => firstVisiblePage + index,
	);

	useEffect(() => {
		let active = true;
		setLoading(true);
		setError('');
		setData(null);
		getPokemonPage(page)
			.then((result) => {
				if (active) {
					setData(result);
					setTotalPages(result.totalPages);
				}
			})
			.catch(() => {
				if (active)
					setError(
						'Impossible de charger les Pokémons. Vérifie ta connexion et réessaie.',
					);
			})
			.finally(() => {
				if (active) setLoading(false);
			});
		return () => {
			active = false;
		};
	}, [page, retry]);

	return (
		<main className="pokedex">
			<Title />
			<section aria-label="Pokémon" aria-busy={loading}>
				{loading && <p role="status">Chargement des Pokémons…</p>}
				{error && (
					<div role="alert">
						<p>{error}</p>
						<button onClick={() => setRetry((value) => value + 1)}>
							Réessayer
						</button>
					</div>
				)}
				{data && <PokemonCard pokemonList={data.pokemonList} />}
			</section>
			<nav className="pagination" aria-label="Pagination des Pokémon">
				<button
					aria-label="Page précédente"
					title="Page précédente"
					disabled={loading || page === 0}
					onClick={() => setPage((value) => value - 1)}
				>
					<span aria-hidden="true">←</span>
				</button>
				{firstVisiblePage > 0 && <>
					<button disabled={loading} aria-label="Page 1" onClick={() => setPage(0)}>1</button>
					{firstVisiblePage > 1 && <span aria-hidden="true">…</span>}
				</>}
				{visiblePages.map((pageIndex) => (
					<button
						key={pageIndex}
						aria-label={`Page ${pageIndex + 1}`}
						aria-current={page === pageIndex ? 'page' : undefined}
						disabled={loading}
						onClick={() => setPage(pageIndex)}
					>
						{pageIndex + 1}
					</button>
				))}
				{firstVisiblePage + visiblePages.length < totalPages && <>
					{firstVisiblePage + visiblePages.length < totalPages - 1 && <span aria-hidden="true">…</span>}
					<button disabled={loading} aria-label={`Page ${totalPages}`} onClick={() => setPage(totalPages - 1)}>{totalPages}</button>
				</>}
				<button
					aria-label="Page suivante"
					title="Page suivante"
					disabled={loading || page >= totalPages - 1}
					onClick={() => setPage((value) => value + 1)}
				>
					<span aria-hidden="true">→</span>
				</button>
			</nav>
		</main>
	);
}

export default App;
