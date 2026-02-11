import { useState, useEffect, useCallback } from 'react';
import { getPlayers, getSquad, addPlayer, removePlayer } from '../services/api';

function Players() {
  const [players, setPlayers] = useState([]);
  const [squadPlayerIds, setSquadPlayerIds] = useState(new Set());
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState('');
  const [sort, setSort] = useState('total_points');
  const [order, setOrder] = useState('DESC');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [playerData, squadData] = await Promise.all([
        getPlayers({ search, position, sort, order, limit: 100 }),
        getSquad().catch(() => ({ players: [] })),
      ]);
      setPlayers(playerData.players);
      setTotal(playerData.total);
      setSquadPlayerIds(new Set(squadData.players.map(p => p.id)));
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
    setLoading(false);
  }, [search, position, sort, order]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async (playerId) => {
    try {
      const result = await addPlayer(playerId);
      setMessage({ type: 'success', text: result.message });
      setSquadPlayerIds(prev => new Set([...prev, playerId]));
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleRemove = async (playerId) => {
    try {
      await removePlayer(playerId);
      setMessage({ type: 'success', text: 'Player removed from squad' });
      setSquadPlayerIds(prev => {
        const next = new Set(prev);
        next.delete(playerId);
        return next;
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const toggleSort = (col) => {
    if (sort === col) {
      setOrder(o => o === 'DESC' ? 'ASC' : 'DESC');
    } else {
      setSort(col);
      setOrder('DESC');
    }
  };

  const sortIndicator = (col) => {
    if (sort !== col) return '';
    return order === 'DESC' ? ' \u25BC' : ' \u25B2';
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>Player Database</h2>

      {message && <div className={`message ${message.type}`}>{message.text}</div>}

      <div className="filters">
        <input
          type="text"
          placeholder="Search players..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '200px' }}
        />
        <select value={position} onChange={e => setPosition(e.target.value)}>
          <option value="">All Positions</option>
          <option value="GK">Goalkeeper</option>
          <option value="DEF">Defender</option>
          <option value="MID">Midfielder</option>
          <option value="FWD">Forward</option>
        </select>
      </div>

      <div className="card">
        <div className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>
          {total} players found | In squad: {squadPlayerIds.size}/15
        </div>

        {loading ? (
          <div className="loading">Loading players...</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Pos</th>
                  <th onClick={() => toggleSort('name')} style={{ cursor: 'pointer' }}>
                    Name{sortIndicator('name')}
                  </th>
                  <th onClick={() => toggleSort('team')} style={{ cursor: 'pointer' }}>
                    Team{sortIndicator('team')}
                  </th>
                  <th onClick={() => toggleSort('price')} style={{ cursor: 'pointer' }}>
                    Price{sortIndicator('price')}
                  </th>
                  <th onClick={() => toggleSort('goals')} style={{ cursor: 'pointer' }}>
                    G{sortIndicator('goals')}
                  </th>
                  <th onClick={() => toggleSort('assists')} style={{ cursor: 'pointer' }}>
                    A{sortIndicator('assists')}
                  </th>
                  <th onClick={() => toggleSort('minutes_played')} style={{ cursor: 'pointer' }}>
                    Min{sortIndicator('minutes_played')}
                  </th>
                  <th onClick={() => toggleSort('clean_sheets')} style={{ cursor: 'pointer' }}>
                    CS{sortIndicator('clean_sheets')}
                  </th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {players.map(p => (
                  <tr key={p.id}>
                    <td><span className={`pos-badge ${p.position}`}>{p.position}</span></td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td className="text-muted">{p.team}</td>
                    <td className="price-tag">${p.price}M</td>
                    <td>{p.goals}</td>
                    <td>{p.assists}</td>
                    <td>{p.minutes_played}</td>
                    <td>{p.clean_sheets || 0}</td>
                    <td>
                      {squadPlayerIds.has(p.id) ? (
                        <button className="btn btn-danger btn-sm" onClick={() => handleRemove(p.id)}>
                          Remove
                        </button>
                      ) : (
                        <button className="btn btn-success btn-sm" onClick={() => handleAdd(p.id)}>
                          Add
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Players;
