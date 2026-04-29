import { useState, useEffect, useSyncExternalStore } from 'react';
import { useTheme } from '../ThemeContext';

const EMPTY = { name: '', deadline: '', responsible: '', itemName: '', itemCount: 1, issues: '' };

export default function ProjectForm({ project, onSave, onClose }) {
  const { theme } = useTheme();
  const [form, setForm]     = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(project ? { ...project } : EMPTY);
    setErrors({});
  }, [project]);

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())        e.name       = 'Required';
    if (!form.deadline)           e.deadline   = 'Required';
    else if (form.deadline > maxDate) e.deadline = 'Date cannot be more than 10 years from now';
    if (!form.responsible.trim()) e.responsible = 'Required';
    if (!form.itemName.trim())    e.itemName   = 'Required';
    if (!form.itemCount || form.itemCount < 1) e.itemCount = 'Min 1';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(form);
  };

  const inp = (hasError) => ({
    width: '100%',
    border: `1.5px solid ${hasError ? '#f87171' : theme.inputBorder}`,
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 14,
    color: theme.inputText,
    background: hasError ? 'rgba(239,68,68,0.06)' : theme.inputBg,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s, background 0.2s, color 0.2s',
  });

  const desktop = useSyncExternalStore(
    cb => { window.addEventListener('resize', cb); return () => window.removeEventListener('resize', cb); },
    () => window.innerWidth >= 640,
  );

  const maxDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 10);
    return d.toISOString().slice(0, 10);
  })();

  return (
    <div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex',
        alignItems: desktop ? 'center' : 'flex-end',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: desktop ? 24 : 0,
      }}
    >
      <div
        className="modal-panel"
        onClick={e => e.stopPropagation()}
        style={{
          background: theme.modalBg,
          width: '100%', maxWidth: 480,
          maxHeight: '92vh', overflowY: 'auto',
          borderRadius: desktop ? 20 : '20px 20px 0 0',
          boxShadow: desktop ? '0 8px 40px rgba(0,0,0,0.3)' : '0 -4px 40px rgba(0,0,0,0.25)',
          transition: 'background 0.2s',
        }}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: theme.handleBar }} />
        </div>

        {/* Modal header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 24px 16px',
          borderBottom: `1px solid ${theme.divider}`,
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: theme.text1, letterSpacing: '-0.02em', transition: 'color 0.2s' }}>
              {project ? 'Edit Project' : 'New Project'}
            </div>
            <div style={{ fontSize: 12, color: theme.text3, marginTop: 2, transition: 'color 0.2s' }}>
              {project ? 'Update details below' : 'Fill in to start tracking'}
            </div>
          </div>
          <CloseBtn onClick={onClose} theme={theme} />
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Field label="Project Name" required error={errors.name} theme={theme}>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. Site Survey — Chiang Mai" autoFocus style={inp(!!errors.name)} />
          </Field>

          <Field label="Deadline Date" required error={errors.deadline} theme={theme}>
            <input type="date" value={form.deadline} max={maxDate}
              onChange={e => set('deadline', e.target.value)} style={inp(!!errors.deadline)} />
          </Field>

          <Field label="Responsible" required error={errors.responsible} theme={theme}>
            <input type="text" value={form.responsible} onChange={e => set('responsible', e.target.value)}
              placeholder="Name" style={inp(!!errors.responsible)} />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
            <Field label="Item Name" required error={errors.itemName} theme={theme}>
              <input type="text" value={form.itemName} onChange={e => set('itemName', e.target.value)}
                placeholder="e.g. Phantom 4 Pro" style={inp(!!errors.itemName)} />
            </Field>
            <Field label="Qty to Send" required error={errors.itemCount} theme={theme}>
              <input type="number" min={1} value={form.itemCount}
                onChange={e => {
                  const n = parseInt(e.target.value, 10);
                  set('itemCount', isNaN(n) ? '' : n);
                }} style={inp(!!errors.itemCount)} />
            </Field>
          </div>

          <Field label="Issues" hint="Optional" theme={theme}>
            <textarea value={form.issues} onChange={e => set('issues', e.target.value)}
              placeholder="Known blockers or risks…" rows={3}
              style={{ ...inp(false), resize: 'none', lineHeight: 1.6 }} />
          </Field>

          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <SecBtn onClick={onClose} theme={theme}>Cancel</SecBtn>
            <PriBtn type="submit">{project ? 'Save Changes' : 'Add Project'}</PriBtn>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, hint, error, theme, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: 11, fontWeight: 700, color: theme.text2,
        textTransform: 'uppercase', letterSpacing: '0.06em',
        display: 'flex', alignItems: 'center', gap: 4,
        transition: 'color 0.2s',
      }}>
        {label}
        {required && <span style={{ color: '#6366f1' }}>*</span>}
        {hint && <span style={{ color: theme.text3, fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>— {hint}</span>}
      </label>
      {children}
      {error && <span style={{ fontSize: 11, color: '#f87171', fontWeight: 600 }}>{error}</span>}
    </div>
  );
}

function CloseBtn({ onClick, theme }) {
  const [hov, setHov] = useState(false);
  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: 32, height: 32, borderRadius: 8,
        background: hov ? theme.divider : 'transparent',
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: theme.text3, transition: 'background 0.15s',
      }}
    >
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

function PriBtn({ children, type }) {
  const [hov, setHov] = useState(false);
  return (
    <button type={type} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, height: 44, borderRadius: 10,
        background: hov ? '#4338ca' : '#4f46e5',
        color: '#fff', border: 'none', cursor: 'pointer',
        fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em',
        transition: 'background 0.15s',
        boxShadow: '0 1px 4px rgba(79,70,229,0.3)',
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  );
}

function SecBtn({ children, onClick, theme }) {
  const [hov, setHov] = useState(false);
  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, height: 44, borderRadius: 10,
        background: hov ? theme.divider : 'transparent',
        color: theme.text2,
        border: `1.5px solid ${theme.inputBorder}`,
        cursor: 'pointer', fontSize: 14, fontWeight: 600,
        transition: 'background 0.15s, color 0.2s, border-color 0.2s',
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  );
}
