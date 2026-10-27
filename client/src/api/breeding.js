import api from './axios';

export const getBreedingRecords = (params = {}) => api.get('/breeding', { params });
export const createBreedingRecord = (body) => api.post('/breeding', body);
export const getBreedingAlerts = () => api.get('/breeding/alerts');
export const updateBreedingOutcome = (id, body) => api.patch(`/breeding/${id}/outcome`, body);
export const getBreedingRecord = (id) => api.get(`/breeding/${id}`);
