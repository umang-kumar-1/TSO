import * as React from 'react';

interface ConfirmationModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  title,
  message,
  onConfirm,
  onCancel,
  confirmButtonText = 'Delete',
  cancelButtonText = 'Cancel',
}) => {
    React.useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            onCancel();
          }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
      }, [onCancel]);

  return (
    <>
        <div className="modal-backdrop fade show"></div>
        <div 
            className="modal fade show"
            style={{ display: 'block' }}
            aria-modal="true"
            role="dialog"
            onClick={onCancel}
        >
            <div 
                className="modal-dialog modal-dialog-centered"
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-content">
                    <div className="modal-body p-4 text-center">
                        <div className="d-inline-flex align-items-center justify-content-center bg-danger-subtle text-danger rounded-circle mb-3" style={{width: '48px', height: '48px'}}>
                            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true" width="24" height="24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h5 className="modal-title mb-2">{title}</h5>
                        <p className="text-body-secondary">{message}</p>
                    </div>
                    <div className="modal-footer flex-nowrap p-0">
                         <button
                            type="button"
                            className="btn btn-lg btn-link fs-6 text-decoration-none col-6 m-0 rounded-0 border-end"
                            onClick={onCancel}
                        >
                            {cancelButtonText}
                        </button>
                        <button
                            type="button"
                            className="btn btn-lg btn-link fs-6 text-decoration-none col-6 m-0 rounded-0 text-danger"
                            onClick={onConfirm}
                        >
                            {confirmButtonText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </>
  );
};

export default ConfirmationModal;