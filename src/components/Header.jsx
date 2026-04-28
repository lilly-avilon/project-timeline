import { useState } from 'react';
import { format } from 'date-fns';
import { useTheme } from '../ThemeContext';

export default function Header({ onAdd }) {
  const { theme, isDark, toggle } = useTheme();
  const today = format(new Date(), 'EEEE, d MMMM yyyy');

  return (
    <header style={{
      background: theme.header,
      borderBottom: `1px solid ${theme.headerBorder}`,
      position: 'sticky',
      top: 0,
      zIndex: 30,
      transition: 'background 0.2s, border-color 0.2s',
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '0 24px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>
        {/* Logo + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
          }}>
            <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2.5" />
              <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
              <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" strokeLinecap="round" strokeWidth="2.5" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: theme.text1, letterSpacing: '-0.02em', lineHeight: 1.2, transition: 'color 0.2s' }}>
              Project Timeline
            </div>
            <div style={{ fontSize: 11, color: theme.text3, fontWeight: 500, marginTop: 1, transition: 'color 0.2s' }}>{today}</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ThemeToggle isDark={isDark} toggle={toggle} theme={theme} />
          {onAdd && <AddButton onClick={onAdd} />}
        </div>
      </div>
    </header>
  );
}

function ThemeToggle({ isDark, toggle, theme }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={toggle}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        width: 36, height: 36, borderRadius: 10,
        background: hov ? theme.divider : 'transparent',
        border: `1.5px solid ${theme.headerBorder}`,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: theme.text2,
        transition: 'background 0.15s, border-color 0.15s',
        flexShrink: 0,
      }}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function AddButton({ onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        background: hov ? '#4338ca' : '#4f46e5',
        color: '#fff', border: 'none', borderRadius: 10,
        padding: '0 16px', height: 36,
        fontSize: 13, fontWeight: 700, cursor: 'pointer',
        transition: 'background 0.15s',
        boxShadow: '0 1px 4px rgba(79,70,229,0.3)',
        letterSpacing: '-0.01em', whiteSpace: 'nowrap',
        fontFamily: 'inherit',
      }}
    >
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" d="M12 4v16M4 12h16" />
      </svg>
      New Project
    </button>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}
