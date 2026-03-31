export interface ComprobanteXPrintProps {
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
  config?: {
    sucursal?: string;
    mail?: string;
    condicionIva?: string;
  };
  onClose: () => void;
}

const formatMoney = (n: number) =>
  n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ComprobanteXPrint({ ticket, config, onClose }: ComprobanteXPrintProps) {
  const sucursal = config?.sucursal || 'SUC MDQ 2';
  const mail = config?.mail || 'hamburguesas1aplatamdq22@gmail.com';
  const condicionIva = config?.condicionIva || 'Resp. Inscripto';

  const totalItems = ticket.lineas.length;
  const totalUnidades = ticket.lineas.reduce((sum, l) => sum + l.cantidad, 0);

  // Extraer numero de venta del ticket (T-yyyyMMdd-#### -> solo el numero secuencial)
  const nroVenta = ticket.numeroTicket.replace(/^T-\d{8}-/, '').replace(/^0+/, '') || ticket.numeroTicket;

  const formaPago = ticket.pagos && ticket.pagos.length > 0
    ? ticket.pagos.map(p => p.formaPagoNombre).join(' / ')
    : ticket.formaPagoNombre || 'Efectivo';

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:bg-transparent print:static print:inset-auto">
      <div className="absolute inset-0 print:hidden" onClick={onClose} />

      <div className="relative bg-white rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto print:shadow-none print:rounded-none print:max-h-none print:overflow-visible">
        {/* Botones */}
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

        {/* Ticket */}
        <div className="comprobante-x-content" style={{ width: '80mm', padding: '3mm', fontSize: '11px', fontFamily: 'monospace', lineHeight: '1.4' }}>

          {/* Encabezado sucursal */}
          <div style={{ textAlign: 'center', marginBottom: '6px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{sucursal}</div>
            <div style={{ fontSize: '9px' }}>Mail: {mail}</div>
          </div>

          {/* Comprobante X */}
          <div style={{ textAlign: 'center', margin: '8px 0' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>comprobante X</div>
            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>ORIGINAL</div>
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

          <div style={{ textAlign: 'center', fontSize: '10px', margin: '4px 0' }}>
            No valido como factura
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

          {/* Info venta */}
          <div style={{ fontSize: '10px', margin: '6px 0' }}>
            <div>Venta: {nroVenta}</div>
            <div>Fecha: {new Date(ticket.fecha).toLocaleDateString('es-AR')} {new Date(ticket.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</div>
            <div>Condicion: {formaPago}</div>
            <div>IVA: {condicionIva}</div>
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

          {/* Cliente */}
          <div style={{ fontSize: '10px', margin: '4px 0' }}>
            Cliente: {ticket.nombreCliente || 'Consumidor Final'}
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

          {/* Detalle de compra */}
          <div style={{ fontWeight: 'bold', fontSize: '11px', margin: '6px 0 4px 0' }}>
            DETALLE DE COMPRA
          </div>

          {ticket.lineas.map((l, i) => (
            <div key={i} style={{ marginBottom: '6px', fontSize: '10px' }}>
              <div>{l.descripcion}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{l.cantidad.toFixed(3)} x {formatMoney(l.precioUnitario)}</span>
                <span>${formatMoney(l.subtotal)}</span>
              </div>
            </div>
          ))}

          <div style={{ borderTop: '1px dashed #000', margin: '6px 0 4px 0' }} />

          {/* Subtotal */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', margin: '2px 0' }}>
            <span>SUBTOTAL:</span>
            <span>${formatMoney(ticket.subtotal)}</span>
          </div>

          {/* Descuento */}
          {ticket.descuento > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', margin: '2px 0' }}>
              <span>DESCUENTO:</span>
              <span>-${formatMoney(ticket.descuento)}</span>
            </div>
          )}

          {/* Recargo */}
          {ticket.recargo > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', margin: '2px 0' }}>
              <span>RECARGO:</span>
              <span>+${formatMoney(ticket.recargo)}</span>
            </div>
          )}

          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

          {/* Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', margin: '4px 0' }}>
            <span>TOTAL</span>
            <span>${formatMoney(ticket.total)}</span>
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

          {/* Items y unidades */}
          <div style={{ fontSize: '10px', margin: '4px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>ITEMS:</span>
              <span>{totalItems}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>UNID:</span>
              <span>{totalUnidades}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

          {/* Pagos divididos */}
          {ticket.pagos && ticket.pagos.length > 1 && (
            <div style={{ fontSize: '9px', margin: '4px 0' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Detalle de pagos:</div>
              {ticket.pagos.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{p.formaPagoNombre}</span>
                  <span>${formatMoney(p.totalACobrar)}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
            </div>
          )}

          {/* Nota interna */}
          {ticket.notaInterna && (
            <div style={{ fontSize: '9px', fontStyle: 'italic', margin: '4px 0' }}>
              Nota: {ticket.notaInterna}
            </div>
          )}

          {/* Pie */}
          <div style={{ textAlign: 'center', fontSize: '11px', marginTop: '8px' }}>
            Gracias por su compra
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .comprobante-x-content,
          .comprobante-x-content * {
            visibility: visible !important;
          }
          .comprobante-x-content {
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
