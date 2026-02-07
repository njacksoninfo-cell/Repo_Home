import type { Dog } from '../types/dog';

interface FavoritesProps {
  favorites: Dog[];
  onClose: () => void;
  onRemove: (id: string) => void;
}

export function Favorites({ favorites, onClose, onRemove }: FavoritesProps) {
  return (
    <div className="favorites-overlay">
      <div className="favorites-panel">
        <div className="favorites-header">
          <h2>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#ef4444" stroke="none" style={{ verticalAlign: 'text-bottom', marginRight: '8px' }}>
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
            Your Favorites ({favorites.length})
          </h2>
          <button className="close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {favorites.length === 0 ? (
          <div className="favorites-empty">
            <span className="empty-icon">&#128054;</span>
            <p>No favorites yet!</p>
            <p className="empty-hint">Swipe right on dogs you love to save them here.</p>
          </div>
        ) : (
          <div className="favorites-list">
            {favorites.map((dog) => (
              <div key={dog.id} className="favorite-card">
                <div className="favorite-photo-wrapper">
                  {dog.photos[0] ? (
                    <img
                      src={dog.photos[0]}
                      alt={dog.name}
                      className="favorite-photo"
                    />
                  ) : (
                    <div className="favorite-photo-placeholder">&#128062;</div>
                  )}
                </div>
                <div className="favorite-info">
                  <h3>{dog.name}</h3>
                  <p className="favorite-breed">{dog.breed}</p>
                  <p className="favorite-meta">
                    {dog.age} &middot; {dog.sex} &middot; {dog.location}
                  </p>
                  <p className="favorite-org">{dog.organizationName}</p>
                  <a
                    href={dog.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="favorite-adopt-btn"
                  >
                    Adopt {dog.name}
                  </a>
                </div>
                <button
                  className="remove-btn"
                  onClick={() => onRemove(dog.id)}
                  aria-label={`Remove ${dog.name}`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
