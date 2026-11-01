export default function ConfirmDialog({ title, message, confirmLabel, cancelLabel, busyLabel, busy = false, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
      <div className="card w-full max-w-md space-y-4" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-message">
        <div>
          <h2 id="confirm-dialog-title" className="text-lg font-semibold text-earth">{title}</h2>
          <p id="confirm-dialog-message" className="mt-2 text-sm text-stone-600">{message}</p>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" disabled={busy} onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className="btn-primary !w-auto" disabled={busy} onClick={onConfirm}>{busy ? busyLabel : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
