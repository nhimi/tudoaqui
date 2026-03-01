import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapUpdater({ route }) {
  const map = useMap();
  
  useEffect(() => {
    if (route && route.pickup && route.destination) {
      const bounds = L.latLngBounds(
        [route.pickup.lat, route.pickup.lng],
        [route.destination.lat, route.destination.lng]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [route, map]);
  
  return null;
}

export const TaxiMap = ({ route }) => {
  if (!route || !route.pickup || !route.destination) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Carregando mapa...</p>
      </div>
    );
  }

  const center = [
    (route.pickup.lat + route.destination.lat) / 2,
    (route.pickup.lng + route.destination.lng) / 2
  ];

  // Criar linha da rota
  const routeCoordinates = route.steps.map(step => [step.lat, step.lng]);
  routeCoordinates.unshift([route.pickup.lat, route.pickup.lng]);
  routeCoordinates.push([route.destination.lat, route.destination.lng]);

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden shadow-lg" data-testid="taxi-map">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Marcador de origem */}
        <Marker position={[route.pickup.lat, route.pickup.lng]}>
          <Popup>
            <div className="text-center">
              <p className="font-bold text-green-600">📍 Origem</p>
              <p className="text-sm">Ponto de partida</p>
            </div>
          </Popup>
        </Marker>

        {/* Marcador de destino */}
        <Marker position={[route.destination.lat, route.destination.lng]}>
          <Popup>
            <div className="text-center">
              <p className="font-bold text-red-600">🎯 Destino</p>
              <p className="text-sm">Ponto final</p>
            </div>
          </Popup>
        </Marker>

        {/* Linha da rota */}
        <Polyline
          positions={routeCoordinates}
          color="#D62828"
          weight={4}
          opacity={0.7}
        />

        <MapUpdater route={route} />
      </MapContainer>
    </div>
  );
};