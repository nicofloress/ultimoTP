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

function generarHTML(ticket: ComprobanteXPrintProps['ticket'], config?: ComprobanteXPrintProps['config']) {
  const sucursal = config?.sucursal || 'SUC MDQ 2';
  const mail = config?.mail || 'hamburguesas1aplatamdq22@gmail.com';
  const condicionIva = config?.condicionIva || 'Resp. Inscripto';
  const totalItems = ticket.lineas.length;
  const totalUnidades = ticket.lineas.reduce((sum, l) => sum + l.cantidad, 0);
  const nroVenta = ticket.numeroTicket.replace(/^[VT]-\d{8}-/, '').replace(/^0+/, '') || ticket.numeroTicket;
  const formaPago = ticket.pagos && ticket.pagos.length > 0
    ? ticket.pagos.map(p => p.formaPagoNombre).join(' / ')
    : ticket.formaPagoNombre || 'Efectivo';

  const fecha = new Date(ticket.fecha);
  const fechaStr = fecha.toLocaleDateString('es-AR');
  const horaStr = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  const lineasHTML = ticket.lineas.map(l => `
    <div style="margin-bottom:6px">
      <div>${l.descripcion}</div>
      <div style="display:flex;justify-content:space-between">
        <span>${l.cantidad.toFixed(3)} x ${formatMoney(l.precioUnitario)}</span>
        <span>$${formatMoney(l.subtotal)}</span>
      </div>
    </div>
  `).join('');

  const descuentoHTML = ticket.descuento > 0 ? `
    <div style="display:flex;justify-content:space-between;font-size:14px;margin:2px 0">
      <span>DESCUENTO:</span><span>-$${formatMoney(ticket.descuento)}</span>
    </div>` : '';

  const recargoHTML = ticket.recargo > 0 ? `
    <div style="display:flex;justify-content:space-between;font-size:14px;margin:2px 0">
      <span>RECARGO:</span><span>+$${formatMoney(ticket.recargo)}</span>
    </div>` : '';

  const pagosHTML = ticket.pagos && ticket.pagos.length > 1 ? `
    <div style="font-size:13px;margin:4px 0">
      <div style="font-weight:bold;margin-bottom:2px">Detalle de pagos:</div>
      ${ticket.pagos.map(p => `
        <div style="display:flex;justify-content:space-between">
          <span>${p.formaPagoNombre}</span><span>$${formatMoney(p.totalACobrar)}</span>
        </div>
      `).join('')}
      <div style="border-top:1px dashed #000;margin:4px 0"></div>
    </div>` : '';

  const notaHTML = ticket.notaInterna ? `
    <div style="font-size:13px;font-style:italic;margin:4px 0">Nota: ${ticket.notaInterna}</div>` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Comprobante ${nroVenta}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Lucida Console', 'Consolas', 'Courier New', monospace; font-size: 12px; font-weight: 600; line-height: 1.4; width: 80mm; padding: 3mm; color: #000; }
    .sep { border-top: 1px dashed #000; margin: 4px 0; }
    .row { display: flex; justify-content: space-between; }
    @media print { @page { size: 80mm auto; margin: 0; } }
  </style>
</head>
<body>
  <div style="text-align:center;margin-bottom:6px">
    <div style="font-size:14px;font-weight:bold">${sucursal}</div>
    <div style="font-size:13px">Mail: ${mail}</div>
  </div>

  <div style="text-align:center;margin:8px 0">
    <div style="font-size:16px;font-weight:bold">comprobante X</div>
    <div style="font-size:13px;font-weight:bold">ORIGINAL</div>
  </div>

  <div class="sep"></div>
  <div style="text-align:center;font-size:14px;margin:4px 0">No valido como factura</div>
  <div class="sep"></div>

  <div style="font-size:14px;margin:6px 0">
    <div>Venta: ${nroVenta}</div>
    <div>Fecha: ${fechaStr} ${horaStr}</div>
    <div>Condicion: ${formaPago}</div>
    <div>IVA: ${condicionIva}</div>
  </div>

  <div class="sep"></div>
  <div style="font-size:14px;margin:4px 0">Cliente: ${ticket.nombreCliente || 'Consumidor Final'}</div>
  <div class="sep"></div>

  <div style="font-weight:bold;font-size:13px;margin:6px 0 4px 0">DETALLE DE COMPRA</div>
  ${lineasHTML}

  <div class="sep"></div>
  <div class="row" style="font-size:13px;margin:2px 0"><span>SUBTOTAL:</span><span>$${formatMoney(ticket.subtotal)}</span></div>
  ${descuentoHTML}
  ${recargoHTML}
  <div class="sep"></div>
  <div class="row" style="font-size:14px;font-weight:bold;margin:4px 0"><span>TOTAL</span><span>$${formatMoney(ticket.total)}</span></div>
  <div class="sep"></div>

  <div style="font-size:14px;margin:4px 0">
    <div class="row"><span>ITEMS:</span><span>${totalItems}</span></div>
    <div class="row"><span>UNID:</span><span>${totalUnidades}</span></div>
  </div>

  <div class="sep"></div>
  ${pagosHTML}
  ${notaHTML}
  <div style="text-align:center;font-size:13px;margin-top:8px">Gracias por su compra</div>
</body>
</html>`;
}

export default function ComprobanteXPrint({ ticket, config, onClose }: ComprobanteXPrintProps) {
  const sucursal = config?.sucursal || 'SUC MDQ 2';
  const mail = config?.mail || 'hamburguesas1aplatamdq22@gmail.com';
  const condicionIva = config?.condicionIva || 'Resp. Inscripto';

  const totalItems = ticket.lineas.length;
  const totalUnidades = ticket.lineas.reduce((sum, l) => sum + l.cantidad, 0);
  const nroVenta = ticket.numeroTicket.replace(/^[VT]-\d{8}-/, '').replace(/^0+/, '') || ticket.numeroTicket;
  const formaPago = ticket.pagos && ticket.pagos.length > 0
    ? ticket.pagos.map(p => p.formaPagoNombre).join(' / ')
    : ticket.formaPagoNombre || 'Efectivo';

  const handleImprimir = () => {
    const html = generarHTML(ticket, config);
    const ventana = window.open('', '_blank', 'width=350,height=600');
    if (!ventana) return;
    ventana.document.write(html);
    ventana.document.close();
    ventana.focus();
    setTimeout(() => ventana.print(), 300);
  };

  const handleDescargarPDF = () => {
    const html = generarHTML(ticket, config);
    const ventana = window.open('', '_blank', 'width=350,height=600');
    if (!ventana) return;
    ventana.document.write(html);
    ventana.document.close();
    ventana.focus();
    // El usuario puede elegir "Guardar como PDF" en el diálogo de impresión
    setTimeout(() => {
      ventana.print();
    }, 300);
  };

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
            onClick={handleDescargarPDF}
            className="bg-green-600 text-white px-6 py-2 rounded font-medium hover:bg-green-700 transition-colors"
          >
            Guardar PDF
          </button>
          <button
            onClick={onClose}
            className="bg-gray-400 text-white px-6 py-2 rounded font-medium hover:bg-gray-500 transition-colors"
          >
            Cerrar
          </button>
        </div>

        {/* Vista previa del ticket */}
        <div style={{ width: '80mm', padding: '3mm', fontSize: '11px', fontFamily: "'Lucida Console', 'Consolas', 'Courier New', monospace", lineHeight: '1.4' }}>

          <div style={{ textAlign: 'center', marginBottom: '6px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{sucursal}</div>
            <div style={{ fontSize: '9px' }}>Mail: {mail}</div>
          </div>

          <div style={{ textAlign: 'center', margin: '8px 0' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>comprobante X</div>
            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>ORIGINAL</div>
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
          <div style={{ textAlign: 'center', fontSize: '10px', margin: '4px 0' }}>No valido como factura</div>
          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

          <div style={{ fontSize: '10px', margin: '6px 0' }}>
            <div>Venta: {nroVenta}</div>
            <div>Fecha: {new Date(ticket.fecha).toLocaleDateString('es-AR')} {new Date(ticket.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</div>
            <div>Condicion: {formaPago}</div>
            <div>IVA: {condicionIva}</div>
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
          <div style={{ fontSize: '10px', margin: '4px 0' }}>Cliente: {ticket.nombreCliente || 'Consumidor Final'}</div>
          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

          <div style={{ fontWeight: 'bold', fontSize: '11px', margin: '6px 0 4px 0' }}>DETALLE DE COMPRA</div>

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

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', margin: '2px 0' }}>
            <span>SUBTOTAL:</span><span>${formatMoney(ticket.subtotal)}</span>
          </div>
          {ticket.descuento > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', margin: '2px 0' }}>
              <span>DESCUENTO:</span><span>-${formatMoney(ticket.descuento)}</span>
            </div>
          )}
          {ticket.recargo > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', margin: '2px 0' }}>
              <span>RECARGO:</span><span>+${formatMoney(ticket.recargo)}</span>
            </div>
          )}

          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', margin: '4px 0' }}>
            <span>TOTAL</span><span>${formatMoney(ticket.total)}</span>
          </div>
          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

          <div style={{ fontSize: '10px', margin: '4px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>ITEMS:</span><span>{totalItems}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>UNID:</span><span>{totalUnidades}</span></div>
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

          {ticket.pagos && ticket.pagos.length > 1 && (
            <div style={{ fontSize: '9px', margin: '4px 0' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Detalle de pagos:</div>
              {ticket.pagos.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{p.formaPagoNombre}</span><span>${formatMoney(p.totalACobrar)}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
            </div>
          )}

          {ticket.notaInterna && (
            <div style={{ fontSize: '9px', fontStyle: 'italic', margin: '4px 0' }}>Nota: {ticket.notaInterna}</div>
          )}

          <div style={{ textAlign: 'center', fontSize: '11px', marginTop: '8px' }}>Gracias por su compra</div>
        </div>
      </div>
    </div>
  );
}
