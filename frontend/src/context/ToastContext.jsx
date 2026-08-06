import { createContext, useState, useCallback } from "react";

// Kontekst i provajder namjerno u istom fajlu — pravilo se tiče Fast Refresh-a, ne ispravnosti.
// eslint-disable-next-line react-refresh/only-export-components
export const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = "info") => {
    const id = ++idCounter;
    setToasts((current) => [...current, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}