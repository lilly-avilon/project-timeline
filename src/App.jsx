import { useState, useEffect, useCallback } from 'react';
import { loadProjects, saveProjects, getWorkspaceId, getWorkspaceIdFromUrl } from './utils/storage';
import { fetchProjects, saveProjectsToDB, hasBackend } from './utils/database';
import { getTotalDaysLeft, getUrgencyLevel } from './utils/countdown';
import { useTheme } from './ThemeContext';
import Header from './components/Header';
import ProjectCard from './components/ProjectCard';
import ProjectForm from './components/ProjectForm';
import ShareButton from './components/ShareButton';

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

  useEffect(() => {
    async function init() {
      const sharedWsId = getWorkspaceIdFromUrl();

      if (hasBackend) {
        if (sharedWsId) {
          // Viewing someone else's workspace — read-only
          setViewOnly(true);
          setWorkspaceId(sharedWsId);
          const data = await fetchProjects(sharedWsId);
          if (data !== null) {
            setBackendReady(true);
            setProjects(data.map(migrateProject));
          }
          // If fetch failed, show empty read-only view (Firestore not set up yet)
        } else {
          // Own workspace
          const myId = getWorkspaceId();
          setWorkspaceId(myId);
          const data = await fetchProjects(myId);
          if (data !== null) {
            // Firestore is live — use it
            setBackendReady(true);
            setProjects(data.map(migrateProject));
          } else {
            // Firestore unavailable — fall back to localStorage
            setProjects(loadProjects().map(migrateProject));
          }
        }
      } else {
        // No Firebase keys — localStorage only
        setProjects(loadProjects().map(migrateProject));
      }
      setLoading(false);
    }
    init();
  }, []);

  const persist = useCallback(async (updated) => {
    setProjects(updated);
    if (viewOnly) return;
    if (backendReady && workspaceId) {
      const saved = await saveProjectsToDB(workspaceId, updated);
      if (!saved) saveProjects(updated); // safety net: always persist locally if cloud fails
    } else {
      saveProjects(updated);
    }
  }, [viewOnly, backendReady, workspaceId]);

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

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: theme.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background-color 0.2s',
      }}>
        <div style={{ fontSize: 14, color: theme.text3, fontWeight: 500 }}>Loading…</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, transition: 'background-color 0.2s' }}>
      <Header onAdd={viewOnly ? null : handleAdd} />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px 60px' }}>

        {/* Shared-view banner */}
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
            <span><strong>Shared view</strong> — read only. Data updates live whenever the owner makes changes.</span>
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

        {/* Grid or empty */}
        {projects.length === 0
          ? <EmptyState onAdd={handleAdd} viewOnly={viewOnly} theme={theme} />
          : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(268px, 1fr))',
              gap: 16,
            }}>
              {sorted.map(p => (
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
