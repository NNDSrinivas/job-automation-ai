import React, { createContext, useContext, useState, ReactNode } from 'react';
import Toast, { ToastProps } from './Toast';

export interface ToastData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  details?: string;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastData, 'id'>) => void;
  showSuccess: (message: string, details?: string) => void;
  showError: (message: string, details?: string) => void;
  showInfo: (message: string, details?: string) => void;
  showWarning: (message: string, details?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = (toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };

    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (message: string, details?: string) => {
    showToast({ message, type: 'success', details, duration: 5000 });
  };

  const showError = (message: string, details?: string) => {
    showToast({ message, type: 'error', details, duration: 7000 });
  };

  const showInfo = (message: string, details?: string) => {
    showToast({ message, type: 'info', details, duration: 5000 });
  };

  const showWarning = (message: string, details?: string) => {
    showToast({ message, type: 'warning', details, duration: 6000 });
  };

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo, showWarning }}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{
              transform: `translateY(${index * 8}px)`,
              zIndex: 1000 - index
            }}
          >
            <Toast
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              details={toast.details}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
