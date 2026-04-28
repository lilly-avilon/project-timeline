import { useState } from 'react';
import { format } from 'date-fns';
import { getTotalDaysLeft, getWorkdaysLeft, getUrgencyLevel, parseLocalDate } from '../utils/countdown';
import { useTheme } from '../ThemeContext';
import UrgencyBadge from './UrgencyBadge';

export default function ProjectCard({ project, onEdit, onDelete, readOnly }) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [hov, setHov] = useState(false);

  const totalDays = getTotalDaysLeft(project.deadline);
  const workdays  = getWorkdaysLeft(project.deadline);
  const level     = getUrgencyLevel(totalDays);
  const u         = theme.urgency[level];
  const absTotal  = Math.abs(totalDays);
  const deadline  = format(parseLocalDate(project.deadline), 'd MMM yyyy');

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: theme.card,
        borderRadius: 16,
        borderLeft: `5px solid ${u.primary}`,
        boxShadow: hov ? theme.cardShadowHover : theme.cardShadow,
        transform: hov ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease, background 0.2s',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <div style={{ padding: '18px 20px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
          <h2 style={{
            fontSize: 15, fontWeight: 700, color: theme.text1,
            lineHeight: 1.35, letterSpacing: '-0.01em',
            flex: 1, minWidth: 0,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            transition: 'color 0.2s',
          }}>
            {project.name}
          </h2>
          <div style={{ flexShrink: 0, marginTop: 1 }}>
            <UrgencyBadge level={level} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: theme.text3, transition: 'color 0.2s' }}>
          <CalendarIcon />
          <span>Deadline</span>
          <span style={{ color: theme.text2, fontWeight: 600 }}>{deadline}</span>
        </div>
      </div>

      {/* ── Countdown ── */}
      <div style={{ padding: '0 16px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <CountBox
          value={absTotal}
          label={totalDays < 0 ? 'days over' : 'total days'}
          color={u.primary}
          bg={u.gradient}
          border={u.mid}
        />
        <CountBox
          value={workdays}
          label="workdays left"
          color={u.primary}
          bg={u.gradient}
          border={u.mid}
        />
      </div>

      {/* ── Meta ── */}
      <div style={{ padding: '12px 20px', borderTop: `1px solid ${theme.divider}`, display: 'flex', flexDirection: 'column', gap: 8, transition: 'border-color 0.2s' }}>
        <MetaRow icon={<PersonIcon color={theme.text3} />} text={project.responsible} theme={theme} />
        <MetaRow icon={<DroneIcon color={theme.text3} />} text={`${project.droneCount} item${project.droneCount !== 1 ? 's' : ''} to send`} theme={theme} />
      </div>

      {/* ── Issues ── */}
      {project.issues && (
        <div style={{ padding: '0 20px 14px' }}>
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 600, color: '#d97706',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 0, width: '100%', textAlign: 'left',
              fontFamily: 'inherit',
            }}
          >
            <WarningIcon />
            <span style={{ flex: 1 }}>Issues noted</span>
            <ChevronIcon expanded={expanded} />
          </button>
          {expanded && (
            <div style={{
              marginTop: 8, fontSize: 12, color: theme.text2,
              lineHeight: 1.6,
              background: 'rgba(217,119,6,0.08)',
              border: '1px solid rgba(217,119,6,0.2)',
              borderRadius: 10, padding: '10px 12px',
              whiteSpace: 'pre-wrap',
              transition: 'color 0.2s',
            }}>
              {project.issues}
            </div>
          )}
        </div>
      )}

      {/* ── Footer ── */}
      {!readOnly && (
        <div style={{
          marginTop: 'auto',
          borderTop: `1px solid ${theme.divider}`,
          padding: '10px 20px',
          display: 'flex', justifyContent: 'flex-end', gap: 16,
          background: theme.footerBg,
          transition: 'background 0.2s, border-color 0.2s',
        }}>
          <ActionBtn label="Edit"   onClick={() => onEdit(project)}   hoverColor="#4f46e5" theme={theme} />
          <ActionBtn label="Delete" onClick={() => onDelete(project.id)} hoverColor="#ef4444" theme={theme} />
        </div>
      )}
    </div>
  );
}

function CountBox({ value, label, color, bg, border }) {
  return (
    <div style={{
      background: bg,
      borderRadius: 12,
      padding: '14px 10px 12px',
      textAlign: 'center',
      border: `1px solid ${border}`,
    }}>
      <div style={{
        fontSize: 48, fontWeight: 900, lineHeight: 1,
        color, letterSpacing: '-0.03em',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 10, fontWeight: 600, color: '#64748b',
        marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.05em',
      }}>
        {label}
      </div>
    </div>
  );
}

function MetaRow({ icon, text, theme }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: theme.text2, transition: 'color 0.2s' }}>
      <span style={{ display: 'flex', flexShrink: 0 }}>{icon}</span>
      <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</span>
    </div>
  );
}

function ActionBtn({ label, onClick, hoverColor, theme }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontSize: 12, fontWeight: 600,
        color: hov ? hoverColor : theme.text3,
        background: 'none', border: 'none',
        cursor: 'pointer', padding: '2px 4px',
        transition: 'color 0.15s', borderRadius: 4,
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  );
}

function CalendarIcon() {
  return (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
    </svg>
  );
}
function PersonIcon({ color }) {
  return (
    <svg width="14" height="14" fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20a7 7 0 0114 0" strokeLinecap="round" />
    </svg>
  );
}
function DroneIcon({ color }) {
  return (
    <svg width="14" height="14" fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );
}
function WarningIcon() {
  return (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}
function ChevronIcon({ expanded }) {
  return (
    <svg
      width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
      style={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
