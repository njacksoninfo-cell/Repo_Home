import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Players from './pages/Players';
import MyTeam from './pages/MyTeam';
import Scoring from './pages/Scoring';

function App() {
  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <h1 className="logo">MLS Fantasy</h1>
          <nav className="nav">
            <NavLink to="/" end>Dashboard</NavLink>
            <NavLink to="/players">Players</NavLink>
            <NavLink to="/my-team">My Team</NavLink>
            <NavLink to="/scoring">Scoring</NavLink>
          </nav>
        </div>
      </header>
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/players" element={<Players />} />
          <Route path="/my-team" element={<MyTeam />} />
          <Route path="/scoring" element={<Scoring />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
