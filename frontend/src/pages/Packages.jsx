import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getPackages, createPackage, updatePackage, deletePackage } from '../api/api';

const EMPTY = { paket_adi: '', sure_ay: '', paket_fiyati: '' };

function formatTL(val) {
  return Number(val).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
}

export default function Packages() {
  const [packages, setPackages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);

  const load = () => {
    setLoading(true);
    getPackages()
      .then(r => setPackages(r.data))
      .catch(() => toast.error('Paketler yüklenirken hata oluştu.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit   = p => {
    setEditing(p.paket_id);
    setForm({ 
      paket_adi: p.paket_adi, 
      sure_ay: p.sure_ay, 
      paket_fiyati: p.paket_fiyati 
    });
    setModal(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    const payload = { 
      paket_adi: form.paket_adi, 
      sure_ay: parseInt(form.sure_ay), 
      paket_fiyati: parseFloat(form.paket_fiyati) 
    };
    try {
      if (editing) {
        await updatePackage(editing, payload);
        toast.success('Paket başarıyla güncellendi.');
      } else {
        await createPackage(payload);
        toast.success('Paket başarıyla eklendi.');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Bu paketi silmek istediğinizden emin misiniz?')) return;
    try {
      await deletePackage(id);
      toast.success('Paket silindi.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Silme işlemi başarısız oldu.');
    }
  };

  const tierColor = (months) => {
    if (months <= 1)  return 'badge-orange';
    if (months <= 3)  return 'badge-blue';
    if (months <= 6)  return 'badge-gold';
    return 'badge-green';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">🏷️ Üyelik Paketleri</h2>
          <p className="page-subtitle">Paketleri ve fiyatları yönetin — Fiyatlara KDV dahildir</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>＋ Yeni Paket Ekle</button>
      </div>

      {/* Package Cards */}
      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20, marginBottom: 24 }}>
          {packages.map(p => (
            <div key={p.paket_id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: p.sure_ay >= 12 ? 'linear-gradient(90deg,#d4af37,#22c55e)' :
                            p.sure_ay >= 6  ? 'linear-gradient(90deg,#d4af37,#f97316)' :
                            p.sure_ay >= 3  ? 'linear-gradient(90deg,#3b82f6,#d4af37)' :
                                              'linear-gradient(90deg,#f97316,#3b82f6)'
              }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <span className={`badge ${tierColor(p.sure_ay)}`}>
                  {p.sure_ay <= 1 ? '🥉 Bronze' : p.sure_ay <= 3 ? '🥈 Silver' : p.sure_ay <= 6 ? '🥇 Gold' : '💎 Platinum'}
                </span>
                <div className="flex gap-8">
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>✏️</button>
                  <button className="btn btn-danger btn-sm"    onClick={() => handleDelete(p.paket_id)}>🗑️</button>
                </div>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{p.paket_adi}</h3>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--gold)', marginBottom: 4 }}>
                {formatTL(p.paket_fiyati)}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                ⏱ {p.sure_ay} Ay · KDV Dahil
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                Paket Kodu: #{p.paket_id}
              </div>
            </div>
          ))}
        </div>
      )}

      {packages.length === 0 && !loading && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">🏷️</div>
            <p>Sistemde henüz üyelik paketi bulunmamaktadır.</p>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editing ? '✏️ Paketi Düzenle' : '➕ Yeni Paket Ekle'}</h3>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="form-group">
                  <label className="form-label">Paket Adı *</label>
                  <input className="form-control" required value={form.paket_adi}
                    onChange={e => setForm(f => ({ ...f, paket_adi: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Süre (Ay) *</label>
                  <input className="form-control" type="number" min={1} required value={form.sure_ay}
                    onChange={e => setForm(f => ({ ...f, sure_ay: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Paket Fiyatı (TL) — KDV Dahil *</label>
                  <input className="form-control" type="number" min={1} step="0.01" required value={form.paket_fiyati}
                    onChange={e => setForm(f => ({ ...f, paket_fiyati: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>İptal</button>
                <button type="submit"  className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ Kaydediliyor...' : editing ? '💾 Güncelle' : '＋ Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
