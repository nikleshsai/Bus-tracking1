import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Base coordinates for Vellore, Tamil Nadu
const BASE_LAT = 12.9165;
const BASE_LNG = 79.1325;

/**
 * Generates a deterministic lat/lng position for a bus based on its index.
 * Uses a 5-column grid so buses don't overlap across the Vellore area.
 */
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

/**
 * Creates a Leaflet divIcon combining:
 *  • A coloured circular bus badge (🚌)
 *  • A white pill label with the bus number, positioned to the right
 */
const createIcon = (color, busLabel, isSelected) => {
  const safeLabel = String(busLabel || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const ring = isSelected
    ? `box-shadow: 0 0 0 3px #3b82f6, 0 2px 6px rgba(0,0,0,0.35);`
    : `box-shadow: 0 2px 6px rgba(0,0,0,0.35);`;

  return L.divIcon({
    html: `
      <div style="
        display: flex;
        align-items: center;
        gap: 6px;
        pointer-events: none;
        width: max-content;
      ">
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
          ${ring}
          flex-shrink: 0;
          transition: box-shadow 0.15s ease;
        ">&#x1F68C;</div>
        <div style="
          background: #ffffff;
          border: 1.5px solid #d1d5db;
          border-radius: 999px;
          padding: 2px 9px;
          font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: #1a202c;
          white-space: nowrap;
          box-shadow: 0 1px 4px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(0,0,0,0.06);
          letter-spacing: 0.01em;
          line-height: 1.5;
          pointer-events: none;
        ">${safeLabel}</div>
      </div>
    `,
    iconSize: [140, 30],
    iconAnchor: [15, 15],
    className: 'custom-bus-marker',
  });
};

/** Closes the info panel when the map background is clicked */
function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: onMapClick });
  return null;
}

/** Compact floating bus information panel rendered over the map */
function BusInfoPanel({ bus, label, onClose }) {
  if (!bus) return null;
  const color = getMarkerColor(bus.status);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: '#ffffff',
        borderRadius: '14px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
        padding: '14px 16px 12px',
        minWidth: '260px',
        maxWidth: '320px',
        fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
        border: '1px solid #e2e8f0',
        pointerEvents: 'auto',
        animation: 'busInfoFadeIn 0.18s ease',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: color, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '13px', color: '#fff',
            border: '2px solid #fff',
            boxShadow: `0 0 0 2px ${color}40`,
            flexShrink: 0,
          }}>🚌</div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '13px', color: '#1a202c', lineHeight: 1.2 }}>{label}</div>
            <div style={{ fontSize: '10px', color: '#718096', marginTop: '1px' }}>{bus.route || '—'}</div>
          </div>
        </div>
        {/* Close button */}
        <button
          onClick={onClose}
          title="Close"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#a0aec0', fontSize: '18px', lineHeight: 1,
            padding: '2px 4px', borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#4a5568'}
          onMouseLeave={e => e.currentTarget.style.color = '#a0aec0'}
        >
          ×
        </button>
      </div>

      {/* Status badge */}
      <div style={{ marginBottom: '10px' }}>
        <span style={{
          display: 'inline-block',
          background: color + '1a',
          color: color,
          border: `1px solid ${color}55`,
          borderRadius: '999px',
          fontSize: '10px',
          fontWeight: '700',
          padding: '2px 10px',
          letterSpacing: '0.04em',
        }}>
          {(bus.status || 'Unknown').toUpperCase()}
        </span>
      </div>

      {/* Details grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
        {[
          { label: 'Reg No', value: bus.number || bus.busNo || '—' },
          { label: 'Driver', value: bus.driver || '—' },
          { label: 'License', value: bus.license || '—' },
          { label: 'Capacity', value: bus.capacity || '—' },
        ].map(({ label: lbl, value }) => (
          <div key={lbl}>
            <div style={{ fontSize: '9px', fontWeight: '600', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1px' }}>{lbl}</div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#2d3748' }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MapView({ buses = [] }) {
  const [selectedBusId, setSelectedBusId] = useState(null);

  const selectedBus = buses.find(b => b.id === selectedBusId) ?? null;
  const selectedIndex = buses.findIndex(b => b.id === selectedBusId);

  const getBusLabel = (bus, index) => {
    if (bus.busId) return `Bus ${String(bus.busId).padStart(2, '0')}`;
    if (bus.busNo) return bus.busNo;
    return bus.route || `Bus ${index + 1}`;
  };

  const handleMarkerClick = (busId, e) => {
    // Stop click from bubbling to the map (which would close the panel)
    if (e && e.originalEvent) e.originalEvent.stopPropagation();
    setSelectedBusId(prev => (prev === busId ? null : busId));
  };

  const handleMapClick = () => {
    setSelectedBusId(null);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Keyframe for panel fade-in */}
      <style>{`
        @keyframes busInfoFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .custom-bus-marker { background: transparent !important; border: none !important; }
      `}</style>

      <MapContainer
        center={[BASE_LAT, BASE_LNG]}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Close panel on bare map click */}
        <MapClickHandler onMapClick={handleMapClick} />

        {buses.map((bus, index) => {
          const { lat, lng } = getBusPosition(index);
          const color = getMarkerColor(bus.status);
          const label = getBusLabel(bus, index);
          const isSelected = bus.id === selectedBusId;

          return (
            <Marker
              key={bus.id}
              position={[lat, lng]}
              icon={createIcon(color, label, isSelected)}
              eventHandlers={{
                click: (e) => handleMarkerClick(bus.id, e),
              }}
            />
          );
        })}
      </MapContainer>

      {/* Floating info panel — overlaid on top of the map, outside MapContainer DOM */}
      {selectedBus && (
        <BusInfoPanel
          bus={selectedBus}
          label={getBusLabel(selectedBus, selectedIndex)}
          onClose={() => setSelectedBusId(null)}
        />
      )}
    </div>
  );
}
