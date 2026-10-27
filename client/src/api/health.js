import api from './axios';

// Health events (vaccines, deworming, illness)
export const getHealth = (params) => api.get('/health', { params });
export const createHealth = (body) => api.post('/health', body);
export const markHealthDone = (id, doneDate) => api.patch(`/health/${id}/done`, { doneDate });
export const updateHealth = (id, body) => api.put(`/health/${id}`, body);
export const deleteHealth = (id) => api.delete(`/health/${id}`);

// Vaccine and deworming schedule of one animal
export const getVaccineSchedule = (animalId) => api.get(`/vaccines/schedule/${animalId}`);

// Symptom checker
export const getSymptomOptions = () => api.get('/symptoms/options');
export const checkSymptoms = (body) => api.post('/symptoms/check', body);
