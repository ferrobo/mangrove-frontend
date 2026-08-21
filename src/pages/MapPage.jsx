import { useEffect, useMemo, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  GeoJSON,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'motion/react';
import {
  Loader2,
  AlertCircle,
  X,
  RefreshCw,
  Clock,
  ArrowUpRight,
  FlaskConical,
} from 'lucide-react';
import { getIncidents, getGmwDisplay, getConfig } from '@/lib/api';
import { STATUS_LABELS, COVERAGE_LABELS, SPRING } from '@/lib/constants';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// Fix Leaflet default icon path issues — we use custom divIcons, but prevent 404s
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: '',
  iconRetinaUrl: '',
  shadowUrl: '',
});

const OSM_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTR = '&copy; OpenStreetMap contributors';

const DEFAULT_CENTER = [8, 110];

function makeIcon(status, isDemo, selected) {
  const cls = isDemo ? 'demo' : status === 'FORWARDED' ? 'forwarded' : 'under-review';
  return L.divIcon({
    className: 'ms-marker' + (selected ? ' selected' : ''),
    html: `<div class="ms-marker-pin ${cls}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export default function MapPage() {
  const reduced = useReducedMotion();
  const [incidents, setIncidents] = useState(null);
  const [gmw, setGmw] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [inc, gmwData, cfg] = await Promise.all([
        getIncidents(),
        getGmwDisplay().catch(() => null),
        getConfig().catch(() => null),
      ]);
      setIncidents(inc);
      setGmw(gmwData);
      setConfig(cfg);
    } catch (err) {
      setError(err.message || 'Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleMarkerClick = (incident) => {
    setSelected(incident);
    setDetailOpen(true);
  };

  const gmwAttribution = useMemo(() => {
    if (!config?.gmw) return '&copy; Global Mangrove Watch';
    const g = config.gmw;
    return `&copy;Global Mangrove Watch — v${g.version}, ${g.extent_year} mapped extent — CC BY 4.0`;
  }, [config]);

  const gmwKey = useMemo(() => {
    if (!config?.gmw) return 'gmw';
    return `gmw-${config.gmw.version}-${config.gmw.extent_year}`;
  }, [config]);

  return (
    <motion.div
      className="pt-16"
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0.01 : 0.4, ease: SPRING }}
    >
      {/* Header */}
      <div className="container-edge py-8 sm:py-10">
        <p className="label-eyebrow mb-3">Public map</p>
        <h1 className="display-text text-3xl text-zinc-50 sm:text-4xl">
          Reviewed reports
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Reports that a human reviewer allowed into the public workflow. Source
          lanes remain distinct — mapped context is contextual only.
        </p>
      </div>

      {/* Map container */}
      <div className="container-edge pb-12">
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800">
          {/* Loading / error overlay */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[500] flex flex-col items-center justify-center gap-3 bg-zinc-950/80 backdrop-blur-sm"
              >
                <Loader2 size={24} className="animate-spin text-signal-400" />
                <p className="text-sm text-zinc-400">Loading map data…</p>
              </motion.div>
            )}
          </AnimatePresence>

          {error && !loading && (
            <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center gap-4 bg-zinc-950/90 p-6 text-center">
              <AlertCircle size={28} className="text-red-400" />
              <p className="max-w-xs text-sm text-zinc-400">{error}</p>
              <button onClick={loadAll} className="btn-secondary">
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          )}

          {/* Leaflet map */}
          <div style={{ height: '70vh', minHeight: '400px' }}>
            <MapContainer
              center={DEFAULT_CENTER}
              zoom={3}
              minZoom={2}
              maxZoom={18}
              scrollWheelZoom={true}
              className="h-full w-full"
              worldCopyJump={true}
            >
              <TileLayer
                url={OSM_URL}
                attribution={OSM_ATTR}
                crossOrigin="anonymous"
                errorTileUrl="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'/%3E"
              />
              {gmw && (
                <GeoJSON
                  key={gmwKey}
                  data={gmw}
                  style={{
                    color: '#3d7d52',
                    weight: 1,
                    opacity: 0.6,
                    fillColor: '#3d7d52',
                    fillOpacity: 0.15,
                  }}
                />
              )}
              <MapResizer />
              {incidents &&
                incidents.map((inc) => (
                  <Marker
                    key={inc.incident_uuid}
                    position={[inc.lat, inc.lon]}
                    icon={makeIcon(
                      inc.status,
                      inc.is_demo,
                      selected?.incident_uuid === inc.incident_uuid
                    )}
                    eventHandlers={{
                      click: () => handleMarkerClick(inc),
                    }}
                  />
                ))}
            </MapContainer>
          </div>

          {/* Attribution bar */}
          <div className="flex flex-col gap-1 border-t border-zinc-800 bg-zinc-950/80 px-4 py-3 text-xs text-zinc-500 backdrop-blur-sm">
            <p>
              <span className="text-zinc-600">Context:</span> {gmwAttribution}
            </p>
            <p>
              <span className="text-zinc-600">Tiles:</span> {OSM_ATTR}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center gap-6">
          <LegendItem color="bg-signal-400" label="Under review" />
          <LegendItem color="bg-amber-500" label="Forwarded" />
          <LegendItem color="bg-zinc-500" label="Demo" dashed />
        </div>

        {/* Explanation */}
        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
          <p className="text-sm leading-relaxed text-zinc-400">
            <span className="font-medium text-zinc-200">UNDER_REVIEW</span> means a human
            allowed this report into the public workflow. It is not a verification claim.
          </p>
        </div>
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {detailOpen && selected && (
          <IncidentDetail
            incident={selected}
            onClose={() => setDetailOpen(false)}
            reduced={reduced}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function LegendItem({ color, label, dashed }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-3 w-3 rounded-full border-2 border-white ${color} ${dashed ? 'border-dashed' : ''}`}
      />
      <span className="text-xs text-zinc-400">{label}</span>
    </div>
  );
}

function IncidentDetail({ incident, onClose, reduced }) {
  const dur = reduced ? 0.01 : 0.4;
  const statusLabel = STATUS_LABELS[incident.status] || incident.status;
  const coverageLabel =
    COVERAGE_LABELS[incident.coverage_result] || incident.coverage_result;

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[200] bg-zinc-950/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: dur }}
        onClick={onClose}
      />
      <motion.aside
        className="fixed bottom-0 left-0 right-0 z-[201] max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-zinc-800 bg-zinc-950 shadow-2xl sm:bottom-auto sm:right-0 sm:top-0 sm:m-4 sm:max-w-md sm:rounded-3xl sm:border"
        initial={reduced ? { opacity: 0 } : { y: '100%' }}
        animate={reduced ? { opacity: 1 } : { y: 0 }}
        exit={reduced ? { opacity: 0 } : { y: '100%' }}
        transition={{ duration: dur, ease: SPRING }}
      >
        {/* Handle bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-5 py-4 backdrop-blur-md">
          <span className="label-eyebrow">Incident detail</span>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-50"
            aria-label="Close detail"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          {/* Photo */}
          {incident.photo_url && (
            <div className="overflow-hidden rounded-xl border border-zinc-800">
              <img
                src={incident.photo_url}
                alt="Sanitized public observation photo"
                className="h-full max-h-64 w-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Demo badge */}
          {incident.is_demo && (
            <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2.5">
              <FlaskConical size={14} className="text-zinc-500" />
              <span className="text-xs text-zinc-400">Demonstration report</span>
            </div>
          )}

          {/* Status */}
          <div>
            <p className="label-lane mb-2">Human Decision</p>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                  incident.status === 'FORWARDED'
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                    : 'border-signal-400/30 bg-signal-400/10 text-signal-300'
                }`}
              >
                <Clock size={12} />
                {statusLabel}
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              {new Date(incident.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Ground Evidence */}
          {incident.confirmed_evidence && (
            <DetailSection number="01" label="Ground Evidence">
              <EvidenceView evidence={incident.confirmed_evidence} />
            </DetailSection>
          )}

          {/* Mapped Context */}
          <DetailSection number="02" label="Mapped Context">
            <p className="text-sm font-medium text-zinc-100">{coverageLabel}</p>
            {incident.coverage_note && (
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                {incident.coverage_note}
              </p>
            )}
            {incident.gmw_dataset_label && (
              <p className="mt-2 text-xs text-zinc-600">{incident.gmw_dataset_label}</p>
            )}
          </DetailSection>

          {/* Location */}
          <div>
            <p className="label-lane mb-2">Reported location</p>
            <p className="text-sm text-zinc-300">
              {incident.lat.toFixed(4)}, {incident.lon.toFixed(4)}
            </p>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

function DetailSection({ number, label, children }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="font-light text-lg text-signal-400/70">{number}</span>
        <p className="label-lane">{label}</p>
      </div>
      {children}
    </div>
  );
}

function EvidenceView({ evidence }) {
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
        <Field label="Vegetation status" value={evidence.vegetation_status} />
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
        <Field label="Water presence" value={evidence.water_presence} />
      )}
      {evidence.image_quality && (
        <Field label="Image quality" value={evidence.image_quality} />
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

function Field({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-sm text-zinc-200">{value.replace(/_/g, ' ')}</p>
    </div>
  );
}
