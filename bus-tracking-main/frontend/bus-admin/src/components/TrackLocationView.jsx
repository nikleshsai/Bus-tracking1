/* ─────────────────────────────────────────────────────────
   TrackLocationView — Full-screen map overlay focused on a
   single selected bus.

   Props:
     bus      — the selected bus object (required)
     buses    — full bus array (needed to derive position by index)
     onClose  — callback to return to the dashboard
───────────────────────────────────────────────────────── */
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { X, Navigation } from 'lucide-react';
import L from 'leaflet';

// ── Same constants used by MapView ───────────────────────
const BASE_LAT = 12.9165;
const BASE_LNG = 79.1325;

function getBusPosition(index) {
  const cols = 5;
  const row = Math.floor(index / cols);
  const col = index % cols;
  const latStep = 0.018;
  const lngStep = 0.022;
  const latOffset = (row - 1) * latStep;
  const lngOffset = (col - 2) * lngStep;
  return {
    lat: BASE_LAT + latOffset,
    lng: BASE_LNG + lngOffset,
  };
}

const getMarkerColor = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'active') return '#4CAF50';
  return '#f44336';
};

/** Focused marker icon — slightly larger with a pulsing ring */
const createFocusedIcon = (color, busLabel) => {
  const safeLabel = String(busLabel || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return L.divIcon({
    html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        pointer-events: none;
        width: max-content;
        position: relative;
      ">
        <!-- Pulse ring -->
        <div style="
          position: absolute;
          top: -8px;
          left: -8px;
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: ${color}33;
          animation: trackPulse 1.8s ease-out infinite;
          z-index: -1;
        "></div>
        <!-- Bus circle -->
        <div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          border: 3px solid white;
          box-shadow: 0 0 0 3px ${color}88, 0 4px 12px rgba(0,0,0,0.35);
          flex-shrink: 0;
        ">&#x1F68C;</div>
        <!-- Label pill -->
        <div style="
          margin-top: 5px;
          background: #ffffff;
          border: 1.5px solid #d1d5db;
          border-radius: 999px;
          padding: 3px 10px;
          font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: #1a202c;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          letter-spacing: 0.01em;
          line-height: 1.5;
          pointer-events: none;
        ">${safeLabel}</div>
      </div>
    `,
    iconSize: [140, 60],
    iconAnchor: [15, 15],
    className: 'custom-bus-marker-focused',
  });
};

/** Inner component: centers + zooms the map to the target position */
function MapFocuser({ lat, lng }) {
  const map = useMap();
  const didFly = useRef(false);

  useEffect(() => {
    if (!didFly.current) {
      map.flyTo([lat, lng], 15, { duration: 1.2 });
      didFly.current = true;
    }
  }, [map, lat, lng]);

  return null;
}

/** Status badge colors */
const STATUS_STYLES = {
  active: { bg: '#f0fff4', color: '#2d9e5f', border: '#c6f6d5' },
  inactive: { bg: '#fff5f5', color: '#c53030', border: '#fed7d7' },
  maintenance: { bg: '#fffaf0', color: '#c05621', border: '#feebc8' },
};

function getStatusStyle(status = '') {
  return STATUS_STYLES[(status || '').toLowerCase()] || STATUS_STYLES.inactive;
}

/* ─────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────── */
export default function TrackLocationView({ bus, buses = [], onClose }) {
  if (!bus) return null;

  const busIndex = buses.findIndex((b) => b.id === bus.id);
  const { lat, lng } = getBusPosition(busIndex >= 0 ? busIndex : 0);
  const color = getMarkerColor(bus.status);
  const statusStyle = getStatusStyle(bus.status);

  const busLabel = bus.busId
    ? `Bus ${String(bus.busId).padStart(2, '0')}`
    : bus.busNo || bus.route || 'Bus';

  const busIdDisplay =
    bus.busId ||
    (bus.route && /^\d+-/.test(bus.route) ? bus.route.split('-')[0] : null) ||
    (bus.id && String(bus.id).length < 5 ? bus.id : bus.busNo);

  return (
    <div className="track-overlay">
      {/* Keyframes for pulse animation */}
      <style>{`
        @keyframes trackPulse {
          0%   { transform: scale(0.9); opacity: 0.7; }
          70%  { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .custom-bus-marker-focused {
          background: transparent !important;
          border: none !important;
          overflow: visible !important;
        }
      `}</style>

      <div className="track-inner" onClick={(e) => e.stopPropagation()}>

        {/* ── Top header strip ── */}
        <div className="track-header">
          <div className="track-header__left">
            <div className="track-header__title">
              <div className="track-header__icon">
                <Navigation size={14} color="#ffffff" strokeWidth={2} />
              </div>
              <h2>Tracking &#8212; {busLabel}</h2>
            </div>
          </div>

          {/* Status badge */}
          <span
            className="track-status-badge"
            style={{
              background: statusStyle.bg,
              color: statusStyle.color,
              border: `1px solid ${statusStyle.border}`,
            }}
          >
            {(bus.status || 'Unknown').toUpperCase()}
          </span>

          {/* Close X */}
          <button className="track-close-btn" onClick={onClose} title="Close">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* ── Map + side info layout ── */}
        <div className="track-body">

          {/* Leaflet map */}
          <div className="track-map-area">
            <MapContainer
              center={[lat, lng]}
              zoom={13}
              style={{ width: '100%', height: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <MapFocuser lat={lat} lng={lng} />
              <Marker
                position={[lat, lng]}
                icon={createFocusedIcon(color, busLabel)}
              />
            </MapContainer>
          </div>

          {/* ── Side info panel ── */}
          <div className="track-info-panel">

            {/* Bus avatar + number */}
            <div className="track-info__hero">
              <div
                className="track-info__avatar"
                style={{ background: color }}
              >
                &#x1F68C;
              </div>
              <div>
                <div className="track-info__buslabel">{busLabel}</div>
                <div className="track-info__subroute">{bus.route || '&#8212;'}</div>
              </div>
            </div>

            {/* Info rows */}
            <div className="track-info__rows">
              {[
                { label: 'Bus ID', value: busIdDisplay },
                { label: 'Reg Number', value: bus.number || bus.busNo },
                { label: 'Route', value: bus.route },
                { label: 'Driver', value: bus.driver },
                { label: 'Contact', value: bus.driverPhone || bus.contact },
                { label: 'License', value: bus.license },
                { label: 'Capacity', value: bus.capacity ? `${bus.capacity} seats` : '—' },
              ].map(({ label, value }) => (
                <div className="track-info__row" key={label}>
                  <span className="track-info__label">{label}</span>
                  <span className="track-info__value">{value || '—'}</span>
                </div>
              ))}
            </div>

            {/* Coordinates */}
            <div className="track-info__coords">
              <div className="track-info__coords-header">
                <Navigation size={11} strokeWidth={2} />
                GPS Coordinates
              </div>
              <div className="track-info__coords-body">
                <span>Lat: <strong>{lat.toFixed(5)}</strong></span>
                <span>Lng: <strong>{lng.toFixed(5)}</strong></span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
