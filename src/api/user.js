import api from './axios';

export const getMyProfile = () => api.get('/users/me');
export const getUserProfile = (email) => api.get(`/users/${encodeURIComponent(email)}`);
export const updateProfile = (data) => api.put('/users/profile', data);
export const changePassword = (data) => api.put('/users/password', data);
