import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { 
  getMembers, createMember, updateMember, deleteMember,
  getMemberMemberships, getMemberBalance, getMemberAttendance, getPayments 
} from '../api/api';

function formatTL(val) {
  if (val === undefined || val === null) return '0,00 ₺';
  return Number(val).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
}

const EMPTY = { adi: '', soyadi: '', tckn: '', pasaport: '', telefon: '', mail: '' };

export default function Members() {
  const [members, setMembers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search,  setSearch]    = useState('');
  const [modal,   setModal]     = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form,    setForm]      = useState(EMPTY);
  const [saving,  setSaving]    = useState(false);

  // Detail Modal States
  const [detailMember, setDetailMember] = useState(null);
  const [detailData, setDetailData] = useState({ memberships: [], balance: 0, attendance: [], payments: [] });
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profil');

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

  const openDetail = async (m) => {
    setDetailMember(m);
    setDetailLoading(true);
    setActiveTab('profil');
    try {
      const [msRes, balRes, attRes, payRes] = await Promise.all([
        getMemberMemberships(m.uye_id),
        getMemberBalance(m.uye_id),
        getMemberAttendance(m.uye_id),
        getPayments()
      ]);
      
      const memberPayments = (payRes.data || []).filter(p => p.uye_id === m.uye_id);
      
      setDetailData({
        memberships: msRes.data || [],
        balance: balRes.data?.balance ?? 0.0,
        attendance: attRes.data || [],
        payments: memberPayments
      });
    } catch (err) {
      toast.error('Üye detay bilgileri yüklenemedi.');
      console.error(err);
    } finally {
      setDetailLoading(false);
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
                        <button className="btn btn-secondary btn-sm" title="Detaylı Profil" onClick={() => openDetail(m)}>🔍</button>
                        <button className="btn btn-secondary btn-sm" title="Düzenle" onClick={() => openEdit(m)}>✏️</button>
                        <button className="btn btn-danger btn-sm"    title="Sil" onClick={() => handleDelete(m.uye_id)}>🗑️</button>
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

      {/* Member Detail Modal */}
      {detailMember && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDetailMember(null)}>
          <div className="modal" style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h3 className="modal-title">🔍 Üye Detay Portalı</h3>
              <button className="modal-close" onClick={() => setDetailMember(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--border)', marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
              {[
                { id: 'profil', label: '👤 Profil' },
                { id: 'paket',  label: '🎯 Paket Geçmişi' },
                { id: 'odeme',  label: '💳 Ödemeler & Bakiye' },
                { id: 'katilim',label: '🚪 Katılım Günlüğü' },
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === t.id ? '2px solid var(--gold)' : '2px solid transparent',
                    color: activeTab === t.id ? 'var(--gold)' : 'var(--text-secondary)',
                    padding: '8px 12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 14,
                    transition: 'var(--transition)',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {detailLoading ? (
              <div className="loading-spinner"><div className="spinner" /></div>
            ) : (
              <div>
                {/* Profile Tab */}
                {activeTab === 'profil' && (
                  <div>
                    <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                      <div style={{
                        width: 60, height: 60, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 28, boxShadow: 'var(--shadow-gold)', flexShrink: 0
                      }}>
                        🏋️
                      </div>
                      <div>
                        <h2 style={{ fontSize: 20, fontWeight: 800 }}>{detailMember.adi} {detailMember.soyadi}</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>ID: #{detailMember.uye_id} · TCKN: {detailMember.tckn}</p>
                      </div>
                    </div>

                    <div className="form-grid" style={{ gap: 20 }}>
                      <div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: 4 }}>Telefon Numarası</span>
                        <strong style={{ fontSize: 15 }}>{detailMember.telefon}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: 4 }}>E-posta Adresi</span>
                        <strong style={{ fontSize: 15 }}>{detailMember.mail}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: 4 }}>Kayıt Tarihi</span>
                        <strong style={{ fontSize: 15 }}>{formatDate(detailMember.kayit_tarihi)}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: 4 }}>Pasaport No</span>
                        <strong style={{ fontSize: 15 }}>{detailMember.pasaport || '—'}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: 4 }}>Üyelik Durumu</span>
                        <div>
                          {detailMember.aktif_mi ? (
                            <span className="badge badge-green" style={{ marginTop: 2 }}>✓ Aktif ({detailMember.kalan_gun} Gün Kaldı)</span>
                          ) : (
                            <span className="badge badge-red" style={{ marginTop: 2 }}>✗ Aktif Değil</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: 4 }}>Kasa Bakiyesi</span>
                        <div style={{ marginTop: 2 }}>
                          {detailData.balance < 0 ? (
                            <span className="badge badge-red">🔴 Borç: {formatTL(Math.abs(detailData.balance))}</span>
                          ) : detailData.balance > 0 ? (
                            <span className="badge badge-green">🟢 Alacak: {formatTL(detailData.balance)}</span>
                          ) : (
                            <span className="badge badge-gold">🟡 Borçsuz / Dengede</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Membership History Tab */}
                {activeTab === 'paket' && (
                  <div className="table-wrapper">
                    {detailData.memberships.length === 0 ? (
                      <div className="empty-state" style={{ padding: '20px 10px' }}><p>Bu üyeye tanımlı paket bulunamadı.</p></div>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            <th>Uyelik ID</th><th>Paket</th><th>Başlangıç</th><th>Bitiş</th><th>Durum</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailData.memberships.map(m => (
                            <tr key={m.uyelik_id}>
                              <td className="td-muted">#{m.uyelik_id}</td>
                              <td><strong>{m.paket_adi || 'Paket'}</strong></td>
                              <td className="td-muted">{formatDate(m.baslangic_tarihi)}</td>
                              <td className="td-muted">{formatDate(m.bitis_tarihi)}</td>
                              <td>
                                {m.durum === 'Aktif' ? (
                                  <span className="badge badge-green">Aktif</span>
                                ) : m.durum === 'Pasif' ? (
                                  <span className="badge badge-red">Pasif</span>
                                ) : (
                                  <span className="badge badge-orange">Beklemede</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* Payments Tab */}
                {activeTab === 'odeme' && (
                  <div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px 18px', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, border: '1px solid var(--border)' }}>
                      <div>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Net Hesap Bakiyesi</span>
                        <h4 style={{ fontSize: 18, fontWeight: 800, color: detailData.balance < 0 ? 'var(--red)' : detailData.balance > 0 ? 'var(--green)' : 'var(--gold)', marginTop: 4 }}>
                          {detailData.balance < 0 ? `- ${formatTL(Math.abs(detailData.balance))} (Borçlu)` : detailData.balance > 0 ? `+ ${formatTL(detailData.balance)} (Fazla Ödeme)` : '0,00 ₺ (Lunas)'}
                        </h4>
                      </div>
                      <span style={{ fontSize: 28 }}>💳</span>
                    </div>

                    <div className="table-wrapper">
                      {!detailData.payments || detailData.payments.length === 0 ? (
                        <div className="empty-state" style={{ padding: '20px 10px' }}><p>Kayıtlı ödeme bulunmamaktadır.</p></div>
                      ) : (
                        <table>
                          <thead>
                            <tr>
                              <th>ID</th><th>Tutar</th><th>Tür</th><th>Tarih</th><th>Açıklama</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detailData.payments.map(p => (
                              <tr key={p.odeme_id}>
                                <td className="td-muted">#{p.odeme_id}</td>
                                <td><strong className="text-gold">{formatTL(p.odeme_tutari)}</strong></td>
                                <td className="td-muted">{p.odeme_turu}</td>
                                <td className="td-muted">{formatDate(p.odeme_tarihi)}</td>
                                <td className="td-muted" style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.aciklama}>
                                  {p.aciklama || '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}

                {/* Attendance Tab */}
                {activeTab === 'katilim' && (
                  <div className="table-wrapper">
                    {detailData.attendance.length === 0 ? (
                      <div className="empty-state" style={{ padding: '20px 10px' }}><p>Giriş-çıkış kaydı bulunamadı.</p></div>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            <th>Kayıt ID</th><th>Giriş Zamanı</th><th>Çıkış Zamanı</th><th>Süre</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailData.attendance.map(a => (
                            <tr key={a.log_id}>
                              <td className="td-muted">#{a.log_id}</td>
                              <td className="td-muted">{formatDate(a.giris_zamani)}</td>
                              <td className="td-muted">{a.cikis_zamani ? formatDate(a.cikis_zamani) : <span className="badge badge-orange">İçeride</span>}</td>
                              <td>{a.sure_dakika != null ? <span className="badge badge-blue">{a.sure_dakika} dk</span> : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="modal-footer" style={{ marginTop: 24 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setDetailMember(null)}>Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
