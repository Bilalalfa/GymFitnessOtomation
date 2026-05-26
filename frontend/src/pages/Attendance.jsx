import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { 
  DoorOpen, 
  LogIn, 
  LogOut, 
  Clock, 
  Search, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  X 
} from 'lucide-react';
import { getAttendance, checkIn, checkOut, getMembers } from '../api/api';

export default function Attendance() {
  const [logs,    setLogs]    = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selMember, setSelMember] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [search,   setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

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
      setSearchQuery('');
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

  const filteredSuggestions = members.filter(m =>
    `${m.uye_id} ${m.adi} ${m.soyadi} ${m.tckn} ${m.pasaport}`.toLowerCase().includes(searchQuery.toLowerCase())
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--gold-glow)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DoorOpen size={28} className="text-gold" />
          </div>
          <div>
            <h2 className="page-title">Üye Katılım Kayıtları</h2>
            <p className="page-subtitle">Üyelerin salona giriş-çıkış kayıtları (Süresi dolan üyeler otomatik engellenir)</p>
          </div>
        </div>
        <div className="flex gap-8">
          <span className="badge badge-blue">
            <Clock size={12} style={{ marginRight: 4 }} /> Bugün: {todayLogs.length} Giriş
          </span>
          <span className="badge badge-orange">
            <AlertCircle size={12} style={{ marginRight: 4 }} /> İçeride: {logs.filter(l => !l.cikis_zamani).length} Üye
          </span>
        </div>
      </div>

      {/* Check-in Panel */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 className="card-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LogIn size={20} className="text-gold" />
          Yeni Üye Girişi Yap
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          ⚡ Veritabanı tetikleyicisi (Trigger), üyeliği bulunmayan ya da süresi dolmuş üyelerin giriş yapmasını otomatik olarak engeller.
        </p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 220, position: 'relative' }}>
            <label className="form-label">Üye Seçin</label>
            <div className="autocomplete-container">
              <input
                className="form-control"
                placeholder="Üye adı, TCKN, Pasaport veya Üye ID ile arayın..."
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setSelMember('');
                  setShowSuggestions(true);
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="suggestion-clear"
                  onClick={() => {
                    setSearchQuery('');
                    setSelMember('');
                  }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={16} />
                </button>
              )}
              {showSuggestions && searchQuery && (
                <div className="suggestions-list">
                  {filteredSuggestions.length === 0 ? (
                    <div style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: 13 }}>
                      Eşleşen üye bulunamadı.
                    </div>
                  ) : (
                    filteredSuggestions.slice(0, 10).map(m => (
                      <div
                        key={m.uye_id}
                        className="suggestion-item"
                        onMouseDown={() => {
                          setSelMember(m.uye_id);
                          setSearchQuery(`#${m.uye_id} — ${m.adi} ${m.soyadi}`);
                          setShowSuggestions(false);
                        }}
                      >
                        <div>
                          <strong>{m.adi} {m.soyadi}</strong>
                          <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 8 }}>
                            (ID: #{m.uye_id} · {m.tckn || 'Pasaport: ' + m.pasaport})
                          </span>
                        </div>
                        {m.aktif_mi ? (
                          <span className="badge badge-green" style={{ fontSize: 10, padding: '2px 8px' }}>
                            <CheckCircle2 size={10} style={{ marginRight: 4 }} /> Aktif
                          </span>
                        ) : (
                          <span className="badge badge-red" style={{ fontSize: 10, padding: '2px 8px' }}>
                            <XCircle size={10} style={{ marginRight: 4 }} /> Aktif Değil
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ height: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={handleCheckIn}
            disabled={checkingIn || !selMember}
          >
            {checkingIn ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Giriş...
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <LogIn size={16} /> Giriş Yap
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card">
        <div className="card-header">
          <div className="search-bar">
            <Search size={18} className="text-muted" />
            <input placeholder="Üye adı veya TCKN ile ara..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <span className="badge badge-gold">{filtered.length} giriş kaydı</span>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <Loader2 size={36} className="text-gold" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <DoorOpen size={48} style={{ opacity: 0.5 }} />
            </div>
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
                      {l.sure_dakika != null ? (
                        <span className="badge badge-blue">
                          <Clock size={11} style={{ marginRight: 4 }} /> {l.sure_dakika} dk
                        </span>
                      ) : (
                        <span className="td-muted">—</span>
                      )}
                    </td>
                    <td>
                      {l.cikis_zamani ? (
                        <span className="badge badge-green">
                          <CheckCircle2 size={12} style={{ marginRight: 4 }} /> Çıkış Yapıldı
                        </span>
                      ) : (
                        <span className="badge badge-orange">
                          <Clock size={12} style={{ marginRight: 4 }} /> İçeride
                        </span>
                      )}
                    </td>
                    <td>
                      {!l.cikis_zamani && (
                        <button className="btn btn-success btn-sm"
                          onClick={() => handleCheckOut(l.log_id)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <LogOut size={14} /> Çıkış Yap
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
