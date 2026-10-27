import api from './axios';

export const getTransactions = (params) => api.get('/transactions', { params });
export const createTransaction = (body) => api.post('/transactions', body);
export const updateTransaction = (id, body) => api.put(`/transactions/${id}`, body);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);
export const getProfitLoss = (month) => api.get('/reports/profit-loss', { params: { month } });
export const getDashboard = () => api.get('/dashboard');
