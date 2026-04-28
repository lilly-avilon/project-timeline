import { useState } from 'react';
import { buildShareUrl, encodeProjectsToUrl } from '../utils/storage';
import { useTheme } from '../ThemeContext';

export default function ShareButton({ workspaceId, projects }) {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [hov, setHov] = useState(false);

  const handleCopy = async () => {
    const url = workspaceId
      ? buildShareUrl(workspaceId)
      : encodeProjectsToUrl(projects);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (copied) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        background: 'rgba(52,211,153,0.12)', color: '#34d399',
        border: '1.5px solid rgba(52,211,153,0.25)',
        borderRadius: 10, padding: '0 14px', height: 36,
        fontSize: 13, fontWeight: 700, userSelect: 'none',
        fontFamily: 'inherit',
      }}>
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Link copied!
      </div>
    );
  }

  return (
    <button
      onClick={handleCopy}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        background: hov ? theme.divider : 'transparent',
        color: hov ? '#6366f1' : theme.text2,
        border: `1.5px solid ${hov ? '#c7d2fe' : theme.inputBorder}`,
        borderRadius: 10, padding: '0 14px', height: 36,
        fontSize: 13, fontWeight: 700, cursor: 'pointer',
        transition: 'all 0.15s', fontFamily: 'inherit',
      }}
    >
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      Share
    </button>
  );
}
