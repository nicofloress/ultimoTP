interface Props {
  ventaCreadaId: number | null;
  onImprimir: () => void;
  onEnviarEmail: () => void;
  onEnviarWhatsApp: () => void;
  onEnviarDeposito: () => void;
  onCerrar: () => void;
}

export default function ModalAccionesPostVenta({
  ventaCreadaId, onImprimir, onEnviarEmail, onEnviarWhatsApp, onEnviarDeposito, onCerrar,
}: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="acciones-title"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-5 rounded-t-xl text-center border-b">
          <h3 id="acciones-title" className="text-xl font-bold text-gray-800 tracking-wide">ELIJA UNA ACCION</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 p-8">
          <button onClick={onImprimir} className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-blue-50 transition-colors border-2 border-transparent hover:border-blue-200">
            <div className="w-16 h-16 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125H8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
              </svg>
            </div>
            <span className="font-bold text-sm text-gray-700">IMPRIMIR</span>
            <span className="font-bold text-sm text-gray-700 -mt-2">A4</span>
            <span className="text-red-500 font-bold text-xs">(1)</span>
          </button>

          <button onClick={onImprimir} className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-blue-50 transition-colors border-2 border-transparent hover:border-blue-200">
            <div className="w-16 h-16 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
              </svg>
            </div>
            <span className="font-bold text-sm text-gray-700">IMPRIMIR</span>
            <span className="font-bold text-sm text-gray-700 -mt-2">TICKET</span>
            <span className="text-red-500 font-bold text-xs">(2)</span>
          </button>

          <button onClick={onEnviarEmail} className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-blue-50 transition-colors border-2 border-transparent hover:border-blue-200">
            <div className="w-16 h-16 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <span className="font-bold text-sm text-gray-700">ENVIAR</span>
            <span className="font-bold text-sm text-gray-700 -mt-2">EMAIL</span>
            <span className="text-red-500 font-bold text-xs">(3)</span>
          </button>

          <button onClick={onEnviarWhatsApp} className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-blue-50 transition-colors border-2 border-transparent hover:border-blue-200">
            <div className="w-16 h-16 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <span className="font-bold text-sm text-gray-700">ENVIAR</span>
            <span className="font-bold text-sm text-gray-700 -mt-2">WHATSAPP</span>
            <span className="text-red-500 font-bold text-xs">(4)</span>
          </button>

          {ventaCreadaId && (
            <button onClick={onEnviarDeposito} className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-orange-50 transition-colors border-2 border-transparent hover:border-orange-300">
              <div className="w-16 h-16 flex items-center justify-center">
                <svg className="w-12 h-12 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H18.75M2.25 14.25h1.5m0 0v-3.375c0-.621.504-1.125 1.125-1.125h4.5V14.25m-5.625 0h5.625m0 0v-6.375m0 6.375h6.75M12 7.875V3.375m0 0h4.5l2.25 3.375M12 3.375H7.5" />
                </svg>
              </div>
              <span className="font-bold text-sm text-orange-600">ENVIAR A</span>
              <span className="font-bold text-sm text-orange-600 -mt-2">DEPOSITO</span>
              <span className="text-red-500 font-bold text-xs">(5)</span>
            </button>
          )}
        </div>
        <div className="border-t px-8 py-4 text-center">
          <button onClick={onCerrar} className="text-gray-500 hover:text-gray-700 font-medium text-sm">
            Cerrar sin acción
          </button>
        </div>
      </div>
    </div>
  );
}
