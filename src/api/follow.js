import api from './axios';

export const toggleFollow = (email) => api.post(`/follow/${encodeURIComponent(email)}`);
export const getFollowStatus = (email) => api.get(`/follow/${encodeURIComponent(email)}/status`);
