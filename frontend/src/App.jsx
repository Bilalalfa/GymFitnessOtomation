import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { 
  Dumbbell, 
  LayoutDashboard, 
  Users, 
  Tag, 
  Target, 
  CreditCard, 
  DoorOpen, 
  ShieldCheck 
} from 'lucide-react';
import Dashboard   from './pages/Dashboard';
import Members     from './pages/Members';
import Packages    from './pages/Packages';
import Memberships from './pages/Memberships';
import Payments    from './pages/Payments';
import Attendance  from './pages/Attendance';

const NAV = [
  { to: '/',            icon: <LayoutDashboard size={18} />, label: 'Kontrol Paneli' },
  { to: '/members',     icon: <Users size={18} />,           label: 'Üyeler'         },
  { to: '/packages',    icon: <Tag size={18} />,             label: 'Paketler'       },
  { to: '/memberships', icon: <Target size={18} />,          label: 'Üyelikler'      },
  { to: '/payments',    icon: <CreditCard size={18} />,      label: 'Ödemeler'       },
  { to: '/attendance',  icon: <DoorOpen size={18} />,        label: 'Üye Katılım'    },
];

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        {/* ── Sidebar ─────────────────────────────────────── */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="brand-icon">
              <Dumbbell size={22} color="#0a0a0f" style={{ transform: 'rotate(-45deg)' }} />
            </div>
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
              <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
              {label}
            </NavLink>
          ))}

          <div style={{ marginTop: 'auto', padding: '16px 12px 0', borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={14} className="text-gold" />
                <strong>Stored Procedure</strong>
              </span>
              Tüm CRUD işlemleri veritabanı prosedürleri ile güvence altındadır.
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
