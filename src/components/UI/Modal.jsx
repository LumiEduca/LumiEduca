import React from 'react';

export default function Modal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  type = 'default',
}) {
  if (!isOpen) return null;

  return (
    <div className="lumi-modal-overlay">
      <div className={`lumi-modal lumi-modal-${type}`}>
        <div className="lumi-modal-icon">🦊</div>

        <h3>{title}</h3>

        {message && <p>{message}</p>}

        <div className="lumi-modal-actions">
          {onCancel && (
            <button className="lumi-modal-btn secondary" onClick={onCancel}>
              {cancelText}
            </button>
          )}

          {onConfirm && (
            <button className="lumi-modal-btn primary" onClick={onConfirm}>
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}