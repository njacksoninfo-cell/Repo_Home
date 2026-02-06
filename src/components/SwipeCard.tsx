import { useState } from 'react';
import type { Dog, SwipeDirection } from '../types/dog';
import { useSwipe } from '../hooks/useSwipe';

interface SwipeCardProps {
  dog: Dog;
  onSwipe: (direction: SwipeDirection) => void;
}

export function SwipeCard({ dog, onSwipe }: SwipeCardProps) {
  const { cardRef, style, direction, triggerSwipe } = useSwipe(onSwipe);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const photo = dog.photos[photoIndex] ?? '';
  const hasMultiplePhotos = dog.photos.length > 1;

  return (
    <div className="swipe-card-container">
      <div ref={cardRef} className="swipe-card" style={style}>
        {/* Swipe indicators */}
        {direction === 'right' && (
          <div className="swipe-indicator swipe-indicator-yes">ADOPT</div>
        )}
        {direction === 'left' && (
          <div className="swipe-indicator swipe-indicator-no">PASS</div>
        )}

        {/* Photo */}
        <div className="card-photo-container">
          {photo ? (
            <img
              src={photo}
              alt={dog.name}
              className="card-photo"
              draggable={false}
            />
          ) : (
            <div className="card-photo-placeholder">
              <span className="placeholder-paw">&#128062;</span>
              <span>No photo available</span>
            </div>
          )}

          {/* Photo navigation dots */}
          {hasMultiplePhotos && (
            <div className="photo-dots">
              {dog.photos.map((_, i) => (
                <button
                  key={i}
                  className={`photo-dot ${i === photoIndex ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotoIndex(i);
                  }}
                />
              ))}
            </div>
          )}

          {/* Gradient overlay */}
          <div className="card-gradient" />
        </div>

        {/* Info overlay */}
        <div className="card-info" onClick={() => setExpanded(!expanded)}>
          <div className="card-header">
            <h2 className="card-name">{dog.name}</h2>
            <span className="card-age">{dog.age}</span>
          </div>
          <p className="card-breed">{dog.breed}</p>
          <div className="card-meta">
            <span className="card-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {dog.location}
              {dog.distance && ` (${dog.distance})`}
            </span>
            <span className="card-meta-item">
              {dog.sex} &middot; {dog.size}
            </span>
          </div>

          {expanded && (
            <div className="card-expanded">
              <p className="card-description">{dog.description}</p>
              <p className="card-org">{dog.organizationName}</p>
              {dog.url && (
                <a
                  href={dog.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  View full profile &rarr;
                </a>
              )}
            </div>
          )}

          {!expanded && (
            <button className="expand-btn">
              Tap for more info
            </button>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="action-buttons">
        <button
          className="action-btn action-btn-no"
          onClick={() => triggerSwipe('left')}
          aria-label="Pass"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <button
          className="action-btn action-btn-yes"
          onClick={() => triggerSwipe('right')}
          aria-label="Like"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
