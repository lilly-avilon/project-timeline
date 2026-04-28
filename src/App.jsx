import { useState, useEffect, useRef, useCallback } from 'react';
import { loadProjects, saveProjects, getWorkspaceId, getWorkspaceIdFromUrl, decodeProjectsFromUrl } from './utils/storage';
import { saveProjectsToDB, hasBackend, subscribeToProjects } from './utils/database';
import { getTotalDaysLeft, getUrgencyLevel } from './utils/countdown';
import { useTheme } from './ThemeContext';
import Header from './components/Header';
import ProjectCard from './components/ProjectCard';
import ProjectForm from './components/ProjectForm';
import ShareButton from './components/ShareButton';
import FilterTabs from './components/FilterTabs';

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function migrateProject(p) {
  if (p.itemName !== undefined) return p;
  return { ...p, itemName: 'items', itemCount: p.droneCount ?? 1 };
}

export default function App() {
  const { theme } = useTheme();
  const [projects, setProjects]     = useState([]);
  const [formOpen, setFormOpen]     = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [viewOnly, setViewOnly]         = useState(false);
  const [workspaceId, setWorkspaceId]   = useState(null);
  const [backendReady, setBackendReady] = useState(false);
  const [loading, setLoading]           = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const unsubRef       = useRef(null);
  const lastWriteIdRef = useRef(null); // echo suppression: stores writeId of our last save
  const isSharedRef    = useRef(false); // true when viewing a ?ws= shared link

  useEffect(() => {
    async function init() {
      const sharedWsId = getWorkspaceIdFromUrl();
      isSharedRef.current = !!sharedWsId;

      // Path 1: URL-encoded snapshot (?data=...) — static, no Firestore needed
      const snapshotData = decodeProjectsFromUrl();
      if (snapshotData) {
        setViewOnly(true);
        setProjects(snapshotData.map(migrateProject));
        setLoading(false);
        return;
      }

      const wsId    = sharedWsId ?? getWorkspaceId();
      const isShared = !!sharedWsId;
      setWorkspaceId(wsId);

      if (!hasBackend) {
        if (!isShared) setProjects(loadProjects().map(migrateProject));
        setLoading(false);
        return;
      }

      if (!isShared) {
        // Own workspace: show localStorage content instantly, Firestore syncs in background
        setProjects(loadProjects().map(migrateProject));
        setLoading(false);
      }

      unsubRef.current = subscribeToProjects(
        wsId,
        async (data, incomingWriteId) => {
          setBackendReady(true);

          // Suppress echo of our own save — we already updated state optimistically
          const isEcho = incomingWriteId !== null && incomingWriteId === lastWriteIdRef.current;
          lastWriteIdRef.current = null;

          if (!isEcho) {
            // Only update state if Firestore has data, or this is a shared workspace
            // (avoids wiping localStorage content when Firestore doc is empty on own workspace)
            if (data.length > 0 || isShared) {
              setProjects(data.map(migrateProject));
            }
          }

          // First-time migration: own workspace, Firestore empty, localStorage has data
          if (!isShared && data.length === 0) {
            const local = loadProjects().map(migrateProject);
            if (local.length > 0) {
              const wid = await saveProjectsToDB(wsId, local);
              if (wid) lastWriteIdRef.current = wid; // suppress migration echo
            }
          }

          setLoading(false);
        },
        () => setLoading(false),
      );
    }

    init();

    return () => { if (unsubRef.current) unsubRef.current(); };
  }, []);

  const persist = useCallback(async (updated) => {
    setProjects(updated); // optimistic update — UI responds immediately
    if (backendReady && workspaceId) {
      const writeId = await saveProjectsToDB(workspaceId, updated);
      if (writeId) {
        lastWriteIdRef.current = writeId; // tell onSnapshot to skip this echo
      } else {
        saveProjects(updated); // cloud write failed, keep it in localStorage
      }
    } else {
      saveProjects(updated);
    }
  }, [backendReady, workspaceId]);

  const handleSave = (form) => {
    if (editTarget) {
      persist(projects.map(p => p.id === editTarget.id ? { ...form, id: editTarget.id } : p));
    } else {
      persist([...projects, { ...form, id: generateId(), createdAt: new Date().toISOString().slice(0, 10) }]);
    }
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

  const FILTER_LEVELS = {
    overdue:  ['overdue'],
    critical: ['red'],
    moderate: ['orange'],
    ontrack:  ['yellow', 'green'],
  };

  const filtered = activeFilter === 'all'
    ? sorted
    : sorted.filter(p =>
        FILTER_LEVELS[activeFilter].includes(
          getUrgencyLevel(getTotalDaysLeft(p.deadline))
        )
      );

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: theme.bg, transition: 'background-color 0.2s' }}>
        {isSharedRef.current && <Header onAdd={null} />}
        <main style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px 60px' }}>
          {isSharedRef.current
            ? <SkeletonGrid theme={theme} />
            : (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh',
              }}>
                <div style={{ fontSize: 14, color: theme.text3, fontWeight: 500 }}>Loading…</div>
              </div>
            )
          }
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, transition: 'background-color 0.2s' }}>
      <Header onAdd={viewOnly ? null : handleAdd} />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px 60px' }}>

        {/* Shared-view banner (URL snapshot — truly read-only) */}
        {viewOnly && (
          <div style={{
            marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(99,102,241,0.1)',
            border: '1.5px solid rgba(99,102,241,0.25)',
            borderRadius: 12, padding: '12px 16px',
            fontSize: 13, fontWeight: 500, color: '#818cf8',
          }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span><strong>Snapshot view</strong> — this is a static copy. Ask for a live link to see real-time data.</span>
          </div>
        )}

        {/* Collaborative shared workspace banner — shown for ?ws= links */}
        {!viewOnly && isSharedRef.current && (
          <div style={{
            marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(5,150,105,0.08)',
            border: '1.5px solid rgba(5,150,105,0.2)',
            borderRadius: 12, padding: '12px 16px',
            fontSize: 13, fontWeight: 500, color: '#059669',
          }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            <span><strong>Shared workspace</strong> — live sync. Everyone with this link can add and edit projects.</span>
          </div>
        )}

        {/* Summary bar */}
        {projects.length > 0 && (
          <div style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: theme.summaryText, fontWeight: 600, marginRight: 4, transition: 'color 0.2s' }}>
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </span>
            {['overdue', 'red', 'orange', 'yellow', 'green'].map(lv =>
              counts[lv] ? (
                <StatusPill key={lv} count={counts[lv]} u={theme.urgency[lv]} />
              ) : null
            )}
            <div style={{ marginLeft: 'auto' }}>
              <ShareButton workspaceId={backendReady ? workspaceId : null} projects={projects} />
            </div>
          </div>
        )}

        {/* Filter tabs — only show when there are projects */}
        {projects.length > 0 && (
          <FilterTabs
            counts={counts}
            total={projects.length}
            active={activeFilter}
            onChange={setActiveFilter}
          />
        )}

        {/* Grid or empty */}
        {projects.length === 0
          ? <EmptyState onAdd={handleAdd} viewOnly={viewOnly} theme={theme} />
          : filtered.length === 0
            ? (
              <div style={{
                textAlign: 'center', padding: '60px 24px',
                fontSize: 14, color: theme.text3, fontWeight: 500,
              }}>
                No projects in this category.
              </div>
            )
            : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(268px, 1fr))',
                gap: 16,
              }}>
                {filtered.map(p => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    readOnly={viewOnly}
                  />
                ))}
              </div>
            )
        }
      </main>

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

function SkeletonGrid({ theme }) {
  const slab = (w, h, extra = {}) => ({
    height: h, borderRadius: 6, background: theme.divider, width: w, ...extra,
  });
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(268px, 1fr))', gap: 16 }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="skeleton" style={{
          background: theme.card, borderRadius: 16,
          borderLeft: `5px solid ${theme.divider}`,
          boxShadow: theme.cardShadow,
          padding: '18px 20px 20px',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={slab('65%', 14)} />
          <div style={slab('40%', 10, { marginTop: 2 })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
            <div style={slab('100%', 80, { borderRadius: 12 })} />
            <div style={slab('100%', 80, { borderRadius: 12 })} />
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
        width: 72, height: 72, borderRadius: 20,
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0.08) 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
        boxShadow: '0 4px 16px rgba(99,102,241,0.15)',
        border: '1px solid rgba(99,102,241,0.15)',
      }}>
        <svg width="32" height="32" fill="none" stroke="#6366f1" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          <path strokeLinecap="round" d="M12 12v3m0 0l-1.5-1.5M12 15l1.5-1.5" />
        </svg>
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: theme.text1, marginBottom: 8, letterSpacing: '-0.02em', transition: 'color 0.2s' }}>
        No projects yet
      </h3>
      <p style={{ fontSize: 14, color: theme.text3, maxWidth: 300, lineHeight: 1.65, marginBottom: 28, transition: 'color 0.2s' }}>
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
              color: '#fff', border: 'none', borderRadius: 12,
              padding: '0 24px', height: 44,
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              transition: 'background 0.15s',
              boxShadow: '0 2px 12px rgba(79,70,229,0.35)',
              fontFamily: 'inherit', letterSpacing: '-0.01em',
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M12 4v16M4 12h16" />
            </svg>
            Add First Project
          </button>
          <p style={{ fontSize: 12, color: theme.text3, marginTop: 16, transition: 'color 0.2s' }}>
            Workday countdown excludes weekends + Thai public holidays
          </p>
        </>
      )}
    </div>
  );
}
