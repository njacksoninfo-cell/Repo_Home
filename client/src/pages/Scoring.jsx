import { useState, useEffect } from 'react';
import { getScoringRules } from '../services/api';

function Scoring() {
  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getScoringRules()
      .then(setRules)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>MLS Fantasy Scoring Rules</h2>
      <p className="text-sm text-muted mb-md">
        Points are calculated based on real-life player performance each gameweek.
        Captain receives double points. These rules mirror the official MLS Fantasy game (2024/2025 season).
      </p>

      <div className="dashboard-grid">
        <div className="card">
          <h2 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Minutes Played</h2>
          <table>
            <thead>
              <tr><th>Action</th><th>Points</th></tr>
            </thead>
            <tbody>
              <tr><td>Playing 1-59 minutes</td><td>+1</td></tr>
              <tr><td>Playing 60+ minutes</td><td>+2</td></tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Goals Scored</h2>
          <table>
            <thead>
              <tr><th>Position</th><th>Points per Goal</th></tr>
            </thead>
            <tbody>
              <tr><td><span className="pos-badge GK">GK</span></td><td>+6</td></tr>
              <tr><td><span className="pos-badge DEF">DEF</span></td><td>+6</td></tr>
              <tr><td><span className="pos-badge MID">MID</span></td><td>+5</td></tr>
              <tr><td><span className="pos-badge FWD">FWD</span></td><td>+4</td></tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Assists</h2>
          <table>
            <thead>
              <tr><th>Action</th><th>Points</th></tr>
            </thead>
            <tbody>
              <tr><td>Assist (all positions)</td><td>+3</td></tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Clean Sheets</h2>
          <p className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>
            Player must play 60+ minutes
          </p>
          <table>
            <thead>
              <tr><th>Position</th><th>Points</th></tr>
            </thead>
            <tbody>
              <tr><td><span className="pos-badge GK">GK</span></td><td>+4</td></tr>
              <tr><td><span className="pos-badge DEF">DEF</span></td><td>+4</td></tr>
              <tr><td><span className="pos-badge MID">MID</span></td><td>+1</td></tr>
              <tr><td><span className="pos-badge FWD">FWD</span></td><td>0</td></tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Penalties & Cards</h2>
          <table>
            <thead>
              <tr><th>Action</th><th>Points</th></tr>
            </thead>
            <tbody>
              <tr><td>Penalty Save</td><td>+5</td></tr>
              <tr><td>Penalty Miss</td><td>-2</td></tr>
              <tr><td>Yellow Card</td><td>-1</td></tr>
              <tr><td>Red Card</td><td>-3</td></tr>
              <tr><td>Own Goal</td><td>-2</td></tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Goalkeeping</h2>
          <table>
            <thead>
              <tr><th>Action</th><th>Points</th></tr>
            </thead>
            <tbody>
              <tr><td>Every 3 saves (GK only)</td><td>+1</td></tr>
              <tr><td>Every 2 goals conceded (GK/DEF, 60+ min)</td><td>-1</td></tr>
            </tbody>
          </table>
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Bonus Points</h2>
          <p className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>
            Bonus points reward additional contributions beyond goals and assists.
          </p>
          <table>
            <thead>
              <tr><th>Action</th><th>Points</th></tr>
            </thead>
            <tbody>
              <tr><td>Big Chance Created</td><td>+1 each</td></tr>
              <tr><td>Every 3 Accurate Crosses</td><td>+1</td></tr>
              <tr><td>Every 4 Key Passes</td><td>+1</td></tr>
              <tr><td>Passing Accuracy 85%+ (on 35+ passes)</td><td>+1</td></tr>
              <tr><td>Every 3 Clearances</td><td>+1</td></tr>
              <tr><td>Every 2 Shots on Target</td><td>+1</td></tr>
            </tbody>
          </table>
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Squad Rules</h2>
          <table>
            <thead>
              <tr><th>Rule</th><th>Value</th></tr>
            </thead>
            <tbody>
              <tr><td>Total Budget</td><td>$100.0M</td></tr>
              <tr><td>Squad Size</td><td>15 players (11 starters + 4 bench)</td></tr>
              <tr><td>Max from same team</td><td>3 players</td></tr>
              <tr><td>Squad composition</td><td>2 GK, 5 DEF, 5 MID, 3 FWD</td></tr>
              <tr><td>Starting lineup</td><td>1 GK + at least 3 DEF, 3 MID, 1 FWD</td></tr>
              <tr><td>Valid formations</td><td>3-4-3, 3-5-2, 4-3-3, 4-4-2, 4-5-1, 5-3-2, 5-4-1</td></tr>
              <tr><td>Captain</td><td>Scores double points</td></tr>
              <tr><td>Transfers</td><td>Unlimited (rolling lockouts per match)</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Scoring;
