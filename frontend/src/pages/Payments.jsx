import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getPayments, createPayment, deletePayment, getMembers } from '../api/api';

const PAYMENT_TYPES = ['Nakit', 'Kredi Kartı', 'Banka Havalesi'];
const EMPTY = { uye_id: '', odeme_tutari: '', odeme_turu: '', aciklama: '' };

function formatTL(val) {
  return Number(val).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
}

export default function Payments() {
  const [payments,    setPayments]    = useState([]);
  const [members,     setMembers]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [modal,       setModal]       = useState(false);
  const [form,        setForm]        = useState(EMPTY);
  const [saving,      setSaving]      = useState(false);
  const [search,      setSearch]      = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([getPayments(), getMembers()])
      .then(([p, m]) => { 
        setPayments(p.data); 
        setMembers(m.data); 
      })
      .catch(() => toast.error('Veriler yüklenirken hata oluştu.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await createPayment({
        uye_id: form.uye_id,
        odeme_tutari: parseFloat(form.odeme_tutari),
        odeme_turu: form.odeme_turu,
        aciklama: form.aciklama,
      });
      toast.success('Ödeme başarıyla kaydedildi.');
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Bu ödeme kaydını silmek istediğinizden emin misiniz?')) return;
    try {
      await deletePayment(id);
      toast.success('Ödeme kaydı silindi.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Silme işlemi başarısız oldu.');
    }
  };

  const filtered = payments.filter(p =>
    `${p.uye_ad_soyad} ${p.tckn} ${p.odeme_turu}`.toLowerCase().includes(search.toLowerCase())
  );

  const total = filtered.reduce((s, p) => s + Number(p.odeme_tutari), 0);

  const methodBadge = t =>
    t === 'Nakit' || t === 'Tunai'
      ? <span className="badge badge-green">💵 Nakit</span>    :
    t === 'Kredi Kartı' || t === 'Kartu Kredit'
      ? <span className="badge badge-blue">💳 Kredi Kartı</span> :
        <span className="badge badge-orange">🏦 Banka Havalesi</span>;

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('tr-TR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">💳 Ödemeler</h2>
          <p className="page-subtitle">Üye paket satışları ve ödeme tahsilat geçmişi</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setModal(true); }}>
          ＋ Ödeme Tahsil Et
        </button>
      </div>

      {/* Summary bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Toplam İşlem',   value: filtered.length,                    icon: '🧾', color: 'var(--blue)'   },
          { label: 'Toplam Gelir',  value: formatTL(total),                    icon: '💰', color: 'var(--gold)'   },
          { label: 'Ortalama Tutar', value: formatTL(filtered.length ? total / filtered.length : 0), icon: '📊', color: 'var(--green)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ display:'flex', alignItems:'center', gap:14 }}>
            <span style={{ fontSize: 28 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-bar">
            🔍
            <input placeholder="Üye adı veya ödeme türü ile ara..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💳</div>
            <p>Seçilen kriterlere uygun ödeme kaydı bulunamadı.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Ödeme ID</th><th>Üye</th><th>Ödeme Tutarı</th>
                  <th>Ödeme Türü</th><th>Ödeme Tarihi</th><th>Açıklama</th><th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.odeme_id}>
                    <td className="td-muted">#{p.odeme_id}</td>
                    <td>
                      <strong>{p.uye_ad_soyad}</strong>
                      <div className="td-muted" style={{fontSize:12}}>{p.tckn}</div>
                    </td>
                    <td><strong className="text-gold">{formatTL(p.odeme_tutari)}</strong></td>
                    <td>{methodBadge(p.odeme_turu)}</td>
                    <td className="td-muted">{formatDate(p.odeme_tarihi)}</td>
                    <td className="td-muted" style={{maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                      {p.aciklama || '—'}
                    </td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.odeme_id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">➕ Ödeme Tahsil Et</h3>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="form-group">
                  <label className="form-label">Üye Seçin *</label>
                  <select className="form-control" required value={form.uye_id} onChange={e => setForm(f => ({ ...f, uye_id: e.target.value }))}>
                    <option value="">-- Üye seçin --</option>
                    {members.map(m => (
                      <option key={m.uye_id} value={m.uye_id}>
                        #{m.uye_id} — {m.adi} {m.soyadi} ({m.tckn})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Ödeme Tutarı (TL) *</label>
                  <input className="form-control" type="number" step="0.01" min={1} required
                    value={form.odeme_tutari}
                    onChange={e => setForm(f => ({ ...f, odeme_tutari: e.target.value }))} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Ödeme Türü *</label>
                  <select className="form-control" required value={form.odeme_turu}
                    onChange={e => setForm(f => ({ ...f, odeme_turu: e.target.value }))}>
                    <option value="">-- Ödeme türü seçin --</option>
                    {PAYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Açıklama / Not</label>
                  <input className="form-control" placeholder="Not ekleyin (Opsiyonel)..."
                    value={form.aciklama}
                    onChange={e => setForm(f => ({ ...f, aciklama: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>İptal</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ Kaydediliyor...' : '💾 Ödemeyi Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
