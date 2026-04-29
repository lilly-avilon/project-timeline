import { useState } from 'react';
import { useTheme } from '../ThemeContext';

const STATUS_LEGEND = [
  { label: 'Overdue',  color: '#dc2626' },
  { label: 'Critical', color: '#ef4444' },
  { label: 'At Risk',  color: '#f97316' },
  { label: 'On Track', color: '#d97706' },
  { label: 'Healthy',  color: '#059669' },
];

export default function Sidebar() {
  const { theme, isDark, toggle } = useTheme();

  return (
    <aside style={{
      width: 240,
      height: '100vh',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      background: theme.sidebar,
      borderRight: `1px solid ${theme.sidebarBorder}`,
      overflowY: 'auto',
      transition: 'background 0.2s, border-color 0.2s',
    }}>

      {/* Logo */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: `1px solid ${theme.sidebarBorder}`,
        transition: 'border-color 0.2s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
          }}>
            <svg width="17" height="17" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2.5" />
              <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
              <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" strokeLinecap="round" strokeWidth="2.5" />
            </svg>
          </div>
          <div>
            <div style={{
              fontSize: 13, fontWeight: 800, color: theme.text1,
              letterSpacing: '-0.02em', lineHeight: 1.2,
              transition: 'color 0.2s',
            }}>
              Project Timeline
            </div>
            <div style={{ fontSize: 10, color: theme.text3, fontWeight: 500, marginTop: 1, transition: 'color 0.2s' }}>
              Team Workspace
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        <SectionLabel theme={theme}>Navigation</SectionLabel>
        <NavItem active theme={theme} icon={<GridIcon />}>Dashboard</NavItem>

        {/* Status legend */}
        <div style={{ marginTop: 28 }}>
          <SectionLabel theme={theme}>Status</SectionLabel>
          {STATUS_LEGEND.map(s => (
            <div key={s.label} style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '5px 8px', borderRadius: 6,
              fontSize: 12, fontWeight: 500, color: theme.text2,
              transition: 'color 0.2s',
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                backgroundColor: s.color, flexShrink: 0,
              }} />
              {s.label}
            </div>
          ))}
        </div>
      </nav>

      {/* Bottom: theme toggle */}
      <div style={{
        padding: '12px',
        borderTop: `1px solid ${theme.sidebarBorder}`,
        transition: 'border-color 0.2s',
      }}>
        <ThemeToggleBtn isDark={isDark} toggle={toggle} theme={theme} />
      </div>
    </aside>
  );
}

function SectionLabel({ theme, children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: theme.text3,
      letterSpacing: '0.07em', textTransform: 'uppercase',
      padding: '0 8px', marginBottom: 6,
      transition: 'color 0.2s',
    }}>
      {children}
    </div>
  );
}

function NavItem({ active, theme, icon, children }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '8px', borderRadius: 8, marginBottom: 2,
        fontSize: 13, fontWeight: active ? 700 : 500,
        cursor: 'pointer',
        background: active ? theme.navActiveBg : (hov ? theme.navHoverBg : 'transparent'),
        color: active ? theme.navActiveText : theme.text2,
        transition: 'all 0.15s',
      }}
    >
      <span style={{ display: 'flex', flexShrink: 0, opacity: active ? 1 : 0.65 }}>{icon}</span>
      <span style={{ flex: 1 }}>{children}</span>
      {active && (
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          backgroundColor: theme.navActiveText, flexShrink: 0,
        }} />
      )}
    </div>
  );
}

function ThemeToggleBtn({ isDark, toggle, theme }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={toggle}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        width: '100%', padding: '8px', borderRadius: 8,
        background: hov ? theme.navHoverBg : 'transparent',
        border: 'none', cursor: 'pointer',
        color: theme.text2, fontSize: 12, fontWeight: 600,
        fontFamily: 'inherit', transition: 'background 0.15s, color 0.2s',
      }}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
      {isDark ? 'Light mode' : 'Dark mode'}
    </button>
  );
}

function GridIcon() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}
