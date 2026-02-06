import { useState } from 'react';

interface SetupScreenProps {
  onStart: (apiKey: string, zipCode: string) => void;
  onDemo: () => void;
  loading: boolean;
  error: string | null;
}

export function SetupScreen({ onStart, onDemo, loading, error }: SetupScreenProps) {
  const [zipCode, setZipCode] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiInfo, setShowApiInfo] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (zipCode.length === 5 && apiKey.trim()) {
      onStart(apiKey.trim(), zipCode);
    }
  };

  return (
    <div className="setup-screen">
      <div className="setup-content">
        <div className="setup-logo">
          <span className="logo-icon">&#128054;</span>
          <h1>PawSwipe</h1>
          <p className="setup-subtitle">Find your new best friend</p>
        </div>

        <form className="setup-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="zipCode">Your Zip Code</label>
            <input
              id="zipCode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{5}"
              maxLength={5}
              placeholder="e.g. 78701"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="apiKey">
              RescueGroups API Key
              <button
                type="button"
                className="info-toggle"
                onClick={() => setShowApiInfo(!showApiInfo)}
              >
                ?
              </button>
            </label>
            <input
              id="apiKey"
              type="text"
              placeholder="Your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
            />
            {showApiInfo && (
              <div className="api-info-box">
                <p>
                  PawSwipe uses the free{' '}
                  <a
                    href="https://rescuegroups.org/services/adoptable-pet-data-api/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    RescueGroups.org API
                  </a>{' '}
                  to show real adoptable dogs near you.
                </p>
                <ol>
                  <li>Visit the link above and click "Request API Access"</li>
                  <li>Fill out the short form (it's free!)</li>
                  <li>Paste your API key here</li>
                </ol>
              </div>
            )}
          </div>

          {error && <div className="setup-error">{error}</div>}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || zipCode.length !== 5 || !apiKey.trim()}
          >
            {loading ? (
              <span className="spinner" />
            ) : (
              'Find Dogs Near Me'
            )}
          </button>
        </form>

        <div className="setup-divider">
          <span>or</span>
        </div>

        <button className="btn-secondary" onClick={onDemo}>
          Try Demo Mode
        </button>
        <p className="demo-hint">
          Preview the app with sample dogs (no API key needed)
        </p>
      </div>
    </div>
  );
}
