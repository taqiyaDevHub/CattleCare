import api from './axios';

export const getMilkRecords = (date) => api.get('/milk', { params: { date } });
export const saveMilkRecords = (body) => api.post('/milk/bulk', body);
export const getMilkAlerts = () => api.get('/milk/alerts');
export const getMilkTrend = (animalId, days = 30) => api.get(`/milk/trend/${animalId}`, { params: { days } });
export const updateMilkRecord = (id, body) => api.put(`/milk/${id}`, body);
export const deleteMilkRecord = (id) => api.delete(`/milk/${id}`);
