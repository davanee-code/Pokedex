import Navbar from './components/Navbar';
import SearchBar from './components/SearchBar';

function App() {
	return (
		<main className="min-h-screen bg-background text-ink">
			<Navbar selectedCount={0} />
			<div className="py-10 px-8">
				<SearchBar />
			</div>
		</main>
	);
}

export default App;
