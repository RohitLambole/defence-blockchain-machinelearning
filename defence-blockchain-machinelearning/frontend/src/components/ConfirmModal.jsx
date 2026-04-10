export default function ConfirmModal({ isOpen, title, message, confirmLabel = 'Confirm', confirmClass = 'btn-danger', onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-military-700 border border-military-500 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg border border-slate-600 text-slate-300 hover:bg-military-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
              confirmClass === 'btn-danger'
                ? 'bg-red-700 hover:bg-red-600 text-white border border-red-600'
                : 'bg-accent hover:bg-accent-dark text-white border border-accent'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
