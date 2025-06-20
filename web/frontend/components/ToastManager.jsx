import { Toast } from "@shopify/polaris";
import { useState, useEffect } from "react";

export function ToastManager({ toasts, onDismiss }) {
  const [visibleToasts, setVisibleToasts] = useState([]);

  useEffect(() => {
    if (toasts.length > 0) {
      // Add timestamps and unique IDs to toasts
      const newToasts = toasts.map((toast, index) => ({
        id: `toast-${Date.now()}-${index}`,
        message: toast,
        timestamp: new Date(),
        dismissed: false,
      }));

      setVisibleToasts((prev) => [...prev, ...newToasts]);
    }
  }, [toasts]);

  const handleDismiss = (toastId) => {
    setVisibleToasts((prev) =>
      prev.map((toast) =>
        toast.id === toastId ? { ...toast, dismissed: true } : toast
      )
    );

    // Remove dismissed toast after animation
    setTimeout(() => {
      setVisibleToasts((prev) => prev.filter((toast) => toast.id !== toastId));
    }, 300);
  };

  const handleDismissAll = () => {
    setVisibleToasts([]);
    if (onDismiss) onDismiss();
  };

  return (
    <div
      style={{ position: "fixed", top: "20px", right: "20px", zIndex: 1000 }}
    >
      {visibleToasts.length > 1 && (
        <div style={{ marginBottom: "10px" }}>
          <button
            style={{
              background: "#007ace",
              color: "white",
              border: "none",
              padding: "8px 12px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
            }}
            onClick={handleDismissAll}
          >
            Dismiss All ({visibleToasts.length})
          </button>
        </div>
      )}

      {visibleToasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            marginBottom: "8px",
            transform: `translateY(${index * 60}px)`,
            transition: "all 0.3s ease",
            opacity: toast.dismissed ? 0 : 1,
          }}
        >
          <Toast
            content={toast.message}
            onDismiss={() => handleDismiss(toast.id)}
            duration={
              toast.message.includes("Error") ||
              toast.message.includes("Failed")
                ? 8000
                : 4000
            }
            error={
              toast.message.includes("Error") ||
              toast.message.includes("Failed") ||
              toast.message.includes("⚠")
            }
          />
        </div>
      ))}
    </div>
  );
}

export function useToastManager() {
  const [toasts, setToasts] = useState([]);
  const [pendingToasts, setPendingToasts] = useState([]);

  const addToast = (message) => {
    if (typeof message === "string" && message.trim()) {
      setPendingToasts((prev) => [...prev, message]);
    }
  };

  const addToasts = (messages) => {
    const validMessages = messages.filter(
      (msg) => typeof msg === "string" && msg.trim()
    );
    if (validMessages.length > 0) {
      setPendingToasts((prev) => [...prev, ...validMessages]);
    }
  };

  const flushToasts = () => {
    if (pendingToasts.length > 0) {
      setToasts(pendingToasts);
      setPendingToasts([]);
    }
  };

  const clearAllToasts = () => {
    setToasts([]);
    setPendingToasts([]);
  };

  return {
    toasts,
    addToast,
    addToasts,
    flushToasts,
    clearAllToasts,
  };
}
