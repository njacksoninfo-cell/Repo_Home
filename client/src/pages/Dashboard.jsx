import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSquad, getDataStatus, getSquadPoints } from '../services/api';

function Dashboard() {
  const [squad, setSquad] = useState(null);
  const [players, setPlayers] = useState([]);
  const [status, setStatus] = useState(null);
  const [points, setPoints] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getSquad().catch(() => null),
      getDataStatus().catch(() => null),
      getSquadPoints().catch(() => null),
    ]).then(([squadData, statusData, pointsData]) => {
      if (squadData) {
        setSquad(squadData.squad);
        setPlayers(squadData.players);
      }
      setStatus(statusData);
      setPoints(pointsData);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  const starters = players.filter(p => p.is_starter);
  const posCount = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  starters.forEach(p => posCount[p.position]++);
  const formation = starters.length === 11
    ? `${posCount.DEF}-${posCount.MID}-${posCount.FWD}`
    : 'Not set';
  const captain = players.find(p => p.is_captain);

  return (
    <div>
      <h2 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>
        {squad?.name || 'MLS Fantasy Game'}
      </h2>

      {status && !status.api_configured && (
        <div className="message info">
          Playing with sample data. To use live MLS data, set the <code>API_FOOTBALL_KEY</code> environment variable.
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-box">
          <div className="label">Squad Size</div>
          <div className="value">{players.length}/15</div>
        </div>
        <div className="stat-box">
          <div className="label">Budget Remaining</div>
          <div className="value success">${squad?.budget_remaining?.toFixed(1) || '100.0'}M</div>
        </div>
        <div className="stat-box">
          <div className="label">Formation</div>
          <div className="value">{formation}</div>
        </div>
        <div className="stat-box">
          <div className="label">Total Points</div>
          <div className="value accent">{points?.total_points || 0}</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h2>Starting XI</h2>
            <Link to="/my-team" className="btn btn-ghost btn-sm">Manage</Link>
          </div>
          {starters.length === 0 ? (
            <div className="empty-state">
              <h3>No lineup set</h3>
              <p className="text-sm text-muted">Go to My Team to pick your starting XI</p>
            </div>
          ) : (
            <Pitch starters={starters} />
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Squad Summary</h2>
            <Link to="/players" className="btn btn-ghost btn-sm">Browse Players</Link>
          </div>
          {players.length === 0 ? (
            <div className="empty-state">
              <h3>No players yet</h3>
              <p className="text-sm text-muted">Browse the player list to build your squad</p>
            </div>
          ) : (
            <div>
              {['GK', 'DEF', 'MID', 'FWD'].map(pos => {
                const posPlayers = players.filter(p => p.position === pos);
                if (posPlayers.length === 0) return null;
                return (
                  <div key={pos} style={{ marginBottom: '0.75rem' }}>
                    <div className="text-sm text-muted" style={{ marginBottom: '0.25rem' }}>
                      <span className={`pos-badge ${pos}`}>{pos}</span>
                      <span style={{ marginLeft: '0.5rem' }}>{posPlayers.length} players</span>
                    </div>
                    {posPlayers.map(p => (
                      <div key={p.id} className="squad-player-row">
                        <div className="squad-player-info">
                          <div className="name">
                            {p.name}
                            {p.is_captain ? ' (C)' : ''}
                            {p.is_starter ? '' : ' - Bench'}
                          </div>
                          <div className="team">{p.team}</div>
                        </div>
                        <div className="price-tag">${p.price}M</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Pitch({ starters }) {
  const gk = starters.filter(p => p.position === 'GK');
  const def = starters.filter(p => p.position === 'DEF');
  const mid = starters.filter(p => p.position === 'MID');
  const fwd = starters.filter(p => p.position === 'FWD');

  return (
    <div className="pitch">
      <div className="pitch-row">{fwd.map(p => <PitchPlayer key={p.id} player={p} />)}</div>
      <div className="pitch-row">{mid.map(p => <PitchPlayer key={p.id} player={p} />)}</div>
      <div className="pitch-row">{def.map(p => <PitchPlayer key={p.id} player={p} />)}</div>
      <div className="pitch-row gk">{gk.map(p => <PitchPlayer key={p.id} player={p} />)}</div>
    </div>
  );
}

function PitchPlayer({ player }) {
  const lastName = player.name.split(' ').pop();
  return (
    <div className="pitch-player">
      <div className="pitch-player-wrapper">
        <div className={`pitch-player-shirt ${player.position}`}>
          {lastName.slice(0, 3).toUpperCase()}
        </div>
        {player.is_captain ? <div className="captain-badge">C</div> : null}
      </div>
      <div className="pitch-player-name" title={player.name}>{lastName}</div>
      <div className="pitch-player-points">{player.total_points} pts</div>
    </div>
  );
}

export default Dashboard;
