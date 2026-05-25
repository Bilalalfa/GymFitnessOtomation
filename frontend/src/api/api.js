import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

// ── Members ──────────────────────────────────────────────────────────────────
export const getMembers       = ()          => api.get('/members/');
export const getMemberById    = (id)        => api.get(`/members/${id}`);
export const createMember     = (data)      => api.post('/members/', data);
export const updateMember     = (id, data)  => api.put(`/members/${id}`, data);
export const deleteMember     = (id)        => api.delete(`/members/${id}`);

// ── Packages ─────────────────────────────────────────────────────────────────
export const getPackages      = ()          => api.get('/packages/');
export const createPackage    = (data)      => api.post('/packages/', data);
export const updatePackage    = (id, data)  => api.put(`/packages/${id}`, data);
export const deletePackage    = (id)        => api.delete(`/packages/${id}`);

// ── Memberships ──────────────────────────────────────────────────────────────
export const getMemberships         = ()    => api.get('/memberships/');
export const getMemberMemberships   = (id)  => api.get(`/memberships/member/${id}`);
export const createMembership       = (d)   => api.post('/memberships/', d);

// ── Payments ─────────────────────────────────────────────────────────────────
export const getPayments      = ()          => api.get('/payments/');
export const createPayment    = (data)      => api.post('/payments/', data);
export const deletePayment    = (id)        => api.delete(`/payments/${id}`);
export const getMemberBalance = (id)        => api.get(`/payments/balance/${id}`);


// ── Attendance ────────────────────────────────────────────────────────────────
export const getAttendance    = ()          => api.get('/attendance/');
export const getMemberAttendance = (id)     => api.get(`/attendance/member/${id}`);
export const checkIn          = (uye_id)    => api.post('/attendance/checkin', { uye_id });
export const checkOut         = (log_id)    => api.post('/attendance/checkout', { log_id });

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboard     = ()          => api.get('/dashboard');

export default api;
