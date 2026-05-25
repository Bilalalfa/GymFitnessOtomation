import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Dashboard   from './pages/Dashboard';
import Members     from './pages/Members';
import Packages    from './pages/Packages';
import Memberships from './pages/Memberships';
import Payments    from './pages/Payments';
import Attendance  from './pages/Attendance';

const NAV = [
  { to: '/',            icon: '📊', label: 'Kontrol Paneli' },
  { to: '/members',     icon: '👥', label: 'Üyeler'         },
  { to: '/packages',    icon: '🏷️', label: 'Paketler'       },
  { to: '/memberships', icon: '🎯', label: 'Üyelikler'      },
  { to: '/payments',    icon: '💳', label: 'Ödemeler'       },
  { to: '/attendance',  icon: '🚪', label: 'Üye Katılım'    },
];

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        {/* ── Sidebar ─────────────────────────────────────── */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="brand-icon">🏋️</div>
            <div className="brand-text">
              <h1>Olympus</h1>
              <p>Fitness Center</p>
            </div>
          </div>

          <div className="nav-section-label">Ana Menü</div>

          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </NavLink>
          ))}

          <div style={{ marginTop: 'auto', padding: '16px 12px 0', borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              🔒 Tüm CRUD işlemleri<br/>Stored Procedure'ler ile<br/>güvence altına alınmıştır.
            </p>
          </div>
        </aside>

        {/* ── Main ─────────────────────────────────────────── */}
        <main className="main-content">
          <Routes>
            <Route path="/"            element={<Dashboard   />} />
            <Route path="/members"     element={<Members     />} />
            <Route path="/packages"    element={<Packages    />} />
            <Route path="/memberships" element={<Memberships />} />
            <Route path="/payments"    element={<Payments    />} />
            <Route path="/attendance"  element={<Attendance  />} />
          </Routes>
        </main>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a25',
            color: '#f0f0f0',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            fontFamily: 'Outfit, sans-serif',
            fontSize: 14,
          },
          success: { iconTheme: { primary: '#d4af37', secondary: '#0a0a0f' } },
        }}
      />
    </BrowserRouter>
  );
}
