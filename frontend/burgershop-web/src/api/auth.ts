import client from './client';
import { LoginRequest, LoginResult, Usuario } from '../types/auth';

export const login = (data: LoginRequest) => client.post<LoginResult>('/auth/login', data);
export const getMe = () => client.get<Usuario>('/auth/me');
