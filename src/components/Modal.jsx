import "./modal.css";

export default function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>{title}</h2>
        <div>{children}</div>

        <button onClick={onClose} className="modal-close">
          Fechar
        </button>
      </div>
    </div>
  );
}