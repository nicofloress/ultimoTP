/**
 * Abre WhatsApp para enviar un mensaje a un numero.
 *
 * En desktop: abre `web.whatsapp.com/send` en una pestaña con name fijo.
 * Si el usuario ya envio desde otro boton, esa misma pestaña se reusa
 * (gracias al target name). Si la pestaña de WhatsApp Web fue abierta
 * manualmente por el usuario antes, NO se reusa esa: la primera vez
 * abre una nueva con el name correcto, y a partir de ahi se reutiliza.
 *
 * En mobile: usa el deep-link `wa.me` que abre la app nativa.
 */
export function enviarWhatsapp(telefono: string, mensaje: string): void {
  const tel = telefono.replace(/\D/g, '');
  if (!tel) return;
  const msg = encodeURIComponent(mensaje);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile) {
    // En mobile el deeplink abre la app nativa (o web si no esta instalada)
    window.location.href = `https://wa.me/${tel}?text=${msg}`;
    return;
  }

  // En desktop usamos web.whatsapp.com directo (evita la redireccion de wa.me)
  // El target name fijo permite reusar la pestaña en siguientes envios.
  const win = window.open(
    `https://web.whatsapp.com/send/?phone=${tel}&text=${msg}`,
    'whatsapp_burgershop',
  );
  // Algunos navegadores requieren focus() explicito para traer la pestaña al frente
  if (win) {
    try { win.focus(); } catch { /* ignore */ }
  }
}
