import { Producto, ListaPrecio } from '../../../types';

interface Props {
  producto: Producto;
  listas: ListaPrecio[];
  onClose: () => void;
}

export default function ProductoDetalleModal({ producto, listas, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="producto-detalle-title"
    >
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-slate-700 text-white px-5 py-4 rounded-t-xl">
          <h3 id="producto-detalle-title" className="font-bold text-lg">{producto.nombre}</h3>
          {producto.numeroInterno && (
            <span className="text-slate-300 text-xs font-mono">{producto.numeroInterno}</span>
          )}
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Categoría</span>
            <span className="font-medium">{producto.categoriaNombre}</span>
          </div>
          {producto.marca && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Marca</span>
              <span className="font-medium">{producto.marca}</span>
            </div>
          )}
          {producto.pesoGramos != null && producto.pesoGramos > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{producto.unidadMedida === 'ml' ? 'Contenido' : 'Peso'}</span>
              <span className="font-medium">
                {producto.unidadMedida === 'ml'
                  ? (producto.pesoGramos >= 1000
                      ? `${(producto.pesoGramos / 1000).toLocaleString('es-AR', { maximumFractionDigits: 3 })} L`
                      : `${producto.pesoGramos} ml`)
                  : (producto.pesoGramos >= 1000
                      ? `${(producto.pesoGramos / 1000).toLocaleString('es-AR', { maximumFractionDigits: 3 })} kg`
                      : `${producto.pesoGramos} g`)}
              </span>
            </div>
          )}
          {producto.unidadesPorMedia > 0 && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Unidades por media</span>
                <span className="font-medium">{producto.unidadesPorMedia}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Unidades por bulto</span>
                <span className="font-medium">{producto.unidadesPorBulto}</span>
              </div>
            </>
          )}
          {producto.descripcion && (
            <div className="text-sm">
              <span className="text-gray-500 block mb-1">Descripción</span>
              <span className="text-gray-700">{producto.descripcion}</span>
            </div>
          )}

          {/* Precios */}
          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Precio base</span>
              <span className="font-bold text-lg">${producto.precio.toLocaleString()}</span>
            </div>

            {/* Precios de todas las listas */}
            {listas.filter(l => l.activa).map(lista => {
              const detalle = lista.detalles.find(d => d.productoId === producto.id);
              if (!detalle) return null;
              return (
                <div key={lista.id} className="flex justify-between items-center mt-1">
                  <span className="text-gray-500 text-sm">{lista.nombre}</span>
                  <span className={`font-bold text-lg ${detalle.precio !== producto.precio ? 'text-amber-600' : ''}`}>
                    ${detalle.precio.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 rounded-b-xl flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
