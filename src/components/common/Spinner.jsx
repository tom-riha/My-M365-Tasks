export function Spinner({ size = 'md' }) {
  const dim = { sm: 16, md: 32, lg: 48 }[size];
  const bw  = { sm: 2,  md: 3,  lg: 4  }[size];
  return (
    <div
      style={{
        width:        dim,
        height:       dim,
        borderRadius: '50%',
        border:       `${bw}px solid var(--border)`,
        borderTopColor: 'var(--accent)',
        animation:    'spin 0.8s linear infinite',
      }}
    />
  );
}

// Global spin keyframe (also defined here for standalone use)
const style = document.createElement('style');
style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(style);
