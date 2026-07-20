import { useToast } from "../hooks/useToast";

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.type}`}>
          <span>{toast.message}</span>
          <button className="toast__close" onClick={() => removeToast(toast.id)} aria-label="Zatvori obavještenje">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}