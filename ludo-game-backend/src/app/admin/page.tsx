'use client';

import { useState, useEffect, useCallback } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

const ADMIN_TOKEN = 'pzKing4@oxford-admin-token';

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('admin_token');
    if (saved === ADMIN_TOKEN) setIsLoggedIn(true);
  }, []);

  const handleLogin = () => {
    if (tokenInput === ADMIN_TOKEN) { localStorage.setItem('admin_token', ADMIN_TOKEN); setIsLoggedIn(true); }
    else { alert('Invalid token'); }
  };

  const handleLogout = () => { localStorage.removeItem('admin_token'); setIsLoggedIn(false); };

  const fetchStats = useCallback(async () => {
    try { const r = await fetch('/api/admin/stats?token=' + ADMIN_TOKEN); if (r.ok) setStats(await r.json()); } catch (e) {}
  }, []);
  const fetchGames = useCallback(async () => {
    try { const r = await fetch('/api/admin/games?token=' + ADMIN_TOKEN); if (r.ok) setGames((await r.json()).games || []); } catch (e) {}
  }, []);
  const fetchUsers = useCallback(async () => {
    try { const r = await fetch('/api/admin/users?token=' + ADMIN_TOKEN); if (r.ok) setUsers((await r.json()).users || []); } catch (e) {}
  }, []);
  const fetchTransactions = useCallback(async () => {
    try { const r = await fetch('/api/admin/transactions?token=' + ADMIN_TOKEN); if (r.ok) setTransactions((await r.json()).transactions || []); } catch (e) {}
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    const ws = new WebSocket('ws://localhost:3000');
    ws.onopen = () => { setWsConnected(true); ws.send(JSON.stringify({ event: 'admin-subscribe' })); };
    ws.onmessage = (e) => { if (JSON.parse(e.data).event === 'admin-stats') fetchStats(); };
    ws.onclose = () => setWsConnected(false);
    return () => ws.close();
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(true);
    Promise.all([fetchStats(), fetchGames(), fetchUsers(), fetchTransactions()]).then(() => setLoading(false));
    const iv = setInterval(fetchStats, 10000);
    return () => clearInterval(iv);
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#1a1a2e' }}>
      <div style={{ backgroundColor: '#16213e', padding: 40, borderRadius: 16, border: '2px solid #FFD700', textAlign: 'center', width: 350 }}>
        <h1 style={{ color: '#FFD700' }}>🎲 Admin</h1>
        <input type="password" value={tokenInput} onChange={e => setTokenInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="Token" style={{ width: '100%', padding: 14, borderRadius: 8, border: 'none', backgroundColor: '#0f3460', color: '#fff', fontSize: 16, marginBottom: 15 }} />
        <button onClick={handleLogin} style={{ width: '100%', padding: 14, borderRadius: 8, border: 'none', backgroundColor: '#e94560', color: '#fff', fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>Login</button>
      </div>
    </div>;
  }

  if (loading) {
    return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#1a1a2e', color: '#fff' }}>
      <div style={{ width: 50, height: 50, border: '4px solid #0f3460', borderTop: '4px solid #e94560', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p>Loading...</p>
    </div>;
  }

  const cc = { primary: '#e94560', secondary: '#0f3460', success: '#00ff88', warning: '#FFD700', info: '#533483' };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', color: '#fff', fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 30px', backgroundColor: '#16213e' }}>
        <div><h1 style={{ color: '#FFD700' }}>🎲 Admin</h1></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <span style={{ padding: '8px 16px', borderRadius: 20, fontWeight: 'bold', backgroundColor: wsConnected ? cc.success + '40' : cc.primary + '40', color: wsConnected ? cc.success : cc.primary }}>{wsConnected ? '🟢 Live' : '🔴 Offline'}</span>
          <button onClick={handleLogout} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: cc.primary, color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, padding: '15px 30px', backgroundColor: '#16213e' }}>
        {['overview', 'games', 'users', 'transactions'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 'bold', backgroundColor: activeTab === tab ? cc.primary : 'transparent', color: activeTab === tab ? '#fff' : '#a0a0a0' }}>
            {tab === 'overview' ? '📊 Overview' : tab === 'games' ? '🎮 Games' : tab === 'users' ? '👥 Users' : '💰 Transactions'}
          </button>
        ))}
      </div>
      <div style={{ padding: 30 }}>
        {activeTab === 'overview' && <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[{ l: 'Users', v: stats?.overview?.totalUsers }, { l: 'Games', v: stats?.overview?.totalGames }, { l: 'Revenue', v: (stats?.overview?.totalRevenue || 0).toLocaleString() + ' 🪙' }, { l: 'Active', v: stats?.overview?.activeGames }].map((s, i) => (
              <div key={i} style={{ backgroundColor: '#0f3460', padding: 15, borderRadius: 12, borderLeft: `4px solid ${cc.primary}` }}><div style={{ color: '#a0a0a0', fontSize: 11 }}>{s.l}</div><div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 5 }}>{s.v}</div></div>
            ))}
          </div>
          <div style={{ backgroundColor: '#0f3460', padding: 15, borderRadius: 12, marginBottom: 15 }}>
            <h3 style={{ color: '#FFD700', margin: '0 0 10px' }}>Recent Games</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ backgroundColor: '#16213e' }}>{['ID', 'Player A', 'Player B', 'Bet', 'Winner', 'Status'].map(h => <th key={h} style={{ padding: 8, textAlign: 'left', color: '#FFD700' }}>{h}</th>)}</tr></thead>
              <tbody>{(stats?.recentActivity || []).slice(0, 10).map((g: any) => (
                <tr key={g.id} style={{ borderBottom: '1px solid #16213e' }}>
                  <td style={{ padding: 8 }}>#{g.id}</td><td style={{ padding: 8 }}>{g.player_a_name}</td><td style={{ padding: 8 }}>{g.player_b_name}</td><td style={{ padding: 8 }}>{g.bet_amount} 🪙</td><td style={{ padding: 8 }}>{g.winner}</td><td style={{ padding: 8 }}><span style={{ padding: '3px 8px', borderRadius: 8, fontSize: 10, fontWeight: 'bold', backgroundColor: g.status === 'completed' ? cc.success + '40' : cc.warning + '40', color: g.status === 'completed' ? cc.success : cc.warning }}>{g.status}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>}
        {activeTab === 'games' && <div style={{ backgroundColor: '#0f3460', padding: 15, borderRadius: 12 }}><h3 style={{ color: '#FFD700' }}>All Games</h3><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}><thead><tr style={{ backgroundColor: '#16213e' }}>{['ID', 'Club', 'A', 'B', 'Bet', 'Winner', 'Status'].map(h => <th key={h} style={{ padding: 8, textAlign: 'left', color: '#FFD700' }}>{h}</th>)}</tr></thead><tbody>{games.map(g => (<tr key={g.id} style={{ borderBottom: '1px solid #16213e' }}><td style={{ padding: 8 }}>#{g.id}</td><td style={{ padding: 8 }}>{g.club_name}</td><td style={{ padding: 8 }}>{g.player_a_name}</td><td style={{ padding: 8 }}>{g.player_b_name}</td><td style={{ padding: 8 }}>{g.bet_amount} 🪙</td><td style={{ padding: 8 }}>{g.winner_name}</td><td style={{ padding: 8 }}><span style={{ padding: '3px 8px', borderRadius: 8, fontSize: 10, fontWeight: 'bold', backgroundColor: g.status === 'completed' ? cc.success + '40' : cc.warning + '40', color: g.status === 'completed' ? cc.success : cc.warning }}>{g.status}</span></td></tr>))}</tbody></table></div>}
        {activeTab === 'users' && <div style={{ backgroundColor: '#0f3460', padding: 15, borderRadius: 12 }}><h3 style={{ color: '#FFD700' }}>Users</h3><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}><thead><tr style={{ backgroundColor: '#16213e' }}>{['ID', 'Username', 'Balance', 'Games', 'Wins'].map(h => <th key={h} style={{ padding: 8, textAlign: 'left', color: '#FFD700' }}>{h}</th>)}</tr></thead><tbody>{users.map(u => (<tr key={u.id} style={{ borderBottom: '1px solid #16213e' }}><td style={{ padding: 8 }}>#{u.id}</td><td style={{ padding: 8 }}>{u.username}</td><td style={{ padding: 8 }}>{u.balance} 🪙</td><td style={{ padding: 8 }}>{u.total_games}</td><td style={{ padding: 8 }}>{u.wins}</td></tr>))}</tbody></table></div>}
        {activeTab === 'transactions' && <div style={{ backgroundColor: '#0f3460', padding: 15, borderRadius: 12 }}><h3 style={{ color: '#FFD700' }}>Transactions</h3><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}><thead><tr style={{ backgroundColor: '#16213e' }}>{['ID', 'User', 'Amount', 'Type', 'Description'].map(h => <th key={h} style={{ padding: 8, textAlign: 'left', color: '#FFD700' }}>{h}</th>)}</tr></thead><tbody>{transactions.map(t => (<tr key={t.id} style={{ borderBottom: '1px solid #16213e' }}><td style={{ padding: 8 }}>#{t.id}</td><td style={{ padding: 8 }}>{t.username}</td><td style={{ padding: 8, color: t.amount > 0 ? cc.success : cc.primary }}>{t.amount} 🪙</td><td style={{ padding: 8 }}>{t.type}</td><td style={{ padding: 8 }}>{t.description}</td></tr>))}</tbody></table></div>}
      </div>
    </div>
  );
}
