import { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { useShallow } from 'zustand/react/shallow';
import { Icon } from '../common/Icon.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { Pill } from '../common/Pill.jsx';
import { useStore } from '../../store.js';
import { formatDate } from '../../utils.js';
import { submitApprovalResponse } from '../../api/approvals.js';
import { respondToDemoApproval } from '../../api/demo.js';

const FIELD_LABEL = { fontSize: 12, color: 'var(--ink-3)', paddingTop: 3 };

const PRIORITY_TONE = { High: 'overdue', Medium: 'today', Low: 'soon' };

const RESPONSE_STYLE = {
  Approve: { background: 'var(--ok)',     shadow: '0 1px 0 oklch(0.35 0.12 152 / 0.25), inset 0 1px 0 oklch(1 0 0 / 0.15)', icon: 'check', busyLabel: 'Approving…' },
  Reject:  { background: 'var(--danger)', shadow: '0 1px 0 oklch(0.4 0.15 25 / 0.25), inset 0 1px 0 oklch(1 0 0 / 0.15)',  icon: 'x',     busyLabel: 'Rejecting…' },
};

export function ApprovalDetailPanel({ task }) {
  const { instance } = useMsal();
  const { setSelectedApproval, setData, addToast, approvalTasks, isDemo } = useStore(
    useShallow((s) => ({
      setSelectedApproval: s.setSelectedApproval,
      setData:             s.setData,
      addToast:            s.addToast,
      approvalTasks:       s.approvalTasks,
      isDemo:              s.isDemo,
    }))
  );

  const [comment, setComment]       = useState('');
  const [responding, setResponding] = useState(null); // null | response label being submitted

  const closePanel = () => setSelectedApproval(null);

  const props          = task.properties ?? {};
  const priority       = props.priority || 'Medium';
  const requestor      = props.principals?.find((p) => p.id === props.owner?.id);
  const requestorName  = requestor?.displayName ?? requestor?.email ?? 'Unknown';
  const requestorEmail = requestor?.email ?? '';
  const description    = typeof props.details === 'string' ? props.details : '';
  const itemLink       = props.item?.link ?? '';
  const itemLinkLabel  = props.item?.displayName || itemLink;
  const responseOptions = props.userRequest?.responseOptions ?? ['Approve', 'Reject'];

  const powerAutomateLink =
    `https://make.powerautomate.com/environments/${encodeURIComponent(task.environmentId)}` +
    `/approvals/received/${encodeURIComponent(task.name)}`;

  async function handleRespond(response) {
    setResponding(response);
    try {
      if (isDemo) {
        respondToDemoApproval(task);
      } else {
        await submitApprovalResponse(instance, task.environmentId, task.name, response, comment.trim());
        setData('approvalTasks', approvalTasks.filter((t) => t.name !== task.name));
      }
      addToast(`Task ${response.toLowerCase()}d.`, 'success');
      closePanel();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setResponding(null);
    }
  }

  const linkStyle = {
    display:       'inline-flex',
    alignItems:    'center',
    gap:           6,
    color:         'var(--accent-ink)',
    fontWeight:    500,
    borderBottom:  '1px solid var(--accent-edge)',
    paddingBottom: 1,
    wordBreak:     'break-all',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closePanel}
        style={{
          position:  'fixed',
          inset:     0,
          background:'oklch(0.15 0.01 260 / 0.18)',
          zIndex:    30,
          animation: 'fadeIn 140ms ease',
        }}
      />

      {/* Panel */}
      <aside
        style={{
          position:      'fixed',
          top:           0,
          right:         0,
          bottom:        0,
          width:         520,
          maxWidth:      '100vw',
          zIndex:        31,
          background:    'var(--surface)',
          borderLeft:    '1px solid var(--border)',
          boxShadow:     '-20px 0 50px oklch(0 0 0 / 0.08)',
          display:       'flex',
          flexDirection: 'column',
          animation:     'slideIn 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {/* Panel header */}
        <div
          style={{
            padding:      '14px 22px',
            borderBottom: '1px solid var(--border)',
            display:      'flex',
            alignItems:   'center',
            gap:          10,
          }}
        >
          <Pill tone={PRIORITY_TONE[priority] ?? 'neutral'}>{priority} priority</Pill>
          <div style={{ flex: 1 }} />
          <button onClick={closePanel} style={{ padding: 6, borderRadius: 6, color: 'var(--ink-3)' }}>
            <Icon n="x" size={16} />
          </button>
        </div>

        {/* Panel body */}
        <div style={{ flex: 1, padding: '20px 24px 0', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Title */}
          <h2
            style={{
              margin:        0,
              fontSize:      22,
              fontWeight:    600,
              letterSpacing: '-0.02em',
              lineHeight:    1.25,
              textWrap:      'pretty',
            }}
          >
            {props.title || 'Untitled approval'}
          </h2>

          {/* Metadata grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: 10, columnGap: 14, fontSize: 13 }}>
            <div style={FIELD_LABEL}>Requested by</div>
            <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Avatar name={requestorName} email={requestorEmail} size={20} />
                {requestorName}
              </span>
              {requestorEmail && (
                <span style={{ color: 'var(--ink-3)', fontSize: 12, marginLeft: 28 }}>{requestorEmail}</span>
              )}
            </div>

            <div style={FIELD_LABEL}>Environment</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon n="flow" size={13} style={{ color: 'var(--ink-3)' }} />
              {task.environmentName}
            </div>

            <div style={FIELD_LABEL}>Requested</div>
            <div>{formatDate(props.creationDate)}</div>

            {description && (
              <>
                <div style={FIELD_LABEL}>Details</div>
                <div style={{ color: 'var(--ink-2)', lineHeight: 1.55, textWrap: 'pretty', whiteSpace: 'pre-wrap' }}>
                  {description}
                </div>
              </>
            )}

            {itemLink && (
              <>
                <div style={FIELD_LABEL}>Item</div>
                <div>
                  <a href={itemLink} target="_blank" rel="noreferrer" style={linkStyle}>
                    <Icon n="link" size={12} />
                    {itemLinkLabel}
                  </a>
                </div>
              </>
            )}

            <div style={FIELD_LABEL}>Power Automate</div>
            <div>
              {isDemo ? (
                <span style={{ color: 'var(--ink-3)' }}>Not available in demo mode</span>
              ) : (
                <a href={powerAutomateLink} target="_blank" rel="noreferrer" style={linkStyle}>
                  <Icon n="arrowRight" size={12} />
                  Open this approval
                </a>
              )}
            </div>
          </div>

          {/* Comment */}
          <div>
            <div style={{ ...FIELD_LABEL, paddingTop: 0, marginBottom: 6 }}>Comment (optional)</div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a note for the requestor…"
              rows={3}
              style={{
                width:        '100%',
                resize:       'vertical',
                padding:      '9px 11px',
                borderRadius: 8,
                border:       '1px solid var(--border)',
                background:   'var(--surface-2)',
                fontSize:     13,
                fontFamily:   'inherit',
                color:        'var(--ink)',
              }}
            />
          </div>

          <div style={{ height: 24 }} />
        </div>

        {/* Panel footer */}
        <div
          style={{
            padding:    '12px 22px',
            borderTop:  '1px solid var(--border)',
            display:    'flex',
            gap:        8,
            background: 'var(--surface-2)',
          }}
        >
          <div style={{ flex: 1 }} />
          {responseOptions.map((option) => {
            const style = RESPONSE_STYLE[option] ?? {
              background: 'var(--ink-2)',
              shadow:     'inset 0 1px 0 oklch(1 0 0 / 0.1)',
              icon:       'check',
              busyLabel:  'Submitting…',
            };
            const busy = responding === option;
            return (
              <button
                key={option}
                onClick={() => handleRespond(option)}
                disabled={responding !== null}
                style={{
                  padding:     '9px 14px',
                  borderRadius:8,
                  background:  style.background,
                  color:       'white',
                  fontWeight:  600,
                  fontSize:    13.5,
                  display:     'inline-flex',
                  alignItems:  'center',
                  gap:         6,
                  boxShadow:   style.shadow,
                  opacity:     responding !== null && !busy ? 0.5 : 1,
                }}
              >
                <Icon n={style.icon} size={14} />
                {busy ? style.busyLabel : option}
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
}
