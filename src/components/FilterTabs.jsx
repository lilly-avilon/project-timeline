import { useState } from 'react';
import { useTheme } from '../ThemeContext';

const TABS = [
  { id: 'all',      label: 'All',      color: null },
  { id: 'overdue',  label: 'Overdue',  color: '#dc2626', bg: 'rgba(220,38,38,0.10)',  border: 'rgba(220,38,38,0.25)' },
  { id: 'critical', label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.25)' },
  { id: 'moderate', label: 'Moderate', color: '#f97316', bg: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.25)' },
  { id: 'ontrack',  label: 'On Track', color: '#059669', bg: 'rgba(5,150,105,0.10)',  border: 'rgba(5,150,105,0.25)' },
];

export default function FilterTabs({ counts, total, active, onChange }) {
  const { theme } = useTheme();

  const tabCount = {
    all:      total,
    overdue:  counts.overdue  || 0,
    critical: counts.red      || 0,
    moderate: counts.orange   || 0,
    ontrack:  (counts.yellow  || 0) + (counts.green || 0),
  };

  return (
    <div style={{
      display: 'flex', gap: 6, flexWrap: 'wrap',
      marginBottom: 20,
    }}>
      {TABS.map(tab => (
        <Tab
          key={tab.id}
          tab={tab}
          count={tabCount[tab.id]}
          active={active === tab.id}
          onClick={() => onChange(tab.id)}
          theme={theme}
        />
      ))}
    </div>
  );
}

function Tab({ tab, count, active, onClick, theme }) {
  const [hov, setHov] = useState(false);

  const isColored = !!tab.color;
  const activeStyle = isColored
    ? { background: tab.bg, color: tab.color, border: `1.5px solid ${tab.border}` }
    : { background: 'rgba(99,102,241,0.12)', color: '#6366f1', border: '1.5px solid rgba(99,102,241,0.3)' };

  const inactiveStyle = {
    background: hov ? theme.divider : 'transparent',
    color: theme.text2,
    border: `1.5px solid ${hov ? theme.inputBorder : theme.divider}`,
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        height: 32, padding: '0 12px',
        borderRadius: 8,
        fontSize: 12, fontWeight: 700,
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'all 0.15s',
        ...(active ? activeStyle : inactiveStyle),
      }}
    >
      {tab.label}
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        minWidth: 18, height: 18, borderRadius: 99, padding: '0 5px',
        fontSize: 10, fontWeight: 800,
        background: active
          ? (isColored ? 'rgba(0,0,0,0.12)' : 'rgba(99,102,241,0.18)')
          : theme.divider,
        color: active
          ? (isColored ? tab.color : '#6366f1')
          : theme.text3,
        transition: 'all 0.15s',
      }}>
        {count}
      </span>
    </button>
  );
}
