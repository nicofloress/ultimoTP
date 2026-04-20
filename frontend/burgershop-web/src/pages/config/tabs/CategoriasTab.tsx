import { useEffect, useState } from 'react';
import { Categoria } from '../../../types';
import { getCategorias, createCategoria, updateCategoria } from '../../../api/categorias';
import { useGlobalToast } from '../../../components/Toast';

interface Props {
  onConfirm: (tipo: string, id: number, nombre: string) => void;
}

export default function CategoriasTab({ onConfirm }: Props) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [nombre, setNombre] = useState('');
  const [categoriaPadreId, setCategoriaPadreId] = useState<number | null>(null);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const { showToast } = useGlobalToast();
  const [guardando, setGuardando] = useState(false);

  const cargar = () => getCategorias().then(setCategorias);
  useEffect(() => { cargar(); }, []);

  const categoriasPadre = categorias.filter(c => !c.categoriaPadreId);

  const categoriasOrdenadas = () => {
    const padres = categorias.filter(c => !c.categoriaPadreId);
    const result: Categoria[] = [];
    for (const padre of padres) {
      result.push(padre);
      const hijas = categorias.filter(c => c.categoriaPadreId === padre.id);
      result.push(...hijas);
    }
    const idsEnResult = new Set(result.map(c => c.id));
    for (const cat of categorias) {
      if (!idsEnResult.has(cat.id)) result.push(cat);
    }
    return result;
  };

  const opcionesPadre = () => {
    if (!editando) return categoriasPadre;
    return categoriasPadre.filter(c => c.id !== editando.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (editando) {
        await updateCategoria(editando.id, { nombre, activa: editando.activa, categoriaPadreId });
        showToast('Categoria actualizada correctamente', 'success');
      } else {
        await createCategoria({ nombre, categoriaPadreId });
        showToast('Categoria creada correctamente', 'success');
      }
      setNombre('');
      setCategoriaPadreId(null);
      setEditando(null);
      cargar();
    } catch {
      showToast('Error al guardar categoria', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (cat: Categoria) => {
    setEditando(cat);
    setNombre(cat.nombre);
    setCategoriaPadreId(cat.categoriaPadreId ?? null);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6 items-end flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre de la categoria" className="border rounded px-3 py-2 w-full" required />
        </div>
        <div className="w-56">
          <select value={categoriaPadreId ?? ''} onChange={e => setCategoriaPadreId(e.target.value ? Number(e.target.value) : null)} className="border rounded px-3 py-2 w-full">
            <option value="">Sin categoria padre (raiz)</option>
            {opcionesPadre().map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={guardando} className="text-amber-700 bg-amber-50 border border-amber-300 rounded-md hover:bg-amber-100 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed">{guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear')}</button>
        {editando && (
          <button type="button" onClick={() => { setEditando(null); setNombre(''); setCategoriaPadreId(null); }} className="bg-gray-400 text-white px-4 py-2 rounded">Cancelar</button>
        )}
      </form>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">ID</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Nombre</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Categoria Padre</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Estado</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categoriasOrdenadas().map(cat => {
              const esHija = !!cat.categoriaPadreId;
              return (
                <tr key={cat.id} className={esHija ? 'bg-gray-50/50' : ''}>
                  <td className="px-4 py-3 text-sm">{cat.id}</td>
                  <td className={`px-4 py-3 text-sm ${esHija ? 'pl-10' : 'font-semibold'}`}>
                    {esHija && <span className="text-gray-400 mr-1">--</span>}
                    {cat.nombre}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{cat.categoriaPadreNombre ?? '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${cat.activa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {cat.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <button onClick={() => handleEditar(cat)} className="text-blue-600 hover:underline mr-3">Editar</button>
                    <button onClick={() => onConfirm('categoria', cat.id, cat.nombre)} className="text-red-600 hover:underline">Desactivar</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
