import { useStore } from '../../store.js';
import { Toast } from './Toast.jsx';

export function Toaster() {
  const toasts = useStore((s) => s.toasts);
  return (
    <div
      style={{
        position:      'fixed',
        bottom:        88, // clears TaskDetailPanel/ApprovalDetailPanel's bottom-right "complete"/"approve" button
        right:         16,
        zIndex:        60,
        display:       'flex',
        flexDirection: 'column',
        gap:           8,
        alignItems:    'flex-end',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <Toast {...t} />
        </div>
      ))}
    </div>
  );
}
