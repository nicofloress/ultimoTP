import { FormaPago, CrearPagoDto } from '../types';

interface PagoDivididoProps {
  formasPago: FormaPago[];
  totalVenta: number;
  pagos: CrearPagoDto[];
  onChange: (pagos: CrearPagoDto[]) => void;
}

export default function PagoDivididoPanel({ formasPago, totalVenta, pagos, onChange }: PagoDivididoProps) {
  const agregarPago = () => {
    onChange([...pagos, { formaPagoId: 0, monto: 0 }]);
  };

  const actualizarPago = (index: number, field: keyof CrearPagoDto, value: number) => {
    onChange(pagos.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const eliminarPago = (index: number) => {
    onChange(pagos.filter((_, i) => i !== index));
  };

  const getRecargo = (pago: CrearPagoDto) => {
    const fp = formasPago.find(f => f.id === pago.formaPagoId);
    if (!fp || fp.porcentajeRecargo <= 0) return 0;
    return Math.round(pago.monto * fp.porcentajeRecargo / 100);
  };

  const totalMontos = pagos.reduce((sum, p) => sum + p.monto, 0);
  const totalRecargos = pagos.reduce((sum, p) => sum + getRecargo(p), 0);
  const totalACobrar = totalMontos + totalRecargos;
  const deudaRestante = totalVenta - totalMontos;

  return (
    <div className="space-y-3">
      {pagos.length > 0 && (
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-2 py-1.5 text-xs font-medium text-gray-500">Forma Pago</th>
                <th className="text-right px-2 py-1.5 text-xs font-medium text-gray-500">Monto</th>
                <th className="text-right px-2 py-1.5 text-xs font-medium text-gray-500">Recargo</th>
                <th className="text-right px-2 py-1.5 text-xs font-medium text-gray-500">Total</th>
                <th className="px-2 py-1.5 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pagos.map((pago, i) => {
                const recargo = getRecargo(pago);
                const totalLinea = pago.monto + recargo;
                return (
                  <tr key={i}>
                    <td className="px-2 py-1.5">
                      <select
                        value={pago.formaPagoId || ''}
                        onChange={e => actualizarPago(i, 'formaPagoId', Number(e.target.value))}
                        className="w-full border rounded px-1 py-0.5 text-sm"
                      >
                        <option value="">Seleccionar...</option>
                        {formasPago.map(fp => (
                          <option key={fp.id} value={fp.id}>
                            {fp.nombre}{fp.porcentajeRecargo > 0 ? ` (+${fp.porcentajeRecargo}%)` : ''}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        value={pago.monto}
                        onChange={e => actualizarPago(i, 'monto', Number(e.target.value))}
                        className="w-full border rounded px-1 py-0.5 text-sm text-right"
                        min={0}
                        step={100}
                      />
                    </td>
                    <td className="px-2 py-1.5 text-right text-xs text-orange-600">
                      {recargo > 0 ? `+$${recargo.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-2 py-1.5 text-right text-xs font-medium">
                      ${totalLinea.toLocaleString()}
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <button
                        onClick={() => eliminarPago(i)}
                        className="text-red-500 hover:text-red-700 text-xs font-bold"
                      >
                        X
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <button
        onClick={agregarPago}
        className="w-full py-1.5 border-2 border-dashed border-gray-300 rounded text-sm text-gray-500 hover:border-amber-400 hover:text-amber-600 transition-colors"
      >
        + Agregar metodo de pago
      </button>

      {/* Resumen */}
      <div className="bg-gray-100 rounded p-2 space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Total venta</span>
          <span>${totalVenta.toLocaleString()}</span>
        </div>
        {totalRecargos > 0 && (
          <div className="flex justify-between text-orange-600">
            <span>Total recargos</span>
            <span>+${totalRecargos.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between font-medium">
          <span>Total a cobrar</span>
          <span>${totalACobrar.toLocaleString()}</span>
        </div>
        <div className={`flex justify-between font-bold ${deudaRestante > 0 ? 'text-red-600' : deudaRestante === 0 ? 'text-green-600' : 'text-orange-600'}`}>
          <span>{deudaRestante > 0 ? 'Deuda restante' : deudaRestante === 0 ? 'Cubierto' : 'Excedente'}</span>
          <span>${Math.abs(deudaRestante).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
