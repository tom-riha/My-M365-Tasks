import { useMsal } from '@azure/msal-react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '../../store.js';
import { Icon } from '../common/Icon.jsx';
import { Avatar } from '../common/Avatar.jsx';

export function Header({ onMenu, isMobile }) {
  const { instance, accounts } = useMsal();
  const { currentUser, isDemo } = useStore(
    useShallow((s) => ({ currentUser: s.currentUser, isDemo: s.isDemo }))
  );
  const account = accounts[0];

  async function handleSignOut() {
    // Demo mode never had a real MSAL session — a reload is enough to drop back
    // to the sign-in screen, since isDemo lives only in memory.
    if (isDemo) {
      location.reload();
      return;
    }
    try {
      await instance.logoutPopup({ account });
    } catch {
      instance.getAllAccounts().forEach((a) => instance.clearCache({ account: a }));
      location.reload();
    }
  }

  return (
    <header
      style={{
        height:     52,
        background: 'var(--header-bg)',
        color:      'oklch(0.97 0.005 250)',
        display:    'flex',
        alignItems: 'center',
        gap:        isMobile ? 6 : 16,
        padding:    isMobile ? '0 10px' : '0 20px',
        flexShrink: 0,
        zIndex:     20,
      }}
    >
      {/* Mobile hamburger */}
      {isMobile && (
        <button
          onClick={onMenu}
          aria-label="Menu"
          style={{ padding: 8, color: 'inherit', opacity: 0.85, borderRadius: 6 }}
        >
          <Icon n="filter" size={20} />
        </button>
      )}

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src="/assets/white_transparent.svg" alt="" width={34} height={34} style={{ flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.005em' }}>My M365 Tasks</span>
          {!isMobile && (
            <a
              href="https://workappholics.com"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 10.5, opacity: 0.6, fontFamily: 'var(--mono)' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; e.currentTarget.style.textDecoration = 'underline'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.6; e.currentTarget.style.textDecoration = 'none'; }}
            >
              by workappholics.com
            </a>
          )}
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* User */}
      <div
        style={{
          display:    'flex',
          alignItems: 'center',
          gap:        10,
          paddingLeft: isMobile ? 0 : 10,
          borderLeft: isMobile ? 'none' : '1px solid oklch(1 0 0 / 0.1)',
          marginLeft: 4,
        }}
      >
        {!isMobile && currentUser.name && (
          <div style={{ textAlign: 'right', lineHeight: 1.15 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500 }}>{currentUser.name}</div>
            <div style={{ fontSize: 10.5, opacity: 0.6, fontFamily: 'var(--mono)' }}>{currentUser.email}</div>
          </div>
        )}
        <button onClick={handleSignOut} title={isDemo ? 'Exit demo' : 'Sign out'}>
          <Avatar name={currentUser.name} email={currentUser.email} size={isMobile ? 28 : 30} />
        </button>
      </div>
    </header>
  );
}
