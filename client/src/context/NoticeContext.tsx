'use client';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle2, X } from 'lucide-react';
const NoticeContext = createContext<(message: string) => void>(() => {});
export function NoticeProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(''), 6000);
    return () => clearTimeout(timer);
  }, [message]);
  return (
    <NoticeContext.Provider value={setMessage}>
      {children}
      {message && (
        <div role="status" className="toast">
          <CheckCircle2 size={18} />
          <span>{message}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setMessage('')}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </NoticeContext.Provider>
  );
}
export const useNotice = () => useContext(NoticeContext);
