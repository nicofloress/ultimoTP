import api from './client';
import { Zona } from '../types';

export const getZonas = () => api.get<Zona[]>('/zonas').then(r => r.data);
