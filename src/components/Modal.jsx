import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import Button from './Button';

/**
 * Modal component for confirmations and alerts
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  children,
  showCloseButton = true,
  closeOnOverlay = true,
}) => {
  if (!isOpen) return null;

  const icons = {
    success: <CheckCircle className="w-16 h-16 text-green-500" />,
    error: <AlertCircle className="w-16 h-16 text-red-500" />,
    warning: <AlertTriangle className="w-16 h-16 text-yellow-500" />,
    info: <Info className="w-16 h-16 text-blue-500" />,
    confirm: <AlertTriangle className="w-16 h-16 text-government-blue" />,
  };

  const handleOverlayClick = (e) => {
    if (closeOnOverlay && e.target === e.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-kiosk-lg shadow-2xl max-w-lg w-full animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="relative p-6 pb-0">
          {showCloseButton && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          {type && icons[type] && (
            <div className="flex justify-center mb-6">
              {icons[type]}
            </div>
          )}
          
          {title && (
            <h2 className="text-kiosk-2xl font-bold text-gray-800 mb-4">
              {title}
            </h2>
          )}
          
          {message && (
            <p className="text-kiosk-lg text-gray-600 mb-6">
              {message}
            </p>
          )}
          
          {children}
        </div>

        {/* Actions */}
        {(confirmText || cancelText) && (
          <div className="p-6 bg-gray-50 flex flex-col sm:flex-row gap-4 justify-center">
            {cancelText && (
              <Button
                variant="secondary"
                onClick={onCancel || onClose}
                size="large"
                className="min-w-[150px]"
              >
                {cancelText}
              </Button>
            )}
            {confirmText && (
              <Button
                variant="primary"
                onClick={onConfirm}
                size="large"
                className="min-w-[150px]"
              >
                {confirmText}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
