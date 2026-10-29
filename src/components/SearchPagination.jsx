import PropTypes from 'prop-types';

function SearchPagination({
	currentPage,
	totalPages,
	pageOffset,
	visibleCount,
	resultCount,
	busy,
	onPageChange,
}) {
	const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
		(number) =>
			number === 1 || number === totalPages || Math.abs(number - currentPage) <= 1
	);

	return (
		<footer className="pagination-footer flex flex-wrap items-center gap-md py-sm">
			<p className="text-xs text-muted" aria-live="polite">
				Affichage{' '}
				{visibleCount
					? `${pageOffset + 1}–${pageOffset + visibleCount}`
					: '0'}{' '}
				sur {resultCount}
				{busy ? ' · chargement en cours' : ''}
			</p>
			{totalPages > 1 && (
				<nav
					aria-label="Pagination des Pokémon"
					className="flex w-full flex-wrap items-center justify-center gap-xs"
				>
					<button
						type="button"
						disabled={busy || currentPage === 1}
						onClick={() => onPageChange(currentPage - 1)}
						className="pagination-button"
						aria-label="Page précédente"
					>
						←
					</button>
					{pageNumbers.map((number, index) => (
						<span key={number} className="flex items-center gap-xs">
							{index > 0 && number - pageNumbers[index - 1] > 1 && (
								<span aria-hidden="true" className="text-muted">
									…
								</span>
							)}
							<button
								type="button"
								aria-label={`Page ${number}`}
								aria-current={number === currentPage ? 'page' : undefined}
								disabled={busy}
								onClick={() => onPageChange(number)}
								className="pagination-button"
							>
								{number}
							</button>
						</span>
					))}
					<button
						type="button"
						disabled={busy || currentPage === totalPages}
						onClick={() => onPageChange(currentPage + 1)}
						className="pagination-button"
						aria-label="Page suivante"
					>
						→
					</button>
				</nav>
			)}
		</footer>
	);
}

SearchPagination.propTypes = {
	currentPage: PropTypes.number.isRequired,
	totalPages: PropTypes.number.isRequired,
	pageOffset: PropTypes.number.isRequired,
	visibleCount: PropTypes.number.isRequired,
	resultCount: PropTypes.number.isRequired,
	busy: PropTypes.bool.isRequired,
	onPageChange: PropTypes.func.isRequired,
};

export default SearchPagination;
