import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  MapPin,
  Crosshair,
  Loader2,
  Check,
  AlertCircle,
  RefreshCw,
  X,
  Plus,
  Eye,
  EyeOff,
  ArrowRight,
  Lock,
  FileText,
  Send,
} from 'lucide-react';
import {
  getConfig,
  createDraft,
  getVision,
  getSpatial,
  submitDraft,
} from '@/lib/api';
import {
  VEGETATION_OPTIONS,
  WATER_OPTIONS,
  IMAGE_QUALITY_OPTIONS,
  SPRING,
} from '@/lib/constants';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const MAX_NOTE = 500;
const MAX_INDICATORS = 12;
const MAX_ACTIVITIES = 12;
const MAX_FIELD_CHARS = 160;
const MAX_LIMITATIONS = 300;

const initialEvidence = {
  visible_indicators: [],
  vegetation_status: 'unclear',
  human_activity_signs: [],
  water_presence: 'unclear',
  image_quality: 'adequate',
  limitations_note: '',
};

export default function Report() {
  const reduced = useReducedMotion();
  const [config, setConfig] = useState(null);
  const [configError, setConfigError] = useState(null);

  // Step state
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [submitterNote, setSubmitterNote] = useState('');
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState(null);

  // Draft + lanes
  const [draftUuid, setDraftUuid] = useState(null);
  const [creatingDraft, setCreatingDraft] = useState(false);
  const [draftError, setDraftError] = useState(null);

  // Vision lane
  const [visionState, setVisionState] = useState('idle'); // idle | loading | complete | unavailable | retrying
  const [visionData, setVisionData] = useState(null);
  const [visionError, setVisionError] = useState(null);

  // Spatial lane
  const [spatialState, setSpatialState] = useState('idle'); // idle | loading | complete | error | retrying
  const [spatialData, setSpatialData] = useState(null);
  const [spatialError, setSpatialError] = useState(null);

  // Evidence (editable)
  const [evidence, setEvidence] = useState(initialEvidence);

  // Submission
  const [submitState, setSubmitState] = useState('idle'); // idle | submitting | submitted
  const [submitError, setSubmitError] = useState(null);

  // New indicator/activity inputs
  const [newIndicator, setNewIndicator] = useState('');
  const [newActivity, setNewActivity] = useState('');

  const fileInputRef = useRef(null);

  // Load config
  useEffect(() => {
    let active = true;
    getConfig()
      .then((c) => {
        if (active) setConfig(c);
      })
      .catch((e) => {
        if (active) setConfigError(e.message || 'Failed to load config');
      });
    return () => {
      active = false;
    };
  }, []);

  // --- Photo ---
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  };

  const removePhoto = () => {
    setPhoto(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    // Reset everything downstream
    setDraftUuid(null);
    setVisionState('idle');
    setVisionData(null);
    setVisionError(null);
    setSpatialState('idle');
    setSpatialData(null);
    setSpatialError(null);
    setEvidence(initialEvidence);
    setSubmitState('idle');
  };

  // --- Geolocation ---
  const handleLocate = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not available in this browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude));
        setLon(String(pos.coords.longitude));
        setLocating(false);
      },
      (err) => {
        setGeoError(
          err.message || 'Could not retrieve your location. Enter coordinates manually.'
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const canCreateDraft = photo && lat && lon && !creatingDraft && !draftUuid;

  // --- Create draft + kick off both lanes concurrently ---
  const handleCreateDraft = useCallback(async () => {
    if (!photo || !lat || !lon) return;
    setCreatingDraft(true);
    setDraftError(null);
    try {
      const res = await createDraft({
        photo,
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        submitter_note: submitterNote || undefined,
      });
      setDraftUuid(res.incident_uuid);

      // Start both lanes concurrently — each updates independently
      setVisionState('loading');
      setVisionError(null);
      setSpatialState('loading');
      setSpatialError(null);

      // Vision lane
      getVision(res.incident_uuid)
        .then((data) => {
          setVisionData(data);
          if (data.ai_status === 'complete' && data.evidence) {
            setVisionState('complete');
            // Pre-fill evidence from AI draft
            setEvidence({
              visible_indicators: data.evidence.visible_indicators || [],
              vegetation_status: data.evidence.vegetation_status || 'unclear',
              human_activity_signs: data.evidence.human_activity_signs || [],
              water_presence: data.evidence.water_presence || 'unclear',
              image_quality: data.evidence.image_quality || 'adequate',
              limitations_note: data.evidence.limitations_note || '',
            });
          } else {
            setVisionState('unavailable');
          }
        })
        .catch((err) => {
          setVisionError(err.message || 'AI drafting failed');
          setVisionState('unavailable');
        });

      // Spatial lane
      getSpatial(res.incident_uuid)
        .then((data) => {
          setSpatialData(data);
          setSpatialState('complete');
        })
        .catch((err) => {
          setSpatialError(err.message || 'Spatial context failed');
          setSpatialState('error');
        });
    } catch (err) {
      setDraftError(err.message || 'Failed to create draft');
    } finally {
      setCreatingDraft(false);
    }
  }, [photo, lat, lon, submitterNote]);

  // --- Vision retry (manual only) ---
  const handleVisionRetry = () => {
    if (!draftUuid || !visionData?.retry_allowed) return;
    setVisionState('retrying');
    setVisionError(null);
    getVision(draftUuid, true)
      .then((data) => {
        setVisionData(data);
        if (data.ai_status === 'complete' && data.evidence) {
          setVisionState('complete');
          setEvidence({
            visible_indicators: data.evidence.visible_indicators || [],
            vegetation_status: data.evidence.vegetation_status || 'unclear',
            human_activity_signs: data.evidence.human_activity_signs || [],
            water_presence: data.evidence.water_presence || 'unclear',
            image_quality: data.evidence.image_quality || 'adequate',
            limitations_note: data.evidence.limitations_note || '',
          });
        } else {
          setVisionState('unavailable');
        }
      })
      .catch((err) => {
        setVisionError(err.message || 'AI retry failed');
        setVisionState('unavailable');
      });
  };

  // --- Spatial retry ---
  const handleSpatialRetry = () => {
    if (!draftUuid) return;
    setSpatialState('retrying');
    setSpatialError(null);
    getSpatial(draftUuid)
      .then((data) => {
        setSpatialData(data);
        setSpatialState('complete');
      })
      .catch((err) => {
        setSpatialError(err.message || 'Spatial retry failed');
        setSpatialState('error');
      });
  };

  // --- Evidence editing ---
  const addIndicator = () => {
    const v = newIndicator.trim();
    if (!v || evidence.visible_indicators.length >= MAX_INDICATORS || v.length > MAX_FIELD_CHARS) return;
    setEvidence((e) => ({ ...e, visible_indicators: [...e.visible_indicators, v] }));
    setNewIndicator('');
  };
  const removeIndicator = (idx) => {
    setEvidence((e) => ({ ...e, visible_indicators: e.visible_indicators.filter((_, i) => i !== idx) }));
  };
  const addActivity = () => {
    const v = newActivity.trim();
    if (!v || evidence.human_activity_signs.length >= MAX_ACTIVITIES || v.length > MAX_FIELD_CHARS) return;
    setEvidence((e) => ({ ...e, human_activity_signs: [...e.human_activity_signs, v] }));
    setNewActivity('');
  };
  const removeActivity = (idx) => {
    setEvidence((e) => ({ ...e, human_activity_signs: e.human_activity_signs.filter((_, i) => i !== idx) }));
  };

  const canSubmit =
    draftUuid &&
    spatialState === 'complete' &&
    evidence.limitations_note.trim().length >= 1 &&
    evidence.limitations_note.trim().length <= MAX_LIMITATIONS &&
    submitState === 'idle';

  // --- Submit ---
  const handleSubmit = async () => {
    if (!draftUuid || !canSubmit) return;
    setSubmitState('submitting');
    setSubmitError(null);
    try {
      await submitDraft(draftUuid, {
        visible_indicators: evidence.visible_indicators,
        vegetation_status: evidence.vegetation_status,
        human_activity_signs: evidence.human_activity_signs,
        water_presence: evidence.water_presence,
        image_quality: evidence.image_quality,
        limitations_note: evidence.limitations_note.trim(),
      });
      setSubmitState('submitted');
    } catch (err) {
      setSubmitError(err.message || 'Submission failed');
      setSubmitState('idle');
    }
  };

  const dur = reduced ? 0.01 : 0.4;

  // --- Submitted state ---
  if (submitState === 'submitted') {
    return (
      <div className="flex min-h-[100svh] items-center justify-center px-6 pt-20">
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur, ease: SPRING }}
          className="text-center"
        >
          <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full border border-signal-400/40 bg-signal-400/10">
            <Check className="h-8 w-8 text-signal-400" />
          </div>
          <p className="label-eyebrow mb-4">Review Packet submitted</p>
          <h1 className="display-text text-4xl text-zinc-50 sm:text-5xl">Submitted</h1>
          <p className="mt-6 text-lg text-zinc-400">Private review queue</p>
          <p className="mt-1 text-sm text-zinc-500">Not public yet</p>
          <p className="mx-auto mt-8 max-w-md text-sm leading-relaxed text-zinc-500">
            Human review controls whether this report enters the public workflow.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link to="/map" className="btn-primary">
              Explore reviewed reports
              <ArrowRight size={16} />
            </Link>
            <Link to="/report" className="btn-secondary" onClick={() => window.location.reload()}>
              Report another
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      className="pt-20"
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0.01 : 0.4, ease: SPRING }}
    >
      <div className="container-edge py-12 sm:py-16">
        {/* Header */}
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur, ease: SPRING }}
        >
          <p className="label-eyebrow mb-4">Report an observation</p>
          <h1 className="display-text text-4xl text-zinc-50 sm:text-5xl">
            Share a coastal signal
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-zinc-400 sm:text-base">
            Your photo and reported location become a source-separated Review Packet.
            You confirm the evidence before a human reviewer controls publication.
          </p>
        </motion.div>

        {/* Config disclosures */}
        {config && (
          <div className="mt-8 space-y-2">
            {config.ai?.configured && (
              <div className="flex items-start gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-3">
                <Eye size={15} className="mt-0.5 shrink-0 text-zinc-500" />
                <p className="text-xs leading-relaxed text-zinc-400">
                  AI drafting: a sanitized copy of this image may be sent to Google Gemini for
                  visible-observation drafting.
                </p>
              </div>
            )}
            {config.demo_mode && (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-900/40 bg-amber-950/20 px-4 py-3">
                <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-500" />
                <p className="text-xs leading-relaxed text-amber-200/80">
                  Hackathon demonstration environment — do not upload sensitive, private, or
                  personally identifying imagery.
                </p>
              </div>
            )}
          </div>
        )}
        {configError && (
          <div className="mt-8 flex items-start gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-3">
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-zinc-500" />
            <p className="text-xs text-zinc-400">{configError}</p>
          </div>
        )}

        {/* ===== STEP 1: PHOTO ===== */}
        <section className="mt-12">
          <StepHeader number="01" label="Photo" />
          <div className="mt-6">
            {!photoPreview ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="group flex w-full flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/20 px-6 py-16 transition-all duration-500 ease-spring hover:border-signal-400/40 hover:bg-zinc-900/40"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-zinc-700 transition-colors group-hover:border-signal-400/40">
                  <Camera size={22} className="text-zinc-400 transition-colors group-hover:text-signal-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-zinc-200">Select a coastal photo</p>
                  <p className="mt-1 text-xs text-zinc-500">Camera or gallery — mobile compatible</p>
                </div>
              </button>
            ) : (
              <motion.div
                className="relative overflow-hidden rounded-2xl border border-zinc-800"
                initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: reduced ? 0.01 : 0.35, ease: SPRING }}
              >
                <img src={photoPreview} alt="Selected coastal observation" className="h-full max-h-96 w-full object-cover" />
                <button
                  onClick={removePhoto}
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-950/80 text-zinc-300 backdrop-blur-md transition-colors hover:bg-zinc-800 hover:text-zinc-50"
                  aria-label="Remove photo"
                >
                  <X size={18} />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-950/90 to-transparent px-4 py-3">
                  <p className="text-xs text-zinc-400">
                    Uploaded imagery is sanitized by the server before any downstream processing.
                  </p>
                </div>
              </motion.div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>
        </section>

        {/* ===== STEP 2: REPORTED LOCATION ===== */}
        <section className="mt-12">
          <StepHeader number="02" label="Reported location" />
          <div className="mt-6 space-y-4">
            <button
              onClick={handleLocate}
              disabled={locating}
              className="btn-secondary w-full sm:w-auto"
            >
              {locating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Crosshair size={16} />
              )}
              {locating ? 'Locating…' : 'Use my browser location'}
            </button>
            {geoError && (
              <motion.p
                className="text-xs text-amber-400"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: SPRING }}
              >
                {geoError}
              </motion.p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="lat" className="label-eyebrow mb-2 block">
                  Latitude
                </label>
                <input
                  id="lat"
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="e.g. 1.3521"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors focus:border-signal-400/50 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="lon" className="label-eyebrow mb-2 block">
                  Longitude
                </label>
                <input
                  id="lon"
                  type="number"
                  step="any"
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
                  placeholder="e.g. 103.8198"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors focus:border-signal-400/50 focus:outline-none"
                />
              </div>
            </div>
            <p className="flex items-start gap-2 text-xs text-zinc-500">
              <MapPin size={13} className="mt-0.5 shrink-0" />
              This is a reported location. It does not verify where the photo was taken.
            </p>
          </div>
        </section>

        {/* ===== STEP 3: PRIVATE NOTE ===== */}
        <section className="mt-12">
          <StepHeader number="03" label="Optional private note" />
          <div className="mt-6">
            <div className="relative">
              <textarea
                value={submitterNote}
                onChange={(e) => setSubmitterNote(e.target.value.slice(0, MAX_NOTE))}
                maxLength={MAX_NOTE}
                rows={3}
                placeholder="Context visible to reviewers, not the public map…"
                className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors focus:border-signal-400/50 focus:outline-none"
              />
              <span className="absolute bottom-3 right-4 text-xs text-zinc-600">
                {submitterNote.length}/{MAX_NOTE}
              </span>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
              <Lock size={12} />
              Private — visible to reviewers, not the public map.
            </p>
          </div>
        </section>

        {/* ===== CREATE DRAFT ===== */}
        <section className="mt-12">
          {draftError && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-3">
              <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-400" />
              <p className="text-xs text-red-300">{draftError}</p>
            </div>
          )}
          {!draftUuid && (
            <button
              onClick={handleCreateDraft}
              disabled={!canCreateDraft}
              className="btn-primary w-full sm:w-auto"
            >
              {creatingDraft ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating draft…
                </>
              ) : (
                <>
                  <FileText size={16} />
                  Create draft & analyze
                </>
              )}
            </button>
          )}
        </section>

        {/* ===== LANES (after draft created) ===== */}
        {draftUuid && (
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: dur, ease: SPRING }}
            className="mt-12 space-y-6"
          >
            <p className="label-eyebrow">Review Packet — {draftUuid.slice(0, 8)}</p>

            {/* AI DRAFT LANE */}
            <LaneCard
              number="03"
              label="AI DRAFT"
              sublabel="Unconfirmed"
              accent="amber"
            >
              <AnimatePresence mode="wait">
                {visionState === 'loading' && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 py-2"
                  >
                    <Loader2 size={16} className="animate-spin text-zinc-500" />
                    <span className="text-sm text-zinc-400">Drafting visible observations…</span>
                  </motion.div>
                )}
                {visionState === 'retrying' && (
                  <motion.div
                    key="retrying"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 py-2"
                  >
                    <Loader2 size={16} className="animate-spin text-zinc-500" />
                    <span className="text-sm text-zinc-400">Retrying AI draft…</span>
                  </motion.div>
                )}
                {visionState === 'complete' && (
                  <motion.div
                    key="complete"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2"
                  >
                    <p className="flex items-center gap-2 text-xs text-amber-400">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                      AI DRAFT — UNCONFIRMED
                    </p>
                    <p className="text-sm text-zinc-400">
                      AI drafted {visionData?.evidence?.visible_indicators?.length || 0} visible
                      observations. Edit or remove any suggestion below before submitting.
                    </p>
                  </motion.div>
                )}
                {visionState === 'unavailable' && (
                  <motion.div
                    key="unavail"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    <p className="text-sm text-zinc-400">
                      AI drafting unavailable — continue manually.
                    </p>
                    {visionError && (
                      <p className="text-xs text-zinc-600">{visionError}</p>
                    )}
                    {visionData?.retry_allowed && (
                      <button onClick={handleVisionRetry} className="btn-secondary">
                        <RefreshCw size={14} />
                        Retry AI draft
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </LaneCard>

            {/* MAPPED CONTEXT LANE */}
            <LaneCard
              number="02"
              label="MAPPED CONTEXT"
              sublabel="Global Mangrove Watch — satellite-derived mapped extent"
              accent="signal"
            >
              <AnimatePresence mode="wait">
                {spatialState === 'loading' && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 py-2"
                  >
                    <Loader2 size={16} className="animate-spin text-zinc-500" />
                    <span className="text-sm text-zinc-400">Fetching mapped extent…</span>
                  </motion.div>
                )}
                {spatialState === 'retrying' && (
                  <motion.div
                    key="retrying"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 py-2"
                  >
                    <Loader2 size={16} className="animate-spin text-zinc-500" />
                    <span className="text-sm text-zinc-400">Retrying spatial context…</span>
                  </motion.div>
                )}
                {spatialState === 'complete' && spatialData && (
                  <motion.div
                    key="complete"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    <p className="text-sm font-medium text-zinc-100">
                      {spatialData.coverage_label}
                    </p>
                    <p className="text-xs leading-relaxed text-zinc-400">
                      {spatialData.coverage_note}
                    </p>
                    <p className="text-xs text-zinc-600">
                      {spatialData.gmw_dataset_label}
                    </p>
                  </motion.div>
                )}
                {spatialState === 'error' && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    <p className="text-sm text-zinc-400">
                      Could not retrieve mapped context.
                    </p>
                    {spatialError && (
                      <p className="text-xs text-zinc-600">{spatialError}</p>
                    )}
                    <button onClick={handleSpatialRetry} className="btn-secondary">
                      <RefreshCw size={14} />
                      Retry
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </LaneCard>

            {/* ===== EVIDENCE EDITOR ===== */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <span className="font-light text-2xl text-signal-400/80">01</span>
                  <h3 className="mt-2 text-lg font-medium text-zinc-50">Ground Evidence</h3>
                  <p className="text-xs text-zinc-500">Submitter-confirmed — edit before submitting</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Visible indicators */}
                <div>
                  <label className="label-eyebrow mb-3 block">Visible indicators</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newIndicator}
                      onChange={(e) => setNewIndicator(e.target.value.slice(0, MAX_FIELD_CHARS))}
                      onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      placeholder="Add an observation…"
                      maxLength={MAX_FIELD_CHARS}
                      className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors focus:border-signal-400/50 focus:outline-none"
                    />
                    <button
                      onClick={addIndicator}
                      disabled={evidence.visible_indicators.length >= MAX_INDICATORS}
                      className="btn-secondary shrink-0"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <TagList items={evidence.visible_indicators} onRemove={removeIndicator} />
                </div>

                {/* Vegetation status */}
                <SelectField
                  label="Vegetation status"
                  value={evidence.vegetation_status}
                  options={VEGETATION_OPTIONS}
                  onChange={(v) => setEvidence((e) => ({ ...e, vegetation_status: v }))}
                />

                {/* Human activity signs */}
                <div>
                  <label className="label-eyebrow mb-3 block">Human activity signs</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newActivity}
                      onChange={(e) => setNewActivity(e.target.value.slice(0, MAX_FIELD_CHARS))}
                      onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      placeholder="Add a sign of human activity…"
                      maxLength={MAX_FIELD_CHARS}
                      className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors focus:border-signal-400/50 focus:outline-none"
                    />
                    <button
                      onClick={addActivity}
                      disabled={evidence.human_activity_signs.length >= MAX_ACTIVITIES}
                      className="btn-secondary shrink-0"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <TagList items={evidence.human_activity_signs} onRemove={removeActivity} />
                </div>

                {/* Water presence */}
                <SelectField
                  label="Water presence"
                  value={evidence.water_presence}
                  options={WATER_OPTIONS}
                  onChange={(v) => setEvidence((e) => ({ ...e, water_presence: v }))}
                />

                {/* Image quality */}
                <SelectField
                  label="Image quality"
                  value={evidence.image_quality}
                  options={IMAGE_QUALITY_OPTIONS}
                  onChange={(v) => setEvidence((e) => ({ ...e, image_quality: v }))}
                />

                {/* Limitations note */}
                <div>
                  <label className="label-eyebrow mb-2 block">
                    Limitations note <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <textarea
                      value={evidence.limitations_note}
                      onChange={(e) =>
                        setEvidence((ev) => ({
                          ...ev,
                          limitations_note: e.target.value.slice(0, MAX_LIMITATIONS),
                        }))
                      }
                      maxLength={MAX_LIMITATIONS}
                      rows={3}
                      placeholder="Describe limitations of this observation (required)…"
                      className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors focus:border-signal-400/50 focus:outline-none"
                    />
                    <span className="absolute bottom-3 right-4 text-xs text-zinc-600">
                      {evidence.limitations_note.length}/{MAX_LIMITATIONS}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== SUBMIT ===== */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 sm:p-8">
              <h3 className="text-lg font-medium text-zinc-50">Submit Review Packet</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Your confirmed evidence will enter the private review queue. It will not
                appear on the public map until a human reviewer allows it through.
              </p>
              {spatialState !== 'complete' && (
                <p className="mt-4 flex items-center gap-2 text-xs text-amber-400">
                  <AlertCircle size={13} />
                  Submission requires a real mapped context result.
                </p>
              )}
              {submitError && (
                <p className="mt-4 flex items-center gap-2 text-xs text-red-400">
                  <AlertCircle size={13} />
                  {submitError}
                </p>
              )}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="btn-primary mt-6 w-full sm:w-auto"
              >
                {submitState === 'submitting' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Submit for review
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function StepHeader({ number, label }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-light text-2xl text-signal-400/80">{number}</span>
      <h2 className="text-lg font-medium text-zinc-100">{label}</h2>
    </div>
  );
}

function LaneCard({ number, label, sublabel, accent, children }) {
  const accentColor = accent === 'amber' ? 'text-amber-400' : 'text-signal-400';
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 sm:p-8">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className={`font-light text-2xl ${accentColor} opacity-80`}>{number}</span>
            <h3 className="text-lg font-medium text-zinc-50">{label}</h3>
          </div>
          <p className="mt-1.5 text-xs text-zinc-500">{sublabel}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function TagList({ items, onRemove }) {
  if (!items.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <AnimatePresence>
        {items.map((item, i) => (
          <motion.span
            key={`${item}-${i}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2, ease: SPRING }}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/40 px-3 py-1.5 text-xs text-zinc-200"
          >
            {item}
            <button
              onClick={() => onRemove(i)}
              className="text-zinc-500 transition-colors hover:text-zinc-200"
              aria-label={`Remove ${item}`}
            >
              <X size={12} />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div>
      <label className="label-eyebrow mb-2 block">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`rounded-full border px-4 py-2 text-sm transition-all duration-300 ease-spring ${
              value === opt.value
                ? 'border-signal-400/50 bg-signal-400/10 text-signal-300'
                : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
