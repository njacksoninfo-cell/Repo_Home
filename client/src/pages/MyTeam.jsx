import { useState, useEffect } from 'react';
import { getSquad, removePlayer, setLineup, renameSquad } from '../services/api';

function MyTeam() {
  const [squad, setSquadData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [selectedStarters, setSelectedStarters] = useState(new Set());
  const [captainId, setCaptainId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [teamName, setTeamName] = useState('');

  const fetchSquad = async () => {
    try {
      const data = await getSquad();
      setSquadData(data.squad);
      setPlayers(data.players);
      setSelectedStarters(new Set(data.players.filter(p => p.is_starter).map(p => p.id)));
      setCaptainId(data.players.find(p => p.is_captain)?.id || null);
      setTeamName(data.squad.name);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
    setLoading(false);
  };

  useEffect(() => { fetchSquad(); }, []);

  const handleRemove = async (playerId) => {
    try {
      await removePlayer(playerId);
      setMessage({ type: 'success', text: 'Player removed' });
      fetchSquad();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const toggleStarter = (playerId) => {
    setSelectedStarters(prev => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
        if (captainId === playerId) setCaptainId(null);
      } else {
        if (next.size < 11) next.add(playerId);
      }
      return next;
    });
  };

  const handleSaveLineup = async () => {
    try {
      const result = await setLineup([...selectedStarters], captainId);
      setMessage({ type: 'success', text: result.message });
      fetchSquad();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleRename = async () => {
    try {
      await renameSquad(teamName);
      setMessage({ type: 'success', text: 'Team name updated' });
      setEditing(false);
      fetchSquad();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  if (loading) return <div className="loading">Loading...</div>;

  const starters = players.filter(p => selectedStarters.has(p.id));
  const posCount = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  starters.forEach(p => posCount[p.position]++);

  const isValidFormation = posCount.GK === 1 && posCount.DEF >= 3 && posCount.MID >= 3 && posCount.FWD >= 1;

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        {editing ? (
          <div className="flex gap-sm">
            <input value={teamName} onChange={e => setTeamName(e.target.value)} />
            <button className="btn btn-success btn-sm" onClick={handleRename}>Save</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        ) : (
          <h2 style={{ fontSize: '1.3rem' }}>
            {squad?.name}
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: '0.5rem' }} onClick={() => setEditing(true)}>
              Edit
            </button>
          </h2>
        )}
      </div>

      {message && <div className={`message ${message.type}`}>{message.text}</div>}

      <div className="stats-grid">
        <div className="stat-box">
          <div className="label">Squad</div>
          <div className="value">{players.length}/15</div>
        </div>
        <div className="stat-box">
          <div className="label">Budget Left</div>
          <div className="value success">${squad?.budget_remaining?.toFixed(1)}M</div>
        </div>
        <div className="stat-box">
          <div className="label">Starters</div>
          <div className="value">{selectedStarters.size}/11</div>
        </div>
        <div className="stat-box">
          <div className="label">Formation</div>
          <div className="value" style={{ color: isValidFormation ? 'var(--success)' : 'var(--warning)' }}>
            {selectedStarters.size === 11 ? `${posCount.DEF}-${posCount.MID}-${posCount.FWD}` : '--'}
          </div>
        </div>
      </div>

      {players.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <h3>Your squad is empty</h3>
            <p className="text-sm text-muted">Go to the Players page to start building your team.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="card-header">
              <h2>Set Your Lineup</h2>
              <button
                className="btn btn-primary"
                onClick={handleSaveLineup}
                disabled={selectedStarters.size !== 11 || !captainId || !isValidFormation}
              >
                Save Lineup
              </button>
            </div>

            {selectedStarters.size === 11 && !isValidFormation && (
              <div className="message error">
                Invalid formation. Need: 1 GK, 3+ DEF, 3+ MID, 1+ FWD
              </div>
            )}

            <div className="text-sm text-muted mb-md">
              Click players to toggle starter/bench. Click (C) to set captain. Need 1 GK, 3+ DEF, 3+ MID, 1+ FWD.
            </div>

            {['GK', 'DEF', 'MID', 'FWD'].map(pos => {
              const posPlayers = players.filter(p => p.position === pos);
              if (posPlayers.length === 0) return null;
              return (
                <div key={pos} style={{ marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    <span className={`pos-badge ${pos}`}>{pos}</span>
                    <span className="text-muted" style={{ marginLeft: '0.5rem', fontWeight: 400 }}>
                      {posPlayers.filter(p => selectedStarters.has(p.id)).length} starting
                    </span>
                  </h3>
                  {posPlayers.map(p => {
                    const isStarter = selectedStarters.has(p.id);
                    const isCaptain = captainId === p.id;
                    return (
                      <div
                        key={p.id}
                        className="squad-player-row"
                        style={{
                          background: isStarter ? 'rgba(46, 204, 113, 0.1)' : 'transparent',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ width: '30px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isStarter}
                            onChange={() => toggleStarter(p.id)}
                            style={{ cursor: 'pointer' }}
                          />
                        </div>
                        <div className="squad-player-info" onClick={() => toggleStarter(p.id)}>
                          <div className="name">
                            {p.name}
                            {isCaptain && <span style={{ color: 'var(--accent)', fontWeight: 800 }}> (C)</span>}
                            {!isStarter && <span className="text-muted"> - Bench</span>}
                          </div>
                          <div className="team">{p.team} | {p.goals}G {p.assists}A</div>
                        </div>
                        <div className="price-tag">${p.price}M</div>
                        {isStarter && (
                          <button
                            className={`btn btn-sm ${isCaptain ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={(e) => { e.stopPropagation(); setCaptainId(p.id); }}
                            title="Set as captain"
                          >
                            C
                          </button>
                        )}
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={(e) => { e.stopPropagation(); handleRemove(p.id); }}
                        >
                          Drop
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default MyTeam;
