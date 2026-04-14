export interface TicketPrintProps {
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

const formatMoney = (n: number) =>
  n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function generarHTML(ticket: TicketPrintProps['ticket']) {
  const fecha = new Date(ticket.fecha);
  const fechaStr = fecha.toLocaleDateString('es-AR');
  const horaStr = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  const lineasHTML = ticket.lineas.map(l => `
    <div style="display:flex;justify-content:space-between;margin:2px 0">
      <span>${l.cantidad} x ${l.descripcion}</span>
      <span style="white-space:nowrap">$${formatMoney(l.subtotal)}</span>
    </div>
  `).join('');

  const descuentoHTML = ticket.descuento > 0 ? `
    <div style="display:flex;justify-content:space-between;margin:2px 0">
      <span>Descuento:</span><span>-$${formatMoney(ticket.descuento)}</span>
    </div>` : '';

  const recargoHTML = ticket.recargo > 0 ? `
    <div style="display:flex;justify-content:space-between;margin:2px 0">
      <span>Recargo:</span><span>+$${formatMoney(ticket.recargo)}</span>
    </div>` : '';

  const pagosHTML = ticket.pagos && ticket.pagos.length > 0 ? `
    <div style="margin:4px 0">
      <div style="font-weight:bold;margin-bottom:2px">Pagos:</div>
      ${ticket.pagos.map(p => `
        <div style="display:flex;justify-content:space-between">
          <span>${p.formaPagoNombre}${p.recargo > 0 ? ` (+$${formatMoney(p.recargo)})` : ''}</span>
          <span>$${formatMoney(p.totalACobrar)}</span>
        </div>
      `).join('')}
    </div>` : ticket.formaPagoNombre ? `
    <div style="margin:4px 0">Forma de Pago: ${ticket.formaPagoNombre}</div>` : '';

  const notaHTML = ticket.notaInterna ? `
    <div style="font-style:italic;margin:4px 0;border-top:1px dashed #000;padding-top:4px">Nota: ${ticket.notaInterna}</div>` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Ticket ${ticket.numeroTicket}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; font-size: 11px; line-height: 1.4; width: 80mm; padding: 3mm; }
    .sep { border-top: 1px dashed #000; margin: 4px 0; }
    @media print { @page { size: 80mm auto; margin: 0; } }
  </style>
</head>
<body>
  <div style="text-align:center;margin-bottom:6px">
    <div style="font-size:14px;font-weight:bold">HLP Burger Shop</div>
    <div style="font-size:10px">Av. Vergara 2485, Hurlingham</div>
    <div style="font-size:10px">Tel: (011) 4665-1234</div>
  </div>

  <div style="text-align:center;border-top:1px dashed #000;border-bottom:1px dashed #000;padding:4px 0;margin-bottom:4px">
    <div style="font-size:16px;font-weight:bold">#${ticket.numeroTicket}</div>
  </div>

  <div style="margin:6px 0">
    <div>Fecha: ${fechaStr} ${horaStr}</div>
    <div>Tipo: ${ticket.tipo === 1 ? 'Para Llevar' : 'Domicilio'}</div>
    <div>${tipoFacturaLabel(ticket.tipoFactura)}</div>
    ${ticket.nombreCliente ? `<div>Cliente: ${ticket.nombreCliente}</div>` : ''}
    ${ticket.direccionEntrega ? `<div>Dir: ${ticket.direccionEntrega}</div>` : ''}
    ${ticket.zonaNombre ? `<div>Zona: ${ticket.zonaNombre}</div>` : ''}
  </div>

  <div class="sep"></div>

  <div style="font-weight:bold;margin:4px 0">DETALLE</div>
  ${lineasHTML}

  <div class="sep"></div>

  <div style="display:flex;justify-content:space-between;margin:2px 0">
    <span>Subtotal:</span><span>$${formatMoney(ticket.subtotal)}</span>
  </div>
  ${descuentoHTML}
  ${recargoHTML}

  <div class="sep"></div>
  <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:bold;margin:4px 0">
    <span>TOTAL</span><span>$${formatMoney(ticket.total)}</span>
  </div>
  <div class="sep"></div>

  ${pagosHTML}
  ${notaHTML}

  <div style="text-align:center;margin-top:8px;border-top:1px dashed #000;padding-top:6px">
    Gracias por su compra!
  </div>
</body>
</html>`;
}

export default function TicketPrint({ ticket, onClose }: TicketPrintProps) {
  const handleImprimir = () => {
    const html = generarHTML(ticket);
    const ventana = window.open('', '_blank', 'width=350,height=600');
    if (!ventana) return;
    ventana.document.write(html);
    ventana.document.close();
    ventana.focus();
    setTimeout(() => ventana.print(), 300);
  };

  const nroVenta = ticket.numeroTicket;
  const formaPago = ticket.pagos && ticket.pagos.length > 0
    ? ticket.pagos.map(p => p.formaPagoNombre).join(' / ')
    : ticket.formaPagoNombre || 'Efectivo';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Botones */}
        <div className="sticky top-0 bg-white border-b p-3 flex gap-2 justify-center z-10">
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

        {/* Vista previa */}
        <div style={{ width: '80mm', padding: '3mm', fontSize: '11px', fontFamily: "'Courier New', monospace", lineHeight: '1.4' }}>
          <div style={{ textAlign: 'center', marginBottom: '6px' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>HLP Burger Shop</div>
            <div style={{ fontSize: '10px' }}>Av. Vergara 2485, Hurlingham</div>
            <div style={{ fontSize: '10px' }}>Tel: (011) 4665-1234</div>
          </div>

          <div style={{ textAlign: 'center', borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '4px 0', marginBottom: '4px' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>#{nroVenta}</div>
          </div>

          <div style={{ fontSize: '10px', margin: '6px 0' }}>
            <div>Fecha: {new Date(ticket.fecha).toLocaleDateString('es-AR')} {new Date(ticket.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</div>
            <div>Tipo: {ticket.tipo === 1 ? 'Para Llevar' : 'Domicilio'}</div>
            <div>{tipoFacturaLabel(ticket.tipoFactura)}</div>
            {ticket.nombreCliente && <div>Cliente: {ticket.nombreCliente}</div>}
            {ticket.direccionEntrega && <div>Dir: {ticket.direccionEntrega}</div>}
            {ticket.zonaNombre && <div>Zona: {ticket.zonaNombre}</div>}
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

          <div style={{ fontWeight: 'bold', margin: '4px 0' }}>DETALLE</div>
          {ticket.lineas.map((l, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', fontSize: '10px' }}>
              <span>{l.cantidad} x {l.descripcion}</span>
              <span style={{ whiteSpace: 'nowrap' }}>${formatMoney(l.subtotal)}</span>
            </div>
          ))}

          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', fontSize: '11px' }}>
            <span>Subtotal:</span><span>${formatMoney(ticket.subtotal)}</span>
          </div>
          {ticket.descuento > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', fontSize: '10px' }}>
              <span>Descuento:</span><span>-${formatMoney(ticket.descuento)}</span>
            </div>
          )}
          {ticket.recargo > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', fontSize: '10px' }}>
              <span>Recargo:</span><span>+${formatMoney(ticket.recargo)}</span>
            </div>
          )}

          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', margin: '4px 0' }}>
            <span>TOTAL</span><span>${formatMoney(ticket.total)}</span>
          </div>
          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

          {ticket.pagos && ticket.pagos.length > 0 ? (
            <div style={{ margin: '4px 0', fontSize: '10px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Pagos:</div>
              {ticket.pagos.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{p.formaPagoNombre}</span><span>${formatMoney(p.totalACobrar)}</span>
                </div>
              ))}
            </div>
          ) : ticket.formaPagoNombre ? (
            <div style={{ margin: '4px 0', fontSize: '10px' }}>Forma de Pago: {formaPago}</div>
          ) : null}

          {ticket.notaInterna && (
            <div style={{ fontSize: '10px', fontStyle: 'italic', margin: '4px 0', borderTop: '1px dashed #000', paddingTop: '4px' }}>
              Nota: {ticket.notaInterna}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '8px', borderTop: '1px dashed #000', paddingTop: '6px', fontSize: '11px' }}>
            Gracias por su compra!
          </div>
        </div>
      </div>
    </div>
  );
}
