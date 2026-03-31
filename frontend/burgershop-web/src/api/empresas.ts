import api from './client';

export interface EmpresaDto {
  id: number;
  razonSocial: string;
  nombreFantasia?: string;
  cuit: string;
  condicionIva: string;
  direccionFiscal?: string;
  localidad?: string;
  provincia?: string;
  codigoPostal?: string;
  telefono?: string;
  email?: string;
  logoUrl?: string;
  ingresosBrutos?: string;
  inicioActividades?: string;
  puntoVenta?: number;
  activa: boolean;
}

export const getEmpresas = () => api.get<EmpresaDto[]>('/empresas').then(r => r.data);
export const getEmpresa = (id: number) => api.get<EmpresaDto>(`/empresas/${id}`).then(r => r.data);
export const crearEmpresa = (data: Omit<EmpresaDto, 'id' | 'activa'>) => api.post<EmpresaDto>('/empresas', data).then(r => r.data);
export const actualizarEmpresa = (id: number, data: Omit<EmpresaDto, 'id'>) => api.put<EmpresaDto>(`/empresas/${id}`, data).then(r => r.data);
export const eliminarEmpresa = (id: number) => api.delete(`/empresas/${id}`);
