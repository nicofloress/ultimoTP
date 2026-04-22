interface Props {
  onFacturar: () => void;
  onNoFacturar: () => void;
}

export default function ModalFacturar({ onFacturar, onNoFacturar }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="facturar-title"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 sm:px-8 py-4 sm:py-6 rounded-t-xl text-center">
          <h3 id="facturar-title" className="text-xl sm:text-2xl font-bold text-gray-800 tracking-wide">FACTURAR</h3>
          <p className="text-blue-600 font-semibold mt-2 text-base sm:text-lg">DESEA EMITIR LA FACTURA DE AFIP?</p>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 p-4 sm:p-6">
          <button
            onClick={onFacturar}
            className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            Si, facturar
          </button>
          <button
            onClick={onNoFacturar}
            className="w-full sm:w-auto bg-gray-100 text-gray-700 px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-200 transition-colors shadow-md border border-gray-300"
          >
            No facturar
          </button>
        </div>
      </div>
    </div>
  );
}
