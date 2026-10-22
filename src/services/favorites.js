const FAVORITES_KEY = 'pokedex:favorites:v1';

export function readSessionFavorites() {
	try {
		const stored = JSON.parse(window.sessionStorage.getItem(FAVORITES_KEY) || '[]');
		if (!Array.isArray(stored)) return [];
		return [...new Set(stored.filter((id) => Number.isSafeInteger(id) && id > 0))];
	} catch {
		return [];
	}
}

export function saveSessionFavorites(ids) {
	try {
		if (ids.length) window.sessionStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
		else window.sessionStorage.removeItem(FAVORITES_KEY);
		return true;
	} catch {
		return false;
	}
}
