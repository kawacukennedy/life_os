import React, { createContext, useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString();
    const toast: Toast = { id, message, type };
    setToasts(prev => [...prev, toast]);

    // Auto remove after 3 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const value: ToastContextType = {
    toasts,
    addToast,
    removeToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container */}
      <View style={styles.toastContainer}>
        {toasts.map(toast => (
          <View key={toast.id} style={[styles.toast, styles[toast.type]]}>
            <Text style={styles.toastText}>{toast.message}</Text>
            <TouchableOpacity onPress={() => removeToast(toast.id)}>
              <Text style={styles.closeButton}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  success: {
    backgroundColor: '#10b981',
  },
  error: {
    backgroundColor: '#ef4444',
  },
  info: {
    backgroundColor: '#3b82f6',
  },
  toastText: {
    color: 'white',
    flex: 1,
    fontSize: 14,
  },
  closeButton: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
});