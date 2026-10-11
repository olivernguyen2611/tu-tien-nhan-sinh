// Small yes/no dialog in the same card style as events.
export function ConfirmDialog({ title, text, confirmLabel, onConfirm, onCancel }: {
  title: string;
  text: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div class="modal-backdrop" role="alertdialog" aria-modal="true" aria-label={title} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div class="event-card">
        <h2>{title}</h2>
        <p class="story">{text}</p>
        <button class="choice danger" onClick={onConfirm}>{confirmLabel}</button>
        <button class="choice" onClick={onCancel}>Thôi</button>
      </div>
    </div>
  );
}
