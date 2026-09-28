// import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

function SearchBar() {
	// const [loading, setLoading] = useState();
	// const [search, setSearch] = useState('');
	return (
		<div className="flex flex-row bg-primary-tint rounded-xl px-6 py-8 justify-between gap-xl">
			<div className="flex flex-col gap-md">
				<p className="font-extrabold text-4xl">
					Epxlorez votre prochain compagnon
				</p>
				<p>
					Parcourez les espèces, comparez leurs caractéristiques et gardez les
					plus prometteuses dans votre sélection.
				</p>
			</div>
			<div className="flex flex-1 flex-col justify-center bg-background rounded-lg px-6 py-2 gap-md">
				<div className="flex flex-row items-center gap-sm">
					<FontAwesomeIcon icon={faMagnifyingGlass} className="text-muted" />
					<input
						id="pokemon-search"
						type="search"
						placeholder="Rechercher un Pokémon par son nom ou son ID..."
						className="w-full bg-transparent outline-none"
					/>
				</div>
				{/* <div className="text-sm">
					{loading ? `Recherche en cours ...` : `Aucun recherche en cours.`}
				</div> */}
			</div>
		</div>
	);
}

export default SearchBar;
