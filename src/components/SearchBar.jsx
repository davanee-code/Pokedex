import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';

function normalizeSearch(value) {
	return value
		.trim()
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');
}

function SearchBar({ pokemonList, loading, error, onRetry, onSearch }) {
	const [search, setSearch] = useState('');
	const [open, setOpen] = useState(false);
	const [activeIndex, setActiveIndex] = useState(-1);

	const query = normalizeSearch(search);
	const matches = query
		? pokemonList.filter(
				({ name, displayName, id }) =>
					name.includes(query) ||
					normalizeSearch(displayName).includes(query) ||
					String(id) === query,
			)
		: [];
	const expanded = open && matches.length > 0;
	const activeId =
		expanded && activeIndex >= 0 ? matches[activeIndex]?.id : undefined;
	let searchStatus = 'Noms français ou anglais acceptés.';
	if (loading) {
		searchStatus = 'Chargement des suggestions…';
	} else if (error) {
		searchStatus = error;
	} else if (query) {
		searchStatus = 'Recherche terminée';
	}

	useEffect(() => {
		if (activeId !== undefined) {
			document
				.getElementById(`pokemon-option-${activeId}`)
				?.scrollIntoView({ block: 'nearest' });
		}
	}, [activeId]);

	function selectPokemon(pokemon) {
		setSearch(pokemon.displayName);
		setOpen(false);
		setActiveIndex(-1);
	}

	function handleKeyDown(event) {
		if (event.nativeEvent.isComposing) return;
		if (event.key === 'Escape') {
			setOpen(false);
			setActiveIndex(-1);
		} else if (
			matches.length &&
			['ArrowDown', 'ArrowUp'].includes(event.key)
		) {
			event.preventDefault();
			setOpen(true);
			setActiveIndex((index) => {
				if (index < 0) return event.key === 'ArrowDown' ? 0 : matches.length - 1;
				return (index + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length;
			});
		} else if (event.key === 'Enter' && activeId !== undefined) {
			event.preventDefault();
			selectPokemon(matches[activeIndex]);
		}
	}

	function handleSubmit(event) {
		event.preventDefault();
		if (!query || loading || error) return;
		onSearch(search.trim(), matches);
		setOpen(false);
		setActiveIndex(-1);
	}

	return (
		<section
			aria-labelledby="pokemon-search-title"
			className="relative z-20 flex w-full min-w-0 shrink-0 flex-col gap-md rounded-lg border border-primary/10 bg-primary-tint px-lg py-lg sm:px-xl sm:py-xl lg:flex-row lg:items-end lg:gap-columns"
		>
			<div className="flex min-w-0 flex-1 flex-col gap-md">
				<h1
					id="pokemon-search-title"
					className="wrap-anywhere text-hero leading-title font-black tracking-title text-ink sm:text-hero-tablet xl:text-hero-desktop"
				>
					Explorez votre prochain compagnon
				</h1>
				<p className="text-sm leading-6 text-muted">
					Parcourez les espèces, comparez leurs caractéristiques et gardez les
					plus prometteuses dans votre sélection.
				</p>
			</div>
			<form
				onSubmit={handleSubmit}
				className="relative w-full min-w-0 shrink-0 rounded-md border border-primary/15 bg-white px-sm shadow-search focus-within:ring-2 focus-within:ring-primary/20 lg:w-5/12"
			>
				<div className="flex min-w-0 flex-row items-center gap-sm px-xs sm:gap-md sm:px-md">
					<button
						type="submit"
						aria-label="Afficher les résultats de recherche"
						disabled={loading || Boolean(error) || !query}
						className="flex min-h-11 shrink-0 items-center justify-center px-xs disabled:opacity-50"
					>
						<FontAwesomeIcon
							icon={faMagnifyingGlass}
							className="text-sm text-ink"
						/>
					</button>
					<input
						id="pokemon-search"
						role="combobox"
						aria-label="Rechercher un Pokémon par son nom français, anglais ou son ID"
						aria-autocomplete="list"
						aria-expanded={expanded}
						aria-controls="pokemon-suggestions"
						aria-activedescendant={
							activeId !== undefined
								? `pokemon-option-${activeId}`
								: undefined
						}
						autoComplete="off"
						value={search}
						onChange={(event) => {
							const value = event.target.value;
							setSearch(value);
							setOpen(Boolean(value));
							setActiveIndex(-1);
							if (!value && !loading && !error) onSearch('', pokemonList);
						}}
						onFocus={() => setOpen(true)}
						onBlur={() => {
							setOpen(false);
							setActiveIndex(-1);
						}}
						onKeyDown={handleKeyDown}
						type="search"
						placeholder="Nom ou ID du Pokémon…"
						className="min-w-0 w-0 flex-1 bg-transparent py-md text-base text-ink outline-none placeholder:text-muted sm:text-sm"
					/>
				</div>
				<div
					className="flex flex-wrap items-center justify-between gap-sm border-t border-ink/5 px-md py-sm text-xs text-muted sm:text-caption"
					role="status"
				>
					<p className="flex min-w-0 items-center gap-xs wrap-anywhere">
						<span
							aria-hidden="true"
							className={`size-xs shrink-0 rounded-full ${error ? 'bg-primary' : 'bg-accent'} ${loading ? 'motion-safe:animate-pulse' : ''}`}
						/>
						{searchStatus}
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
							onClick={onRetry}
						>
							Réessayer
						</button>
					)}
				</div>
				<div
					hidden={!expanded}
					className="absolute top-full left-0 right-0 z-10 pt-sm"
				>
					<ul
						id="pokemon-suggestions"
						role="listbox"
						aria-label="Suggestions de Pokémon"
						hidden={!expanded}
						className="max-h-suggestions overflow-y-auto overscroll-contain rounded-md bg-background shadow-lg"
					>
						{expanded &&
							matches.map((pokemon, index) => (
								<li
									key={pokemon.id}
									id={`pokemon-option-${pokemon.id}`}
									role="option"
									aria-selected={index === activeIndex}
									onMouseDown={(event) => event.preventDefault()}
									onClick={() => selectPokemon(pokemon)}
									className={`flex min-h-12 cursor-pointer items-center justify-between gap-md px-lg py-md hover:bg-accent-tint hover:text-accent ${index === activeIndex ? 'bg-accent-tint text-accent' : ''}`}
								>
									<span className="min-w-0 break-words capitalize">
										{pokemon.displayName}
									</span>
									<span className="shrink-0 text-muted">#{pokemon.id}</span>
								</li>
							))}
					</ul>
				</div>
			</form>
		</section>
	);
}

SearchBar.propTypes = {
	pokemonList: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.number.isRequired,
		name: PropTypes.string.isRequired,
		displayName: PropTypes.string.isRequired,
	})).isRequired,
	loading: PropTypes.bool.isRequired,
	error: PropTypes.string.isRequired,
	onRetry: PropTypes.func.isRequired,
	onSearch: PropTypes.func.isRequired,
};

export default SearchBar;
