export function readSessionPokemonIds(key, maxCount = Infinity) {
	try {
		const stored = JSON.parse(window.sessionStorage.getItem(key) || '[]');
		if (!Array.isArray(stored)) return [];
		return [...new Set(stored.filter((id) => Number.isSafeInteger(id) && id > 0))].slice(0, maxCount);
	} catch {
		return [];
	}
}

export function saveSessionPokemonIds(key, ids) {
	try {
		if (ids.length) window.sessionStorage.setItem(key, JSON.stringify(ids));
		else window.sessionStorage.removeItem(key);
		return true;
	} catch {
		return false;
	}
}
