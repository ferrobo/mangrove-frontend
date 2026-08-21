import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Clock,
  Send,
  FlaskConical,
  Eye,
  EyeOff,
  RefreshCw,
  Check,
  X,
} from 'lucide-react';
import {
  getReviewQueue,
  getReviewIncident,
  getReviewPhoto,
  triageIncident,
} from '@/lib/api';
import {
  STATUS_LABELS,
  COVERAGE_LABELS,
  VEGETATION_OPTIONS,
  WATER_OPTIONS,
  IMAGE_QUALITY_OPTIONS,
  SPRING,
} from '@/lib/constants';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const MAX_NOTES = 1000;

// State machine: which actions are allowed from each status
const ALLOWED_ACTIONS = {
  submitted: ['under_review', 'dismissed'],
  under_review: ['forwarded', 'dismissed'],
  forwarded: [],
  dismissed: [],
};

const ACTION_LABELS = {
  under_review: 'Allow into review',
  forwarded: 'Forward',
  dismissed: 'Dismiss',
};

export default function Review() {
  const reduced = useReducedMotion();
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authing, setAuthing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [queue, setQueue] = useState(null);
  const [queueError, setQueueError] = useState(null);
  const [selectedUuid, setSelectedUuid] = useState(null);
  const [incident, setIncident] = useState(null);
  const [incidentLoading, setIncidentLoading] = useState(false);
  const [incidentError, setIncidentError] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);

  const [reviewerNotes, setReviewerNotes] = useState('');
  const [triaging, setTriaging] = useState(false);
  const [triageError, setTriageError] = useState(null);

  const photoUrlRef = useRef(null);

  // Authenticate + load queue
  const handleAuth = async (e) => {
    e?.preventDefault();
    if (!password) return;
    setAuthing(true);
    setAuthError(null);
    try {
      const q = await getReviewQueue(password);
      setQueue(q);
      setAuthed(true);
    } catch (err) {
      setAuthError(
        err.status === 401 || err.status === 403
          ? 'Incorrect password.'
          : err.message || 'Authentication failed'
      );
    } finally {
      setAuthing(false);
    }
  };

  const refreshQueue = useCallback(async () => {
    if (!password) return;
    try {
      const q = await getReviewQueue(password);
      setQueue(q);
    } catch (err) {
      setQueueError(err.message || 'Failed to refresh queue');
    }
  }, [password]);

  // Load incident detail
  const loadIncident = useCallback(
    async (uuid) => {
      if (!password || !uuid) return;
      setSelectedUuid(uuid);
      setIncident(null);
      setIncidentError(null);
      setIncidentLoading(true);
      setReviewerNotes('');
      setTriageError(null);

      // Cleanup previous photo URL
      if (photoUrlRef.current) {
        URL.revokeObjectURL(photoUrlRef.current);
        photoUrlRef.current = null;
        setPhotoUrl(null);
      }

      try {
        const data = await getReviewIncident(uuid, password);
        setIncident(data);
        setReviewerNotes(data.reviewer_notes || '');

        // Fetch protected photo
        if (data.review_photo_url !== undefined) {
          try {
            const blob = await getReviewPhoto(uuid, password);
            const url = URL.createObjectURL(blob);
            photoUrlRef.current = url;
            setPhotoUrl(url);
          } catch {
            // Photo optional — leave null
          }
        }
      } catch (err) {
        setIncidentError(err.message || 'Failed to load incident');
      } finally {
        setIncidentLoading(false);
      }
    },
    [password]
  );

  // Cleanup photo URL on unmount
  useEffect(() => {
    return () => {
      if (photoUrlRef.current) {
        URL.revokeObjectURL(photoUrlRef.current);
      }
    };
  }, []);

  // Cleanup photo when selecting a different incident
  useEffect(() => {
    return () => {
      if (photoUrlRef.current) {
        URL.revokeObjectURL(photoUrlRef.current);
        photoUrlRef.current = null;
      }
    };
  }, [selectedUuid]);

  // Triage action
  const handleTriage = async (newStatus) => {
    if (!selectedUuid || !password) return;
    setTriaging(true);
    setTriageError(null);
    try {
      const updated = await triageIncident(selectedUuid, password, {
        status: newStatus,
        reviewer_notes: reviewerNotes.slice(0, MAX_NOTES) || null,
      });
      // Update incident in state
      setIncident((prev) => (prev ? { ...prev, ...updated, status: newStatus } : prev));
      // Refresh queue
      refreshQueue();
    } catch (err) {
      setTriageError(err.message || 'Triage action failed');
    } finally {
      setTriaging(false);
    }
  };

  const dur = reduced ? 0.01 : 0.4;

  // ===== PASSWORD GATE =====
  if (!authed) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center px-6 pt-20">
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur, ease: SPRING }}
          className="w-full max-w-md"
        >
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/40">
              <Lock size={22} className="text-zinc-400" />
            </div>
            <p className="label-eyebrow mb-3">Review access</p>
            <h1 className="display-text text-3xl text-zinc-50 sm:text-4xl">
              Reviewer sign-in
            </h1>
            <p className="mt-4 text-sm text-zinc-400">
              Enter the review password to access the private triage queue.
            </p>
          </div>

          <form onSubmit={handleAuth} className="mt-8 space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Review password"
                autoFocus
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 pr-12 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors focus:border-signal-400/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {authError && (
              <p className="flex items-center gap-2 text-xs text-red-400">
                <AlertCircle size={13} />
                {authError}
              </p>
            )}
            <button type="submit" disabled={authing || !password} className="btn-primary w-full">
              {authing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Authenticating…
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Access review queue
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-zinc-600">
            Password is not stored persistently. It is sent per request as a header.
          </p>
        </motion.div>
      </div>
    );
  }

  // ===== REVIEW QUEUE + DETAIL =====
  const queueItems = Array.isArray(queue) ? queue : queue?.incidents || [];

  return (
    <motion.div
      className="pt-20"
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0.01 : 0.4, ease: SPRING }}
    >
      <div className="container-edge py-8 sm:py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="label-eyebrow mb-3">Review queue</p>
            <h1 className="display-text text-3xl text-zinc-50 sm:text-4xl">
              Triage
            </h1>
          </div>
          <button onClick={refreshQueue} className="btn-ghost">
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {queueError && (
          <p className="mt-4 flex items-center gap-2 text-xs text-red-400">
            <AlertCircle size={13} />
            {queueError}
          </p>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Queue list */}
          <div className="space-y-2">
            {queueItems.length === 0 && !queueError && (
              <p className="text-sm text-zinc-500">No reports in the queue.</p>
            )}
            {queueItems.map((item) => (
              <button
                key={item.incident_uuid}
                onClick={() => loadIncident(item.incident_uuid)}
                className={`w-full rounded-xl border p-4 text-left transition-all duration-300 ease-spring ${
                  selectedUuid === item.incident_uuid
                    ? 'border-signal-400/40 bg-signal-400/5'
                    : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-zinc-300">
                    {item.incident_uuid.slice(0, 8)}
                  </span>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  {item.lat?.toFixed(3)}, {item.lon?.toFixed(3)}
                </p>
                <p className="mt-1 text-xs text-zinc-600">
                  {new Date(item.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                {item.is_demo && (
                  <span className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-500">
                    <FlaskConical size={11} />
                    Demo
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Detail panel */}
          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              {!selectedUuid && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-full min-h-[400px] items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/20"
                >
                  <p className="text-sm text-zinc-500">Select a report to review</p>
                </motion.div>
              )}

              {selectedUuid && incidentLoading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-full min-h-[400px] items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/20"
                >
                  <Loader2 size={20} className="animate-spin text-zinc-500" />
                </motion.div>
              )}

              {selectedUuid && !incidentLoading && incidentError && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/20"
                >
                  <AlertCircle size={20} className="text-red-400" />
                  <p className="text-sm text-zinc-400">{incidentError}</p>
                </motion.div>
              )}

              {selectedUuid && !incidentLoading && incident && (
                <motion.div
                  key={incident.incident_uuid}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: dur, ease: SPRING }}
                  className="space-y-5"
                >
                  {/* Back button */}
                  <button
                    onClick={() => {
                      setSelectedUuid(null);
                      setIncident(null);
                    }}
                    className="btn-ghost"
                  >
                    <ArrowLeft size={14} />
                    Back to queue
                  </button>

                  {/* Header */}
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-medium text-zinc-400">
                        {incident.incident_uuid.slice(0, 8)}
                      </span>
                      <StatusBadge status={incident.status} />
                    </div>
                    <p className="mt-3 text-sm text-zinc-500">
                      {new Date(incident.created_at).toLocaleString()}
                    </p>
                    {incident.is_demo && (
                      <span className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-500">
                        <FlaskConical size={11} />
                        Demonstration report
                      </span>
                    )}
                  </div>

                  {/* 01 GROUND EVIDENCE */}
                  <ReviewSection number="01" label="Ground Evidence" sublabel="Submitter-confirmed">
                    {photoUrl ? (
                      <div className="overflow-hidden rounded-xl border border-zinc-800">
                        <img
                          src={photoUrl}
                          alt="Protected sanitized reviewer photo"
                          className="h-full max-h-64 w-full object-cover"
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-600">No photo available</p>
                    )}
                    {incident.confirmed_evidence && (
                      <EvidenceView evidence={incident.confirmed_evidence} />
                    )}
                    {incident.submitter_note && (
                      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                        <p className="flex items-center gap-1.5 text-xs text-amber-400">
                          <Lock size={12} />
                          PRIVATE — reporter note
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                          {incident.submitter_note}
                        </p>
                      </div>
                    )}
                  </ReviewSection>

                  {/* 02 MAPPED CONTEXT */}
                  <ReviewSection
                    number="02"
                    label="Mapped Context"
                    sublabel="Global Mangrove Watch — satellite-derived mapped extent"
                  >
                    <p className="text-sm font-medium text-zinc-100">
                      {COVERAGE_LABELS[incident.coverage_result] || incident.coverage_result}
                    </p>
                    {incident.coverage_label && (
                      <p className="mt-1 text-sm text-zinc-300">{incident.coverage_label}</p>
                    )}
                    {incident.coverage_note && (
                      <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                        {incident.coverage_note}
                      </p>
                    )}
                    {incident.gmw_dataset_label && (
                      <p className="mt-2 text-xs text-zinc-600">
                        {incident.gmw_dataset_label}
                      </p>
                    )}
                  </ReviewSection>

                  {/* 03 AI DRAFT */}
                  <ReviewSection number="03" label="AI Draft" sublabel="Unconfirmed">
                    {incident.ai_status === 'complete' && incident.ai_raw_evidence ? (
                      <>
                        <p className="flex items-center gap-2 text-xs text-amber-400">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                          UNCONFIRMED
                        </p>
                        <EvidenceView evidence={incident.ai_raw_evidence} />
                        <p className="mt-2 text-xs text-zinc-600">
                          Attempt count: {incident.ai_attempt_count ?? '—'}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-zinc-400">
                        AI drafting unavailable — no draft was generated.
                      </p>
                    )}
                  </ReviewSection>

                  {/* 04 HUMAN DECISION */}
                  <ReviewSection number="04" label="Human Decision" sublabel="Platform workflow state">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-zinc-500">Current state</p>
                        <div className="mt-1.5">
                          <StatusBadge status={incident.status} large />
                        </div>
                      </div>

                      {incident.reviewed_at && (
                        <p className="text-xs text-zinc-500">
                          Last reviewed:{' '}
                          {new Date(incident.reviewed_at).toLocaleString()}
                        </p>
                      )}

                      {/* Reviewer notes */}
                      <div>
                        <label className="label-eyebrow mb-2 block">Reviewer notes</label>
                        <textarea
                          value={reviewerNotes}
                          onChange={(e) => setReviewerNotes(e.target.value.slice(0, MAX_NOTES))}
                          maxLength={MAX_NOTES}
                          rows={3}
                          placeholder="Internal notes (not shown on public map)…"
                          className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors focus:border-signal-400/50 focus:outline-none"
                        />
                        <span className="mt-1 block text-right text-xs text-zinc-600">
                          {reviewerNotes.length}/{MAX_NOTES}
                        </span>
                      </div>

                      {/* Actions — only allowed from current status */}
                      {triageError && (
                        <p className="flex items-center gap-2 text-xs text-red-400">
                          <AlertCircle size={13} />
                          {triageError}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3">
                        {ALLOWED_ACTIONS[incident.status]?.length > 0 ? (
                          ALLOWED_ACTIONS[incident.status].map((action) => (
                            <button
                              key={action}
                              onClick={() => handleTriage(action)}
                              disabled={triaging}
                              className={
                                action === 'dismissed'
                                  ? 'btn-secondary'
                                  : 'btn-primary'
                              }
                            >
                              {triaging ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : action === 'forwarded' ? (
                                <Send size={14} />
                              ) : action === 'dismissed' ? (
                                <X size={14} />
                              ) : (
                                <Check size={14} />
                              )}
                              {ACTION_LABELS[action]}
                            </button>
                          ))
                        ) : (
                          <p className="text-sm text-zinc-500">
                            Terminal state — no further actions available.
                          </p>
                        )}
                      </div>
                    </div>
                  </ReviewSection>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status, large }) {
  const label = STATUS_LABELS[status] || status;
  const styles = {
    submitted: 'border-zinc-700 bg-zinc-800/40 text-zinc-300',
    under_review: 'border-signal-400/30 bg-signal-400/10 text-signal-300',
    forwarded: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    dismissed: 'border-red-900/40 bg-red-950/20 text-red-300',
    draft: 'border-zinc-700 bg-zinc-800/40 text-zinc-400',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${styles[status] || styles.draft} ${large ? 'px-4 py-1.5 text-sm' : ''}`}
    >
      <Clock size={12} />
      {label}
    </span>
  );
}

function ReviewSection({ number, label, sublabel, children }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-light text-2xl text-signal-400/70">{number}</span>
            <h3 className="text-lg font-medium text-zinc-50">{label}</h3>
          </div>
          <p className="mt-1 text-xs text-zinc-500">{sublabel}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function EvidenceView({ evidence }) {
  if (!evidence) return null;
  return (
    <div className="space-y-3">
      {evidence.visible_indicators?.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500">Visible indicators</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {evidence.visible_indicators.map((ind, i) => (
              <span
                key={i}
                className="rounded-full border border-zinc-700 bg-zinc-800/40 px-2.5 py-1 text-xs text-zinc-200"
              >
                {ind}
              </span>
            ))}
          </div>
        </div>
      )}
      {evidence.vegetation_status && (
        <DetailField
          label="Vegetation status"
          value={formatOption(evidence.vegetation_status, VEGETATION_OPTIONS)}
        />
      )}
      {evidence.human_activity_signs?.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500">Human activity signs</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {evidence.human_activity_signs.map((act, i) => (
              <span
                key={i}
                className="rounded-full border border-zinc-700 bg-zinc-800/40 px-2.5 py-1 text-xs text-zinc-200"
              >
                {act}
              </span>
            ))}
          </div>
        </div>
      )}
      {evidence.water_presence && (
        <DetailField
          label="Water presence"
          value={formatOption(evidence.water_presence, WATER_OPTIONS)}
        />
      )}
      {evidence.image_quality && (
        <DetailField
          label="Image quality"
          value={formatOption(evidence.image_quality, IMAGE_QUALITY_OPTIONS)}
        />
      )}
      {evidence.limitations_note && (
        <div>
          <p className="text-xs text-zinc-500">Limitations</p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-300">
            {evidence.limitations_note}
          </p>
        </div>
      )}
    </div>
  );
}

function DetailField({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-sm text-zinc-200">{value}</p>
    </div>
  );
}

function formatOption(value, options) {
  const found = options.find((o) => o.value === value);
  return found ? found.label : value?.replace(/_/g, ' ') || '—';
}
