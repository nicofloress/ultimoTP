import { useEffect, useState } from 'react';

export default function ImpresionConfig() {
  const [autoImprimir, setAutoImprimir] = useState(() => localStorage.getItem('autoImprimir') === 'true');
  const [papelTicket, setPapelTicket] = useState(() => localStorage.getItem('papelTicket') || '80mm');

  useEffect(() => {
    localStorage.setItem('autoImprimir', String(autoImprimir));
  }, [autoImprimir]);

  useEffect(() => {
    localStorage.setItem('papelTicket', papelTicket);
  }, [papelTicket]);

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Impresion</h2>
      <div className="flex flex-col gap-4 max-w-md">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Auto-imprimir al crear pedido</label>
          <button
            onClick={() => setAutoImprimir(!autoImprimir)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoImprimir ? 'bg-amber-600' : 'bg-gray-300'}`}
            aria-label={autoImprimir ? 'Desactivar auto-impresión' : 'Activar auto-impresión'}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoImprimir ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Tamano de papel</label>
          <select
            value={papelTicket}
            onChange={e => setPapelTicket(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm"
          >
            <option value="80mm">80mm</option>
            <option value="58mm">58mm</option>
          </select>
        </div>
      </div>
    </div>
  );
}
