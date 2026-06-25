interface ToastProps {
  message: string | null;
}

export function Toast({ message }: ToastProps) {
  return (
    <div className={`toast ${message ? "visible" : ""}`}>
      <span className="toast-icon">✓</span>
      {message}
    </div>
  );
}
