import api from './axios';

export const getAnimals = (params) => api.get('/animals', { params });
export const getAnimal = (id) => api.get(`/animals/${id}`);
export const createAnimal = (body) => api.post('/animals', body);
export const updateAnimal = (id, body) => api.put(`/animals/${id}`, body);
export const archiveAnimal = (id) => api.patch(`/animals/${id}/archive`);
export const sellAnimal = (id, body) => api.post(`/animals/${id}/sell`, body);
