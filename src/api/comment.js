import api from './axios';

export const getComments = (portfolioId) => api.get(`/portfolios/${portfolioId}/comments`);
export const addComment = (portfolioId, data) => api.post(`/portfolios/${portfolioId}/comments`, data);
export const updateComment = (portfolioId, commentId, data) => api.put(`/portfolios/${portfolioId}/comments/${commentId}`, data);
export const deleteComment = (portfolioId, commentId) => api.delete(`/portfolios/${portfolioId}/comments/${commentId}`);
