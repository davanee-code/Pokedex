import PropTypes from 'prop-types';

function Navbar({ selectedCount }) {
	return (
		<nav className="flex w-full border-b border-gray-300 bg-warm-background px-6 py-4">
			<div className="flex items-center gap-sm">
				<img
					src="/pokeball.png"
					alt="Logo PokéTeam Lab"
					className="h-6 w-6 object-contain"
				/>
				<p>Pokédex Lab</p>
			</div>
			<div className="text-ink flex justify-center items-center gap-xl flex-1">
				<button className="focus:bg-accent-tint focus:text-accent rounded-lg py-1 px-2">
					Explorer
				</button>
				<button className="focus:bg-accent-tint focus:text-accent rounded-lg py-1 px-2">
					Mon équipe
				</button>
				<button className="focus:bg-accent-tint focus:text-accent rounded-lg py-1 px-2">
					Comparer
				</button>
				<button className="focus:bg-accent-tint focus:text-accent rounded-lg py-1 px-2">
					Favoris
				</button>
			</div>
			<div>
				<button className="bg-ink text-sm text-white rounded-xl py-1 px-2 font-bold">
					Ma séléction({selectedCount})
				</button>
			</div>
		</nav>
	);
}

Navbar.propTypes = {
	selectedCount: PropTypes.number.isRequired,
};

export default Navbar;
