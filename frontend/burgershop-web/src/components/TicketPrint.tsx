interface TicketPrintProps {
  ticket: {
    numeroTicket: string;
    fecha: string;
    tipo: number;
    nombreCliente?: string;
    direccionEntrega?: string;
    zonaNombre?: string;
    lineas: { descripcion: string; cantidad: number; precioUnitario: number; subtotal: number }[];
    subtotal: number;
    descuento: number;
    recargo: number;
    total: number;
    formaPagoNombre?: string;
    notaInterna?: string;
    tipoFactura: number;
    pagos?: { formaPagoNombre: string; monto: number; recargo: number; totalACobrar: number }[];
  };
  onClose: () => void;
}

const tipoFacturaLabel = (tipo: number) => {
  switch (tipo) {
    case 1: return 'Factura A';
    case 2: return 'Factura B';
    case 3: return 'Factura C';
    default: return '';
  }
};

export default function TicketPrint({ ticket, onClose }: TicketPrintProps) {
  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:bg-transparent print:static print:inset-auto">
      {/* Overlay botones - solo visible en pantalla */}
      <div className="absolute inset-0 print:hidden" onClick={onClose} />

      <div className="relative bg-white rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto print:shadow-none print:rounded-none print:max-h-none print:overflow-visible">
        {/* Botones de accion */}
        <div className="sticky top-0 bg-white border-b p-3 flex gap-2 justify-center print:hidden">
          <button
            onClick={handleImprimir}
            className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 transition-colors"
          >
            Imprimir
          </button>
          <button
            onClick={onClose}
            className="bg-gray-400 text-white px-6 py-2 rounded font-medium hover:bg-gray-500 transition-colors"
          >
            Cerrar
          </button>
        </div>

        {/* Contenido del ticket */}
        <div className="p-4 ticket-content" style={{ width: '80mm', fontSize: '11px', fontFamily: 'monospace' }}>
          {/* Encabezado */}
          <div className="text-center mb-3">
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>HLP Burger Shop</div>
            <div style={{ fontSize: '9px' }}>Av. Vergara 2485, Hurlingham</div>
            <div style={{ fontSize: '9px' }}>Tel: (011) 4665-1234</div>
          </div>

          <div className="text-center mb-2" style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '4px 0' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>#{ticket.numeroTicket}</div>
          </div>

          {/* Info del pedido */}
          <div className="mb-2" style={{ fontSize: '10px' }}>
            <div>Fecha: {new Date(ticket.fecha).toLocaleString('es-AR')}</div>
            <div>Tipo: {ticket.tipo === 1 ? 'Para Llevar' : 'Domicilio'}</div>
            <div>{tipoFacturaLabel(ticket.tipoFactura)}</div>
            {ticket.nombreCliente && <div>Cliente: {ticket.nombreCliente}</div>}
            {ticket.direccionEntrega && <div>Dir: {ticket.direccionEntrega}</div>}
            {ticket.zonaNombre && <div>Zona: {ticket.zonaNombre}</div>}
          </div>

          <div style={{ borderTop: '1px dashed #000', marginBottom: '4px' }} />

          {/* Items */}
          <table className="w-full mb-2">
            <thead>
              <tr style={{ fontSize: '9px', borderBottom: '1px solid #ccc' }}>
                <th className="text-left" style={{ padding: '2px 0' }}>Cant x Descripcion</th>
                <th className="text-right" style={{ padding: '2px 0' }}>Subt.</th>
              </tr>
            </thead>
            <tbody>
              {ticket.lineas.map((l, i) => (
                <tr key={i} style={{ fontSize: '10px' }}>
                  <td style={{ padding: '1px 0' }}>
                    {l.cantidad} x {l.descripcion}
                  </td>
                  <td className="text-right" style={{ padding: '1px 0', whiteSpace: 'nowrap' }}>
                    ${l.subtotal.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: '1px dashed #000', marginBottom: '4px' }} />

          {/* Totales */}
          <div className="mb-2">
            <div className="flex justify-between" style={{ fontSize: '10px' }}>
              <span>Subtotal:</span>
              <span>${ticket.subtotal.toLocaleString()}</span>
            </div>
            {ticket.descuento > 0 && (
              <div className="flex justify-between" style={{ fontSize: '10px' }}>
                <span>Descuento:</span>
                <span>-${ticket.descuento.toLocaleString()}</span>
              </div>
            )}
            {ticket.recargo > 0 && (
              <div className="flex justify-between" style={{ fontSize: '10px' }}>
                <span>Recargo:</span>
                <span>+${ticket.recargo.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between" style={{ fontSize: '14px', fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: '4px', marginTop: '4px' }}>
              <span>TOTAL:</span>
              <span>${ticket.total.toLocaleString()}</span>
            </div>
          </div>

          {/* Pagos */}
          {ticket.pagos && ticket.pagos.length > 0 ? (
            <div className="mb-2">
              <div style={{ fontSize: '9px', fontWeight: 'bold', marginBottom: '2px' }}>Pagos:</div>
              {ticket.pagos.map((p, i) => (
                <div key={i} className="flex justify-between" style={{ fontSize: '10px' }}>
                  <span>{p.formaPagoNombre}{p.recargo > 0 ? ` (+$${p.recargo.toLocaleString()})` : ''}</span>
                  <span>${p.totalACobrar.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : ticket.formaPagoNombre ? (
            <div className="mb-2" style={{ fontSize: '10px' }}>
              Forma de Pago: {ticket.formaPagoNombre}
            </div>
          ) : null}

          {/* Nota interna */}
          {ticket.notaInterna && (
            <div className="mb-2" style={{ fontSize: '9px', fontStyle: 'italic', borderTop: '1px dashed #000', paddingTop: '4px' }}>
              Nota: {ticket.notaInterna}
            </div>
          )}

          <div style={{ borderTop: '1px dashed #000', marginTop: '8px', paddingTop: '8px' }} className="text-center">
            <div style={{ fontSize: '10px' }}>Gracias por su compra!</div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .ticket-content,
          .ticket-content * {
            visibility: visible !important;
          }
          .ticket-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            margin: 0 !important;
            padding: 2mm !important;
            font-size: 10px !important;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
