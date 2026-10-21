import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { getPokemonList } from '../services/pokeApi';

function normalizeSearch(value) {
	return value
		.trim()
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');
}

function SearchBar() {
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [pokemonList, setPokemonList] = useState([]);
	const [error, setError] = useState('');
	const [attempt, setAttempt] = useState(0);
	const [open, setOpen] = useState(false);
	const [activeIndex, setActiveIndex] = useState(-1);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError('');
		getPokemonList()
			.then((list) => {
				if (!cancelled) setPokemonList(list);
			})
			.catch(() => {
				if (!cancelled) setError('Impossible de charger les Pokémon.');
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [attempt]);

	const query = normalizeSearch(search);
	const matches = query
		? pokemonList.filter(
				({ name, displayName, id }) =>
					name.includes(query) ||
					normalizeSearch(displayName).includes(query) ||
					String(id) === query,
			)
		: [];
	const suggestions = matches;
	const expanded = open && suggestions.length > 0;
	const activeId = expanded && activeIndex >= 0 ? suggestions[activeIndex]?.id : undefined;

	useEffect(() => {
		if (activeId !== undefined) {
			document.getElementById(`pokemon-option-${activeId}`)?.scrollIntoView({ block: 'nearest' });
		}
	}, [activeId]);

	function selectPokemon(pokemon) {
		setSearch(pokemon.displayName);
		setOpen(false);
		setActiveIndex(-1);
	}

	function handleKeyDown(event) {
		if (event.key === 'Escape') {
			setOpen(false);
			setActiveIndex(-1);
		} else if (
			suggestions.length &&
			['ArrowDown', 'ArrowUp'].includes(event.key)
		) {
			event.preventDefault();
			setOpen(true);
			setActiveIndex(
				(index) =>
					(index + (event.key === 'ArrowDown' ? 1 : -1) + suggestions.length) %
					suggestions.length,
			);
		} else if (event.key === 'Enter' && expanded && activeIndex >= 0) {
			event.preventDefault();
			selectPokemon(suggestions[activeIndex]);
		}
	}
	return (
		<section
			aria-labelledby="pokemon-search-title"
			className="flex flex-col gap-8 rounded-[28px] border border-primary/10 bg-primary-tint px-6 py-8 lg:min-h-[274px] lg:flex-row lg:items-end lg:gap-10 lg:px-10"
		>
			<div className="min-w-0 flex-1">
				<p className="mb-4 text-[11px] font-black uppercase tracking-[0.1em] text-[#cf263b]">
					Base PokéAPI
					{!loading && !error ? ` · ${pokemonList.length} entrées` : ''}
				</p>
				<h1
					id="pokemon-search-title"
					className="max-w-[600px] text-[36px] leading-[1.08] font-black tracking-[-0.035em] text-ink sm:text-[44px] xl:text-[52px]"
				>
					Explorez votre prochain compagnon
				</h1>
				<p className="mt-4 max-w-[510px] text-sm leading-6 text-muted">
					Parcourez les espèces, comparez leurs caractéristiques et gardez les
					plus prometteuses dans votre sélection.
				</p>
			</div>
			<div className="relative w-full shrink-0 rounded-[17px] border border-primary/15 bg-white px-2 shadow-[0_12px_30px_rgba(150,70,50,0.07)] focus-within:ring-2 focus-within:ring-primary/20 lg:w-[44%]">
				<div className="flex min-h-[50px] flex-row items-center gap-3 px-2.5">
					<FontAwesomeIcon
						icon={faMagnifyingGlass}
						className="text-[13px] text-ink"
					/>
					<input
						id="pokemon-search"
						role="combobox"
						aria-label="Rechercher un Pokémon par son nom français, anglais ou son ID"
						aria-autocomplete="list"
						aria-expanded={expanded}
						aria-controls="pokemon-suggestions"
						aria-activedescendant={
							expanded && activeIndex >= 0
								? `pokemon-option-${suggestions[activeIndex].id}`
								: undefined
						}
						autoComplete="off"
						value={search}
						onChange={(event) => {
							setSearch(event.target.value);
							setOpen(true);
							setActiveIndex(-1);
						}}
						onFocus={() => setOpen(true)}
						onBlur={() => {
							setOpen(false);
							setActiveIndex(-1);
						}}
						onKeyDown={handleKeyDown}
						type="search"
						placeholder="Rechercher un Pokémon par son nom ou son ID..."
						className="min-w-0 w-full bg-transparent py-3 text-sm text-ink outline-none placeholder:text-muted"
					/>
				</div>
				<div
					className="flex min-h-[34px] items-center justify-between gap-3 border-t border-ink/5 px-2.5 py-2 text-[10px] text-muted"
					role="status"
				>
					<p className="flex items-center gap-1.5">
						<span
							aria-hidden="true"
							className={`size-1.5 shrink-0 rounded-full ${error ? 'bg-primary' : 'bg-accent'} ${loading ? 'animate-pulse' : ''}`}
						/>
						{loading
							? 'Chargement des suggestions…'
							: error ||
								(query
									? 'Recherche terminée'
									: 'Les noms de Pokémon sont en Français')}
					</p>
					{!loading && !error && query && (
						<p className="shrink-0">
							{matches.length === 0
								? 'Aucun résultat'
								: `${matches.length} résultat${matches.length > 1 ? 's' : ''}`}
						</p>
					)}
					{error && (
						<button
							type="button"
							className="underline"
							onClick={() => setAttempt((value) => value + 1)}
						>
							Réessayer
						</button>
					)}
				</div>
				<ul
					id="pokemon-suggestions"
					role="listbox"
					aria-label="Suggestions de Pokémon"
					hidden={!expanded}
					className="absolute top-full left-0 right-0 z-10 mt-2 max-h-80 overflow-y-auto overscroll-contain rounded-md bg-background shadow-lg"
				>
					{expanded &&
						suggestions.map((pokemon, index) => (
							<li
								key={pokemon.id}
								id={`pokemon-option-${pokemon.id}`}
								role="option"
								aria-selected={index === activeIndex}
								onMouseDown={(event) => event.preventDefault()}
								onClick={() => selectPokemon(pokemon)}
								className={`cursor-pointer px-6 py-3 hover:bg-accent-tint hover:text-accent ${index === activeIndex ? 'bg-accent-tint text-accent' : ''}`}
							>
								<span className="capitalize">{pokemon.displayName}</span>
								<span className="float-right text-muted">#{pokemon.id}</span>
							</li>
						))}
				</ul>
			</div>
		</section>
	);
}

export default SearchBar;
