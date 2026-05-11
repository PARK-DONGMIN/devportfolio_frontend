import api from './axios';

export const generateDescription = (data) => api.post('/ai/generate', data);
export const chatWithPortfolio = (data) => api.post('/ai/chat', data);
