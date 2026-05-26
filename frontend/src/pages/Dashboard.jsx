import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { 
  Dumbbell, 
  Users, 
  Target, 
  DoorOpen, 
  Coins, 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  Landmark 
} from 'lucide-react';
import { getDashboard, getPayments, getMemberships } from '../api/api';

const COLORS = ['#22c55e', '#f97316', '#3b82f6']; // green=Aktif, orange=Pasif, blue=Beklemede

function StatCard({ icon, title, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `${color}20`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div className="stat-info">
        <h3 style={{ color }}>{value}</h3>
        <p>{title}</p>
        {sub && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</p>}
      </div>
    </div>
  );
}

function formatTL(val) {
  if (!val) return '0,00 ₺';
  return Number(val).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
}

export default function Dashboard() {
  const [stats, setStats]         = useState(null);
  const [payments, setPayments]   = useState([]);
  const [memberships, setMs]      = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([getDashboard(), getPayments(), getMemberships()])
      .then(([d, p, m]) => {
        setStats(d.data);
        setPayments(p.data);
        setMs(m.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-spinner"><div className="spinner" /></div>
  );

  // Build monthly revenue chart data from payments
  const monthlyMap = {};
  payments.forEach(p => {
    const m = p.odeme_tarihi ? p.odeme_tarihi.substring(0, 7) : '';
    if (m) monthlyMap[m] = (monthlyMap[m] || 0) + Number(p.odeme_tutari);
  });
  const revenueData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, total]) => ({ month, total }));

  // Membership status pie
  const statusCount = { Aktif: 0, Pasif: 0, Beklemede: 0 };
  memberships.forEach(m => { 
    if (statusCount[m.durum] !== undefined) statusCount[m.durum]++; 
  });
  const pieData = Object.entries(statusCount).map(([name, value]) => ({ name, value }));

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const getMethodLabel = (t) => {
    if (t === 'Nakit' || t === 'Tunai') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <DollarSign size={14} /> Nakit
        </span>
      );
    }
    if (t === 'Kredi Kartı' || t === 'Kartu Kredit') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <CreditCard size={14} /> Kredi Kartı
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <Landmark size={14} /> Banka Havalesi
      </span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--gold-glow)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Dumbbell size={28} className="text-gold" style={{ transform: 'rotate(-45deg)' }} />
          </div>
          <div>
            <h2 className="page-title">Kontrol Paneli</h2>
            <p className="page-subtitle">Olympus Fitness Center — Gerçek zamanlı veri analizi</p>
          </div>
        </div>
        <span className="badge badge-gold">
          {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon={<Users size={24} />} title="Toplam Üye"     value={stats?.ToplamUye    ?? 0} color="#d4af37" sub="Kayıtlı" />
        <StatCard icon={<Target size={24} />} title="Aktif Üyelik" value={stats?.AktifUyelik  ?? 0} color="#22c55e" sub="Bugün İtibariyle" />
        <StatCard icon={<DoorOpen size={24} />} title="Bugünkü Girişler" value={stats?.BugunGiris   ?? 0} color="#3b82f6" sub="Ziyaret Sayısı" />
        <StatCard icon={<Coins size={24} />} title="Bu Ayki Gelir" value={formatTL(stats?.BuAyGelir)} color="#f97316" sub="KDV Dahil" />
        <StatCard icon={<TrendingUp size={24} />} title="Toplam Ciro"  value={formatTL(stats?.ToplamGelir)} color="#d4af37" sub="Tüm Zamanlar" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Revenue Area Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Aylık Gelir Analizi</h3>
          </div>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#d4af37" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#d4af37" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={v => [formatTL(v), 'Gelir']} />
                <Area type="monotone" dataKey="total" stroke="#d4af37" strokeWidth={2} fill="url(#goldGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>Henüz ödeme/tahsilat verisi bulunmamaktadır.</p></div>}
        </div>

        {/* Membership Pie */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Üyelik Durum Grafiği</h3>
          </div>
          {memberships.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name}: ${(percent*100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>Üyelik dağılım grafiği için yeterli veri bulunmamaktadır.</p></div>}
        </div>
      </div>

      {/* Recent Payments */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Son Ödeme Kayıtları</h3>
          <span className="badge badge-gold">Son 8 İşlem</span>
        </div>
        {payments.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Ödeme ID</th>
                  <th>Üye</th>
                  <th>Ödeme Türü</th>
                  <th>Tutar</th>
                  <th>Ödeme Tarihi</th>
                </tr>
              </thead>
              <tbody>
                {payments.slice(0, 8).map(p => (
                  <tr key={p.odeme_id}>
                    <td className="td-muted">#{p.odeme_id}</td>
                    <td><strong>{p.uye_ad_soyad}</strong></td>
                    <td>
                      <span className={`badge ${p.odeme_turu === 'Nakit' || p.odeme_turu === 'Tunai' ? 'badge-green' : p.odeme_turu === 'Kredi Kartı' || p.odeme_turu === 'Kartu Kredit' ? 'badge-blue' : 'badge-orange'}`}>
                        {getMethodLabel(p.odeme_turu)}
                      </span>
                    </td>
                    <td className="text-gold fw-700">{formatTL(p.odeme_tutari)}</td>
                    <td className="td-muted">{formatDate(p.odeme_tarihi)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="empty-state"><div className="empty-icon"><CreditCard size={48} style={{ opacity: 0.5 }} /></div><p>Kayıtlı ödeme bulunmamaktadır.</p></div>}
      </div>
    </div>
  );
}
