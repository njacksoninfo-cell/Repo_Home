import { useState, useCallback } from 'react';
import type { Dog, SwipeDirection } from './types/dog';
import { useDogs } from './hooks/useDogs';
import { SetupScreen } from './components/SetupScreen';
import { SwipeCard } from './components/SwipeCard';
import { Favorites } from './components/Favorites';
import './App.css';

function App() {
  const { dogs, currentIndex, loading, error, isDemo, loadDogs, loadDemo, nextDog } =
    useDogs();
  const [favorites, setFavorites] = useState<Dog[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [started, setStarted] = useState(false);
  const [passedCount, setPassedCount] = useState(0);

  const handleStart = useCallback(
    async (apiKey: string, zipCode: string) => {
      await loadDogs(apiKey, zipCode);
      setStarted(true);
    },
    [loadDogs]
  );

  const handleDemo = useCallback(() => {
    loadDemo();
    setStarted(true);
  }, [loadDemo]);

  const handleSwipe = useCallback(
    (direction: SwipeDirection) => {
      const currentDog = dogs[currentIndex];
      if (!currentDog) return;

      if (direction === 'right') {
        setFavorites((prev) => {
          if (prev.some((d) => d.id === currentDog.id)) return prev;
          return [...prev, currentDog];
        });
      } else {
        setPassedCount((p) => p + 1);
      }

      setTimeout(() => nextDog(), 50);
    },
    [dogs, currentIndex, nextDog]
  );

  const handleRemoveFavorite = useCallback((id: string) => {
    setFavorites((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const handleBack = useCallback(() => {
    setStarted(false);
    setPassedCount(0);
  }, []);

  if (!started || dogs.length === 0) {
    return (
      <SetupScreen
        onStart={handleStart}
        onDemo={handleDemo}
        loading={loading}
        error={error}
      />
    );
  }

  const currentDog = dogs[currentIndex];
  const allSwiped = !currentDog;

  return (
    <div className="app">
      <header className="app-header">
        <button className="header-btn" onClick={handleBack} aria-label="Back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="header-title">
          <span className="header-logo">&#128054;</span>
          <span>PawSwipe</span>
          {isDemo && <span className="demo-badge">Demo</span>}
        </div>
        <button
          className="header-btn favorites-btn"
          onClick={() => setShowFavorites(true)}
          aria-label="View favorites"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill={favorites.length > 0 ? '#ef4444' : 'none'} stroke={favorites.length > 0 ? '#ef4444' : 'currentColor'} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
          {favorites.length > 0 && (
            <span className="favorites-count">{favorites.length}</span>
          )}
        </button>
      </header>

      <div className="stats-bar">
        <span className="stat">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
          {favorites.length} liked
        </span>
        <span className="stat">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          {passedCount} passed
        </span>
        <span className="stat">
          {currentIndex + 1} / {dogs.length}
        </span>
      </div>

      <main className="app-main">
        {allSwiped ? (
          <div className="end-screen">
            <span className="end-icon">&#127881;</span>
            <h2>You've seen all the dogs!</h2>
            <p>
              You liked <strong>{favorites.length}</strong> dog
              {favorites.length !== 1 ? 's' : ''}.
            </p>
            {favorites.length > 0 && (
              <button
                className="btn-primary"
                onClick={() => setShowFavorites(true)}
              >
                View Your Favorites
              </button>
            )}
            <button className="btn-secondary" onClick={handleBack} style={{ marginTop: '12px' }}>
              Start Over
            </button>
          </div>
        ) : (
          <SwipeCard key={currentDog.id} dog={currentDog} onSwipe={handleSwipe} />
        )}
      </main>

      {!allSwiped && currentIndex === 0 && (
        <div className="swipe-hint">
          <span>&larr; Pass</span>
          <span>Like &rarr;</span>
        </div>
      )}

      {showFavorites && (
        <Favorites
          favorites={favorites}
          onClose={() => setShowFavorites(false)}
          onRemove={handleRemoveFavorite}
        />
      )}
    </div>
  );
}

export default App;
