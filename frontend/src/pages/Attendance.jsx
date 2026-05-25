import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getAttendance, checkIn, checkOut, getMembers } from '../api/api';

export default function Attendance() {
  const [logs,    setLogs]    = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selMember, setSelMember] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [search,   setSearch] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([getAttendance(), getMembers()])
      .then(([a, m]) => { 
        setLogs(a.data); 
        setMembers(m.data); 
      })
      .catch(() => toast.error('Giriş-çıkış verileri yüklenirken hata oluştu.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleCheckIn = async () => {
    if (!selMember) { toast.error('Lütfen önce bir üye seçin.'); return; }
    setCheckingIn(true);
    try {
      const res = await checkIn(selMember);
      toast.success(`Üye girişi onaylandı! Kayıt No: #${res.data.log_id}`);
      setSelMember('');
      load();
    } catch (err) {
      const msg = err.response?.data?.detail || '';
      const clean = msg.includes('Hata:') ? msg.split('Hata:').pop().trim() : msg;
      toast.error(`Giriş Reddedildi: ${clean}`, { duration: 5000 });
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async (logId) => {
    try {
      await checkOut(logId);
      toast.success('Çıkış işlemi kaydedildi.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Çıkış işlemi başarısız oldu.');
    }
  };

  const todayLogs = logs.filter(l => {
    const d = l.giris_zamani ? l.giris_zamani.slice(0, 10) : '';
    return d === new Date().toISOString().slice(0, 10);
  });

  const filtered = logs.filter(l =>
    `${l.uye_ad_soyad} ${l.tckn}`.toLowerCase().includes(search.toLowerCase())
  );

  const fmtDt = dt => {
    if (!dt) return '—';
    try {
      const d = new Date(dt);
      return d.toLocaleString('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return dt;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">🚪 Üye Katılım Kayıtları</h2>
          <p className="page-subtitle">Üyelerin salona giriş-çıkış kayıtları (Süresi dolan üyeler otomatik engellenir)</p>
        </div>
        <div className="flex gap-8">
          <span className="badge badge-blue">📅 Bugün: {todayLogs.length} Giriş</span>
          <span className="badge badge-orange">🔴 İçeride: {logs.filter(l => !l.cikis_zamani).length} Üye</span>
        </div>
      </div>

      {/* Check-in Panel */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 className="card-title" style={{ marginBottom: 16 }}>🏃 Yeni Üye Girişi Yap</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          ⚡ Veritabanı tetikleyicisi (Trigger), üyeliği bulunmayan ya da süresi dolmuş üyelerin giriş yapmasını otomatik olarak engeller.
        </p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 220 }}>
            <label className="form-label">Üye Seçin</label>
            <select className="form-control" value={selMember}
              onChange={e => setSelMember(e.target.value)}>
              <option value="">-- Üye seçin --</option>
              {members.map(m => (
                <option key={m.uye_id} value={m.uye_id}>
                  #{m.uye_id} — {m.adi} {m.soyadi} ({m.aktif_mi ? '✓ Aktif' : '✗ Aktif Değil'})
                </option>
              ))}
            </select>
          </div>
          <button
            className="btn btn-primary"
            style={{ height: 44 }}
            onClick={handleCheckIn}
            disabled={checkingIn || !selMember}
          >
            {checkingIn ? '⏳...' : '🚪 Giriş Yap'}
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card">
        <div className="card-header">
          <div className="search-bar">
            🔍
            <input placeholder="Üye adı veya TCKN ile ara..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <span className="badge badge-gold">{filtered.length} giriş kaydı</span>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🚪</div>
            <p>Salonda henüz herhangi bir giriş kaydı bulunmamaktadır.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Kayıt ID</th><th>Üye</th><th>Giriş Zamanı</th>
                  <th>Çıkış Zamanı</th><th>Süre</th><th>Durum</th><th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.log_id}>
                    <td className="td-muted">#{l.log_id}</td>
                    <td>
                      <strong>{l.uye_ad_soyad}</strong>
                      <div className="td-muted" style={{fontSize:12}}>{l.tckn}</div>
                    </td>
                    <td className="td-muted">{fmtDt(l.giris_zamani)}</td>
                    <td className="td-muted">{fmtDt(l.cikis_zamani)}</td>
                    <td>
                      {l.sure_dakika != null
                        ? <span className="badge badge-blue">{l.sure_dakika} dk</span>
                        : <span className="td-muted">—</span>
                      }
                    </td>
                    <td>
                      {l.cikis_zamani
                        ? <span className="badge badge-green">✓ Çıkış Yapıldı</span>
                        : <span className="badge badge-orange">🟡 İçeride</span>
                      }
                    </td>
                    <td>
                      {!l.cikis_zamani && (
                        <button className="btn btn-success btn-sm"
                          onClick={() => handleCheckOut(l.log_id)}>
                          🚶 Çıkış Yap
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
