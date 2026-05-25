import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getMemberships, createMembership, getMembers, getPackages } from '../api/api';

const EMPTY = { uye_id: '', paket_id: '', baslangic_tarihi: new Date().toISOString().slice(0, 10) };

function formatTL(val) {
  return Number(val).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
}

export default function Memberships() {
  const [list,     setList]    = useState([]);
  const [members,  setMembers] = useState([]);
  const [packages, setPkgs]    = useState([]);
  const [loading,  setLoading] = useState(true);
  const [modal,    setModal]   = useState(false);
  const [form,     setForm]    = useState(EMPTY);
  const [saving,   setSaving]  = useState(false);
  const [filter,   setFilter]  = useState('Tümü');

  const load = () => {
    setLoading(true);
    Promise.all([getMemberships(), getMembers(), getPackages()])
      .then(([ms, mem, pkg]) => { 
        setList(ms.data); 
        setMembers(mem.data); 
        setPkgs(pkg.data); 
      })
      .catch(() => toast.error('Veriler yüklenirken hata oluştu.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await createMembership({ 
        uye_id: form.uye_id, 
        paket_id: form.paket_id, 
        baslangic_tarihi: form.baslangic_tarihi 
      });
      toast.success('Üyelik başarıyla oluşturuldu!');
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = list.filter(m => filter === 'Tümü' || m.durum === filter);

  const statusBadge = s =>
    s === 'Aktif'     ? <span className="badge badge-green">✓ Aktif</span>   :
    s === 'Pasif'     ? <span className="badge badge-red">✗ Pasif</span>     :
                        <span className="badge badge-orange">⏳ Beklemede</span>;

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const getRemainingDays = (bitisTarihi) => {
    const remaining = Math.ceil((new Date(bitisTarihi) - new Date()) / 86400000);
    return Math.max(0, remaining);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">🎯 Üyelikler</h2>
          <p className="page-subtitle">Üyelerin satın aldığı aktif ve geçmiş paketler</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setModal(true); }}>
          ＋ Yeni Üyelik Ekle
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
            {['Tümü', 'Aktif', 'Pasif', 'Beklemede'].map(f => (
              <button
                key={f}
                className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <span className="badge badge-gold">{filtered.length} üyelik kaydı</span>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <p>Seçilen kriterlere uygun üyelik kaydı bulunamadı.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Üyelik ID</th><th>Üye</th><th>Paket Detayı</th>
                  <th>Başlangıç Tarihi</th><th>Bitiş Tarihi</th><th>Fiyat (KDV Dahil)</th><th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.uyelik_id}>
                    <td className="td-muted">#{m.uyelik_id}</td>
                    <td>
                      <strong>{m.uye_ad_soyad || `${m.adi} ${m.soyadi}`}</strong>
                      <div className="td-muted" style={{fontSize:12}}>{m.tckn}</div>
                    </td>
                    <td>
                      <span className="badge badge-gold">{m.paket_adi}</span>
                      <div className="td-muted" style={{fontSize:12}}>{m.sure_ay} Ay</div>
                    </td>
                    <td className="td-muted">{formatDate(m.baslangic_tarihi)}</td>
                    <td className="td-muted">
                      {formatDate(m.bitis_tarihi)}
                      {m.durum === 'Aktif' && (
                        <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 2 }}>
                          {getRemainingDays(m.bitis_tarihi)} gün kaldı
                        </div>
                      )}
                    </td>
                    <td className="text-gold fw-700">
                      {formatTL(m.paket_fiyati)}
                    </td>
                    <td>{statusBadge(m.durum)}</td>
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
              <h3 className="modal-title">➕ Yeni Üyelik Tanımla</h3>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
              ⚠️ Bir üyenin aynı zaman diliminde yalnızca <strong>1 aktif üyeliği</strong> olabilir.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="form-group">
                  <label className="form-label">Üye Seçin *</label>
                  <select className="form-control" required value={form.uye_id}
                    onChange={e => setForm(f => ({ ...f, uye_id: e.target.value }))}>
                    <option value="">-- Üye Seçin --</option>
                    {members.map(m => (
                      <option key={m.uye_id} value={m.uye_id}>
                        #{m.uye_id} — {m.adi} {m.soyadi} ({m.tckn})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Paket Seçin *</label>
                  <select className="form-control" required value={form.paket_id}
                    onChange={e => setForm(f => ({ ...f, paket_id: e.target.value }))}>
                    <option value="">-- Paket Seçin --</option>
                    {packages.map(p => (
                      <option key={p.paket_id} value={p.paket_id}>
                        {p.paket_adi} — {formatTL(p.paket_fiyati)} ({p.sure_ay} Ay)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Başlangıç Tarihi *</label>
                  <input type="date" className="form-control" required value={form.baslangic_tarihi}
                    onChange={e => setForm(f => ({ ...f, baslangic_tarihi: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>İptal</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ Kaydediliyor...' : '✅ Üyelik Tanımla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
