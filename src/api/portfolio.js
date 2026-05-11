import api from './axios';

export const getPortfolios = (params) => api.get('/portfolios', { params });
export const getPortfolio = (id) => api.get(`/portfolios/${id}`);
export const createPortfolio = (data) => api.post('/portfolios', data);
export const updatePortfolio = (id, data) => api.put(`/portfolios/${id}`, data);
export const deletePortfolio = (id) => api.delete(`/portfolios/${id}`);
export const likePortfolio = (id) => api.post(`/portfolios/${id}/like`);
export const toggleVisibility = (id) => api.patch(`/portfolios/${id}/visibility`);

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const token = localStorage.getItem('token');
  const res = await fetch('http://localhost:8080/api/upload', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = new Error('Upload failed');
    err.response = { status: res.status };
    throw err;
  }
  const data = await res.json();
  return { data };
};
