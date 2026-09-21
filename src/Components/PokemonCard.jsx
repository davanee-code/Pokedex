import '../App.css';
import PropTypes from 'prop-types';

function PokemonCard({ pokemonList }) {
	return (
		<div className="cardContainer">
			{pokemonList.map((pokemon) => (
				<div key={pokemon.id}>
					<figure className="card" style={{ backgroundColor: pokemon.color }}>
						{!pokemon.imgSrc ? (
							<p className="card-noimg">???</p>
						) : (
							<img
								src={pokemon.imgSrc}
								alt={pokemon.name}
								className="card-img"
							/>
						)}
						<figcaption style={{ color: pokemon.imgSrc ? 'white' : 'black' }}>
							{pokemon.name}
						</figcaption>
					</figure>
				</div>
			))}
		</div>
	);
}

PokemonCard.propTypes = {
	pokemonList: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.number.isRequired,
			name: PropTypes.string.isRequired,
			imgSrc: PropTypes.string,
			color: PropTypes.string.isRequired,
		}),
	).isRequired,
};

export default PokemonCard;
