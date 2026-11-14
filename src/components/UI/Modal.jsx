import React, { useEffect, useId, useRef } from 'react';

const FOCAVEIS = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

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
  const idTitulo = useId();
  const idMensagem = useId();
  const caixa = useRef(null);
  const acoes = useRef({ onConfirm, onCancel });
  acoes.current = { onConfirm, onCancel };

  useEffect(() => {
    if (!isOpen) return undefined;

    const anterior = document.activeElement;
    caixa.current?.querySelector(FOCAVEIS)?.focus();

    const aoTeclar = (e) => {
      if (e.key === 'Escape') {
        const { onCancel: cancelar, onConfirm: confirmar } = acoes.current;
        const fechar = cancelar || confirmar;
        if (fechar) {
          e.preventDefault();
          fechar();
        }
        return;
      }

      if (e.key === 'Tab' && caixa.current) {
        const itens = caixa.current.querySelectorAll(FOCAVEIS);
        if (itens.length === 0) return;
        const primeiro = itens[0];
        const ultimo = itens[itens.length - 1];

        if (e.shiftKey && document.activeElement === primeiro) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primeiro.focus();
        }
      }
    };

    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      if (anterior && typeof anterior.focus === 'function') anterior.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="lumi-modal-overlay">
      <div
        ref={caixa}
        className={`lumi-modal lumi-modal-${type}`}
        role={type === 'danger' ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={message ? idMensagem : undefined}
      >
        <div className="lumi-modal-icon" aria-hidden="true">🦊</div>

        <h3 id={idTitulo}>{title}</h3>

        {message && <p id={idMensagem}>{message}</p>}

        <div className="lumi-modal-actions">
          {onCancel && (
            <button type="button" className="lumi-modal-btn secondary" onClick={onCancel}>
              {cancelText}
            </button>
          )}

          {onConfirm && (
            <button type="button" className="lumi-modal-btn primary" onClick={onConfirm}>
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}