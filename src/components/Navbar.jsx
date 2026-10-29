import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faBars,
	faXmark,
	faLayerGroup,
} from '@fortawesome/free-solid-svg-icons';

const menuItems = [
	{ label: 'Explorer', view: 'explore' },
	{ label: 'Mon équipe', view: 'team' },
	{ label: 'Mes favoris', view: 'favorites' },
];

function Navbar({ selectedCount, activeView, onNavigate }) {
	const dialogRef = useRef(null);
	const [menuOpen, setMenuOpen] = useState(false);

	function closeMenu() {
		dialogRef.current?.close();
	}

	function navigateTo(view) {
		onNavigate(view);
		closeMenu();
	}

	useEffect(() => {
		const desktop = window.matchMedia('(min-width: 64rem)');
		const handleResize = () => {
			if (desktop.matches) dialogRef.current?.close();
		};
		desktop.addEventListener('change', handleResize);
		return () => desktop.removeEventListener('change', handleResize);
	}, []);

	useEffect(() => {
		if (!menuOpen) return;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = previousOverflow;
		};
	}, [menuOpen]);

	return (
		<nav
			aria-label="Navigation principale"
			className="flex w-full min-w-0 flex-wrap items-center gap-sm border-b border-ink/10 bg-warm-background px-md py-xs sm:px-xl"
		>
			<button
				type="button"
				aria-label="Ouvrir le menu"
				aria-controls="mobile-navigation"
				aria-expanded={menuOpen}
				onClick={() => {
					dialogRef.current.showModal();
					setMenuOpen(true);
				}}
				className="flex size-11 shrink-0 items-center justify-center rounded-sm hover:bg-accent-tint focus-visible:outline-accent lg:hidden"
			>
				<FontAwesomeIcon icon={faBars} className="text-xl" />
			</button>
			<div className="flex min-w-0 flex-1 items-center gap-sm lg:flex-none">
				<img
					src="/pokeball.png"
					alt="Logo PokéTeam Lab"
					width="24"
					height="24"
					className="h-6 w-6 shrink-0 object-contain"
				/>
				<p className="min-w-0 break-words text-sm font-semibold sm:text-base">
					PokéTeam Lab
				</p>
			</div>
			<div className="text-ink hidden justify-center items-center gap-xl flex-1 lg:flex">
				{menuItems.map((item) => (
					<button
						key={item.label}
						type="button"
						aria-current={item.view === activeView ? 'page' : undefined}
						onClick={() => navigateTo(item.view)}
						className={`rounded-lg px-sm py-xs hover:bg-accent-tint focus-visible:outline-accent ${item.view === activeView ? 'bg-accent-tint text-accent font-semibold' : ''}`}
					>
						{item.label}
					</button>
				))}
			</div>
			<div className="shrink-0">
				<button
					type="button"
					aria-label={`Ma sélection : ${selectedCount} Pokémon`}
					onClick={() => navigateTo('team')}
					className="flex min-h-11 items-center justify-center gap-sm bg-ink text-xs text-white rounded-xl py-sm px-md font-bold sm:text-sm"
				>
					<FontAwesomeIcon icon={faLayerGroup} className="sm:hidden" />
					<span className="hidden sm:inline">Ma sélection</span>
					<span>({selectedCount})</span>
				</button>
			</div>
			<dialog
				ref={dialogRef}
				id="mobile-navigation"
				aria-labelledby="mobile-menu-title"
				onClose={() => setMenuOpen(false)}
				onClick={(event) => {
					if (event.target !== event.currentTarget) return;
					const bounds = event.currentTarget.getBoundingClientRect();
					if (
						event.clientX < bounds.left ||
						event.clientX > bounds.right ||
						event.clientY < bounds.top ||
						event.clientY > bounds.bottom
					)
						closeMenu();
				}}
				className="mobile-navigation fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-5/6 max-w-menu border-0 bg-background p-5 text-ink shadow-xl backdrop:bg-ink/40"
			>
				<div className="mb-8 flex items-center justify-between gap-3">
					<p id="mobile-menu-title" className="font-bold">
						PokéTeam Lab
					</p>
					<button
						type="button"
						onClick={closeMenu}
						aria-label="Fermer le menu"
						className="flex size-11 items-center justify-center rounded-sm hover:bg-accent-tint focus-visible:outline-accent"
					>
						<FontAwesomeIcon icon={faXmark} className="text-xl" />
					</button>
				</div>
				<div className="flex flex-col gap-2">
					{menuItems.map((item) => (
						<button
							type="button"
							key={item.label}
							aria-current={item.view === activeView ? 'page' : undefined}
							onClick={() => navigateTo(item.view)}
							className={`min-h-12 rounded-sm px-lg py-md text-left hover:bg-accent-tint focus-visible:outline-accent ${item.view === activeView ? 'bg-accent-tint text-accent font-semibold' : ''}`}
						>
							{item.label}
						</button>
					))}
				</div>
			</dialog>
		</nav>
	);
}

Navbar.propTypes = {
	selectedCount: PropTypes.number.isRequired,
	activeView: PropTypes.string.isRequired,
	onNavigate: PropTypes.func.isRequired,
};

export default Navbar;
