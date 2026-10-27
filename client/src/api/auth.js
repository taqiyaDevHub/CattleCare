import api from './axios';

export const registerUser = (body) => api.post('/auth/register', body);
export const loginUser = (body) => api.post('/auth/login', body);
export const getMe = () => api.get('/auth/me');
export const updateMe = (body) => api.patch('/users/me', body);
