import { useEffect, useState } from 'react';
import { Categoria } from '../../types';
import { getCategorias, createCategoria, updateCategoria, deleteCategoria } from '../../api/categorias';
import { useAuth } from '../../context/AuthContext';
import { RolUsuario } from '../../types/auth';
import { ConfirmModal } from '../../components/ConfirmModal';

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [nombre, setNombre] = useState('');
  const [editando, setEditando] = useState<Categoria | null>(null);
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === RolUsuario.Administrador;
  const [confirmacion, setConfirmacion] = useState<{ visible: boolean; id: number }>({ visible: false, id: 0 });

  const cargar = () => getCategorias().then(setCategorias);

  useEffect(() => { cargar(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editando) {
      await updateCategoria(editando.id, { nombre, activa: editando.activa });
    } else {
      await createCategoria({ nombre });
    }
    setNombre('');
    setEditando(null);
    cargar();
  };

  const handleEditar = (cat: Categoria) => {
    setEditando(cat);
    setNombre(cat.nombre);
  };

  const handleEliminar = (id: number) => {
    setConfirmacion({ visible: true, id });
  };

  const confirmarEliminar = async () => {
    await deleteCategoria(confirmacion.id);
    setConfirmacion({ visible: false, id: 0 });
    cargar();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Categorias</h1>
      {esAdmin && (
        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Nombre de la categoria"
            className="border rounded px-3 py-2 flex-1"
            required
          />
          <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700">
            {editando ? 'Actualizar' : 'Crear'}
          </button>
          {editando && (
            <button type="button" onClick={() => { setEditando(null); setNombre(''); }} className="bg-gray-400 text-white px-4 py-2 rounded">
              Cancelar
            </button>
          )}
        </form>
      )}
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">ID</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Nombre</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Estado</th>
              {esAdmin && <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {categorias.map(cat => (
              <tr key={cat.id}>
                <td className="px-4 py-3 text-sm">{cat.id}</td>
                <td className="px-4 py-3 text-sm font-medium">{cat.nombre}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${cat.activa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {cat.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                {esAdmin && (
                  <td className="px-4 py-3 text-sm text-right">
                    <button onClick={() => handleEditar(cat)} className="text-blue-600 hover:underline mr-3">Editar</button>
                    <button onClick={() => handleEliminar(cat.id)} className="text-red-600 hover:underline">Desactivar</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        visible={confirmacion.visible}
        titulo="Desactivar categoria"
        mensaje="¿Desactivar esta categoria?"
        tipo="danger"
        textoConfirmar="Desactivar"
        onConfirmar={confirmarEliminar}
        onCancelar={() => setConfirmacion({ visible: false, id: 0 })}
      />
    </div>
  );
}
