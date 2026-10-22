import PropTypes from 'prop-types';
import { pokemonTypeNames } from '../utils/pokemonTypes';

function TypeIcon({ type }) {
	if (!Object.hasOwn(pokemonTypeNames, type)) return null;

	return (
		<span
			aria-hidden="true"
			className="type-icon"
			style={{
				'--type-icon-url': `url("${import.meta.env.BASE_URL}icons/types/${type}.svg")`,
				'--pokemon-type-color': `var(--color-type-${type})`,
			}}
		/>
	);
}

TypeIcon.propTypes = {
	type: PropTypes.string.isRequired,
};

export default TypeIcon;
