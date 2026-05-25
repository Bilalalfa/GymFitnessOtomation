import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getMembers, createMember, updateMember, deleteMember } from '../api/api';

const EMPTY = { adi: '', soyadi: '', tckn: '', pasaport: '', telefon: '', mail: '' };

export default function Members() {
  const [members, setMembers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search,  setSearch]    = useState('');
  const [modal,   setModal]     = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form,    setForm]      = useState(EMPTY);
  const [saving,  setSaving]    = useState(false);

  const load = () => {
    setLoading(true);
    getMembers()
      .then(r => setMembers(r.data))
      .catch(() => toast.error('Üye verileri yüklenirken hata oluştu.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit   = (m)  => {
    setEditing(m.uye_id);
    setForm({ 
      adi: m.adi, 
      soyadi: m.soyadi, 
      tckn: m.tckn, 
      pasaport: m.pasaport || '', 
      telefon: m.telefon, 
      mail: m.mail 
    });
    setModal(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateMember(editing, form);
        toast.success('Üye başarıyla güncellendi.');
      } else {
        await createMember(form);
        toast.success('Üye başarıyla eklendi.');
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
    if (!window.confirm('Bu üyeyi silmek istediğinizden emin misiniz?')) return;
    try {
      await deleteMember(id);
      toast.success('Üye silindi.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Silme işlemi başarısız oldu.');
    }
  };

  const filtered = members.filter(m =>
    `${m.adi} ${m.soyadi} ${m.tckn} ${m.mail}`.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">👥 Üyeler</h2>
          <p className="page-subtitle">Olympus Fitness Center üye veritabanı yönetimi</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          ＋ Yeni Üye Ekle
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-bar">
            🔍
            <input
              placeholder="İsim, TCKN veya e-posta ile ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span className="badge badge-gold">{filtered.length} kayıtlı üye</span>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <p>Aradığınız kriterlere uygun üye bulunamadı.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Ad Soyad</th><th>TCKN</th><th>Telefon</th>
                  <th>E-posta</th><th>Kayıt Tarihi</th><th>Üyelik Durumu</th><th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.uye_id}>
                    <td className="td-muted">#{m.uye_id}</td>
                    <td>
                      <strong>{m.adi} {m.soyadi}</strong>
                      {m.pasaport && <div className="td-muted" style={{fontSize:12}}>🛂 {m.pasaport}</div>}
                    </td>
                    <td className="td-muted">{m.tckn}</td>
                    <td>{m.telefon}</td>
                    <td className="td-muted">{m.mail}</td>
                    <td className="td-muted">{formatDate(m.kayit_tarihi)}</td>
                    <td>
                      {m.aktif_mi
                        ? <span className="badge badge-green">✓ Aktif <span style={{fontSize:11}}>({m.kalan_gun} Gün Kaldı)</span></span>
                        : <span className="badge badge-red">✗ Aktif Değil</span>
                      }
                    </td>
                    <td>
                      <div className="flex gap-8">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(m)}>✏️</button>
                        <button className="btn btn-danger btn-sm"    onClick={() => handleDelete(m.uye_id)}>🗑️</button>
                      </div>
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
              <h3 className="modal-title">{editing ? '✏️ Üyeyi Düzenle' : '➕ Yeni Üye Ekle'}</h3>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {[
                  { key: 'adi',      label: 'Adı',    required: true },
                  { key: 'soyadi',   label: 'Soyadı', required: true },
                  { key: 'tckn',    label: 'T.C. Kimlik No (11 hane)', required: true, pattern: '\\d{11}', maxLength: 11 },
                  { key: 'pasaport',label: 'Pasaport No (Opsiyonel)',    required: false },
                  { key: 'telefon', label: 'Telefon Numarası',        required: true },
                  { key: 'mail',    label: 'E-posta Adresi',          required: true, type: 'email' },
                ].map(({ key, label, required, ...rest }) => (
                  <div className="form-group" key={key}>
                    <label className="form-label">{label}{required && ' *'}</label>
                    <input
                      className="form-control"
                      required={required}
                      value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      {...rest}
                    />
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>İptal</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
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
