import { useState } from 'react';
import PropTypes from 'prop-types';
import TypeIcon from './TypeIcon';
import { pokemonTypeNames } from '../utils/pokemonTypes';
import { toggleSelection } from '../utils/pokemonFilters';

function SearchFilters({
	selectedTypes,
	selectedGenerations,
	selectedCapabilities,
	onTypesChange,
	onGenerationsChange,
	onCapabilitiesChange,
	onReset,
}) {
	const [filtersOpen, setFiltersOpen] = useState(false);
	const activeFilterCount =
		selectedTypes.length + selectedGenerations.length + selectedCapabilities.length;

	return (
		<aside
			aria-label="Filtres de recherche"
			className="search-filters-panel flex min-w-0 flex-col gap-md self-start rounded-md border border-ink/10 bg-white p-md shadow-sm"
		>
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
					onClick={onReset}
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
						onClick={() => onTypesChange([])}
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
								onClick={() => onTypesChange(toggleSelection(selectedTypes, value))}
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
						onClick={() => onGenerationsChange([])}
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
								onClick={() => onGenerationsChange(toggleSelection(selectedGenerations, value))}
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
							onChange={() => onCapabilitiesChange(toggleSelection(selectedCapabilities, 'fast'))}
							className="accent-ink"
						/>
						<span className="flex flex-col gap-xs">
							<span className="font-medium">Rapide</span>
							<span className="text-xs text-muted">Vitesse de base ≥ 100</span>
						</span>
					</label>
					<label className="filter-checkbox">
						<input
							type="checkbox"
							checked={selectedCapabilities.includes('dual')}
							onChange={() => onCapabilitiesChange(toggleSelection(selectedCapabilities, 'dual'))}
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
	);
}

SearchFilters.propTypes = {
	selectedTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
	selectedGenerations: PropTypes.arrayOf(PropTypes.string).isRequired,
	selectedCapabilities: PropTypes.arrayOf(PropTypes.string).isRequired,
	onTypesChange: PropTypes.func.isRequired,
	onGenerationsChange: PropTypes.func.isRequired,
	onCapabilitiesChange: PropTypes.func.isRequired,
	onReset: PropTypes.func.isRequired,
};

export default SearchFilters;
