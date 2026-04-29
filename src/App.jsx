import { useState, useSyncExternalStore } from 'react';
import { useWorkspace } from './hooks/useWorkspace';
import { getTotalDaysLeft, getUrgencyLevel } from './utils/countdown';
import { useTheme } from './ThemeContext';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import ProjectCard from './components/ProjectCard';
import ProjectForm from './components/ProjectForm';
import ShareButton from './components/ShareButton';
import FilterTabs from './components/FilterTabs';

const FILTER_MAP = {
  all:      null,
  overdue:  ['overdue'],
  critical: ['red'],
  moderate: ['orange'],
  ontrack:  ['yellow', 'green'],
};

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function useIsDesktop() {
  return useSyncExternalStore(
    cb => { window.addEventListener('resize', cb); return () => window.removeEventListener('resize', cb); },
    () => window.innerWidth >= 768,
  );
}

export default function App() {
  const { theme } = useTheme();
  const isDesktop = useIsDesktop();
  const {
    projects, loading, backendReady,
    workspaceId, viewOnly, isSharedRef, persist,
  } = useWorkspace();

  const [formOpen, setFormOpen]         = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const handleSave = (form) => {
    persist(editTarget
      ? projects.map(p => p.id === editTarget.id ? { ...form, id: editTarget.id } : p)
      : [...projects, { ...form, id: generateId(), createdAt: new Date().toISOString().slice(0, 10) }]
    );
    setFormOpen(false);
    setEditTarget(null);
  };

  const handleEdit   = (p)  => { setEditTarget(p); setFormOpen(true); };
  const handleDelete = (id) => { if (confirm('Delete this project?')) persist(projects.filter(p => p.id !== id)); };
  const handleAdd    = ()   => { setEditTarget(null); setFormOpen(true); };

  const sorted = [...projects].sort((a, b) =>
    getTotalDaysLeft(a.deadline) - getTotalDaysLeft(b.deadline)
  );

  const counts = projects.reduce((acc, p) => {
    const lv = getUrgencyLevel(getTotalDaysLeft(p.deadline));
    acc[lv] = (acc[lv] || 0) + 1;
    return acc;
  }, {});

  const filterLevels = FILTER_MAP[activeFilter];
  const filtered = filterLevels
    ? sorted.filter(p => filterLevels.includes(getUrgencyLevel(getTotalDaysLeft(p.deadline))))
    : sorted;

  const shareBtn = projects.length > 0
    ? <ShareButton workspaceId={backendReady ? workspaceId : null} projects={projects} />
    : null;

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: theme.bg, transition: 'background-color 0.2s' }}>
        {isDesktop && <Sidebar />}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <TopBar showLogo={!isDesktop} />
          <main style={{ flex: 1, padding: '28px 28px 60px' }}>
            {isSharedRef.current
              ? <SkeletonGrid theme={theme} />
              : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
                  <div style={{ fontSize: 14, color: theme.text3, fontWeight: 500 }}>Loading…</div>
                </div>
              )
            }
          </main>
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: theme.bg, transition: 'background-color 0.2s' }}>
      {isDesktop && <Sidebar />}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar onAdd={viewOnly ? null : handleAdd} showLogo={!isDesktop}>
          {shareBtn}
        </TopBar>

        <main style={{ flex: 1, padding: isDesktop ? '28px 32px 60px' : '20px 16px 60px' }}>

          {/* Banners */}
          {viewOnly && (
            <Banner
              color="#818cf8" bg="rgba(99,102,241,0.1)" border="rgba(99,102,241,0.25)"
              icon={<EyeIcon />}
              text={<><strong>Snapshot view</strong> — static copy. Ask the owner for a live link.</>}
            />
          )}
          {!viewOnly && isSharedRef.current && (
            <Banner
              color="#059669" bg="rgba(5,150,105,0.08)" border="rgba(5,150,105,0.2)"
              icon={<PeopleIcon />}
              text={<><strong>Shared workspace</strong> — live sync. Everyone with this link can add and edit.</>}
            />
          )}

          {/* Summary bar */}
          {projects.length > 0 && (
            <div style={{ marginBottom: 18, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: theme.summaryText, fontWeight: 600, marginRight: 4, transition: 'color 0.2s' }}>
                {projects.length} project{projects.length !== 1 ? 's' : ''}
              </span>
              {['overdue', 'red', 'orange', 'yellow', 'green'].map(lv =>
                counts[lv] ? <StatusPill key={lv} count={counts[lv]} u={theme.urgency[lv]} /> : null
              )}
            </div>
          )}

          {/* Filter tabs */}
          {projects.length > 0 && (
            <FilterTabs counts={counts} total={projects.length} active={activeFilter} onChange={setActiveFilter} />
          )}

          {/* Grid */}
          {projects.length === 0
            ? <EmptyState onAdd={handleAdd} viewOnly={viewOnly} theme={theme} />
            : filtered.length === 0
              ? (
                <div style={{ textAlign: 'center', padding: '60px 24px', fontSize: 14, color: theme.text3, fontWeight: 500 }}>
                  No projects in this category.
                </div>
              )
              : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 16,
                }}>
                  {filtered.map(p => (
                    <ProjectCard key={p.id} project={p} onEdit={handleEdit} onDelete={handleDelete} readOnly={viewOnly} />
                  ))}
                </div>
              )
          }
        </main>
      </div>

      {formOpen && (
        <ProjectForm
          project={editTarget}
          onSave={handleSave}
          onClose={() => { setFormOpen(false); setEditTarget(null); }}
        />
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Banner({ color, bg, border, icon, text }) {
  return (
    <div style={{
      marginBottom: 20,
      display: 'flex', alignItems: 'center', gap: 10,
      background: bg, border: `1.5px solid ${border}`,
      borderRadius: 12, padding: '11px 16px',
      fontSize: 13, fontWeight: 500, color,
    }}>
      <span style={{ flexShrink: 0, display: 'flex' }}>{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function SkeletonGrid({ theme }) {
  const slab = (w, h, extra = {}) => ({
    height: h, borderRadius: 6, background: theme.divider, width: w, ...extra,
  });
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="skeleton" style={{
          background: theme.card, borderRadius: 16,
          borderLeft: `4px solid ${theme.divider}`,
          boxShadow: theme.cardShadow,
          padding: '18px 20px 20px',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={slab('65%', 14)} />
          <div style={slab('40%', 10, { marginTop: 2 })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
            <div style={slab('100%', 76, { borderRadius: 10 })} />
            <div style={slab('100%', 76, { borderRadius: 10 })} />
          </div>
          <div style={slab('55%', 11, { marginTop: 4 })} />
          <div style={slab('45%', 11)} />
        </div>
      ))}
    </div>
  );
}

function StatusPill({ count, u }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      backgroundColor: u.light, color: u.text,
      border: `1.5px solid ${u.mid}`,
      borderRadius: 99, padding: '3px 10px 3px 7px',
      fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: u.primary, flexShrink: 0 }} />
      {count} {u.label.toLowerCase()}
    </span>
  );
}

function EmptyState({ onAdd, viewOnly, theme }) {
  const [hov, setHov] = useState(false);
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '80px 24px', textAlign: 'center',
    }}>
      <div style={{
        width: 68, height: 68, borderRadius: 18,
        background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(99,102,241,0.06) 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
        boxShadow: '0 4px 16px rgba(99,102,241,0.12)',
        border: '1px solid rgba(99,102,241,0.12)',
      }}>
        <svg width="30" height="30" fill="none" stroke="#6366f1" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 800, color: theme.text1, marginBottom: 8, letterSpacing: '-0.02em', transition: 'color 0.2s' }}>
        No projects yet
      </h3>
      <p style={{ fontSize: 14, color: theme.text3, maxWidth: 280, lineHeight: 1.65, marginBottom: 28, transition: 'color 0.2s' }}>
        {viewOnly
          ? 'This shared dashboard has no projects to display.'
          : 'Add your first project to start tracking deadlines and workday countdowns.'}
      </p>
      {!viewOnly && (
        <>
          <button
            onClick={onAdd}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: hov ? '#4338ca' : '#4f46e5',
              color: '#fff', border: 'none', borderRadius: 10,
              padding: '0 22px', height: 42,
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              transition: 'background 0.15s',
              boxShadow: '0 2px 10px rgba(79,70,229,0.3)',
              fontFamily: 'inherit', letterSpacing: '-0.01em',
            }}
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M12 4v16M4 12h16" />
            </svg>
            Add First Project
          </button>
          <p style={{ fontSize: 12, color: theme.text3, marginTop: 14, transition: 'color 0.2s' }}>
            Workday countdown excludes weekends + Thai public holidays
          </p>
        </>
      )}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}
