import * as React from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  show: boolean;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children, show }) => {
  React.useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    if (show) {
      window.addEventListener("keydown", handleEsc);
    }
    return () => window.removeEventListener("keydown", handleEsc);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div
        className="modal fade show"
        style={{ display: "block" }}
        aria-modal="true"
        role="dialog"
        onClick={onClose}
      >
        <div
          className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
          style={{ maxWidth: "1000px" }} // ⬅️ Increased width here
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">{children}</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;