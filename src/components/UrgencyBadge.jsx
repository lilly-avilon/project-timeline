import { useTheme } from '../ThemeContext';

export default function UrgencyBadge({ level }) {
  const { theme } = useTheme();
  const u = theme.urgency[level];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      backgroundColor: u.light,
      color: u.text,
      border: `1.5px solid ${u.mid}`,
      borderRadius: 99,
      padding: '3px 10px 3px 7px',
      fontSize: 11, fontWeight: 700,
      letterSpacing: '0.02em', whiteSpace: 'nowrap', lineHeight: 1.6,
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        backgroundColor: u.primary,
        display: 'inline-block', flexShrink: 0,
        boxShadow: `0 0 0 2px ${u.mid}`,
      }} />
      {u.label}
    </span>
  );
}
