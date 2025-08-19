
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapButton } from './ui/map-button';
import { Search, MapPin, Camera, Upload, Menu, Navigation, Layers, Compass } from 'lucide-react';
import { Input } from './ui/input';
import { toast } from 'sonner';

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isStreetView, setIsStreetView] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{lng: number, lat: number} | null>(null);
  const [streetViewMarkers, setStreetViewMarkers] = useState<mapboxgl.Marker[]>([]);

  // Your Mapbox token
  const MAPBOX_TOKEN = "pk.eyJ1IjoiYW1paW5yIiwiYSI6ImNtMzZndWt3NTA0cGsybXMyaW4zajlnOGcifQ.7kA7CsbYlM3h3Mi36UX5Ew";

  // Enhanced street view locations with more detail
  const streetViewLocations = [
    { lng: 45.3254, lat: 2.0469, title: "Bakaara Market", description: "Main commercial district", hasStreetView: true },
    { lng: 45.3431, lat: 2.0469, title: "Aden Adde International Airport", description: "Main airport terminal", hasStreetView: true },
    { lng: 45.3311, lat: 2.0394, title: "Villa Somalia", description: "Presidential palace", hasStreetView: true },
    { lng: 45.3200, lat: 2.0500, title: "Liido Beach", description: "Popular beach area", hasStreetView: true },
    { lng: 45.3180, lat: 2.0450, title: "Mogadishu Port", description: "Main seaport", hasStreetView: true },
    { lng: 45.3350, lat: 2.0380, title: "Banadir Hospital", description: "Main hospital", hasStreetView: true },
    { lng: 45.3280, lat: 2.0420, title: "Central Mosque", description: "Historic mosque", hasStreetView: true },
    { lng: 45.3150, lat: 2.0480, title: "Fish Market", description: "Local fish market", hasStreetView: true }
  ];

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map with your token
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [45.3254, 2.0469], // Mogadishu coordinates
      zoom: 13,
      pitch: 45,
      bearing: -17.6,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
        showZoom: true,
        showCompass: true
      }),
      'top-right'
    );

    // Add geolocate control
    const geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    });
    map.current.addControl(geolocateControl, 'top-right');

    // Add scale control
    map.current.addControl(new mapboxgl.ScaleControl({
      maxWidth: 80,
      unit: 'metric'
    }), 'bottom-left');

    // Wait for map to load before adding sources and layers
    map.current.on('load', () => {
      if (!map.current) return;

      // Add street view route layer
      map.current.addSource('street-routes', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: [
                  [45.3254, 2.0469], // Bakaara Market
                  [45.3280, 2.0450], // Central area
                  [45.3311, 2.0394], // Villa Somalia
                  [45.3350, 2.0380], // Hospital area
                  [45.3431, 2.0469], // Airport
                ]
              },
              properties: {
                'street-view': true
              }
            },
            {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: [
                  [45.3200, 2.0500], // Liido Beach
                  [45.3180, 2.0450], // Port area
                  [45.3150, 2.0480], // Fish Market
                  [45.3254, 2.0469], // Back to center
                ]
              },
              properties: {
                'street-view': true
              }
            }
          ]
        }
      });

      // Add street view route styling
      map.current.addLayer({
        id: 'street-routes-line',
        type: 'line',
        source: 'street-routes',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#0ea5e9',
          'line-width': 4,
          'line-opacity': 0.8
        }
      });

      // Add animated street view route
      map.current.addLayer({
        id: 'street-routes-glow',
        type: 'line',
        source: 'street-routes',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#0ea5e9',
          'line-width': 8,
          'line-opacity': 0.3,
          'line-blur': 2
        }
      });
    });

    // Add street view markers with enhanced interaction
    const markers: mapboxgl.Marker[] = [];
    streetViewLocations.forEach((location, index) => {
      const el = document.createElement('div');
      el.className = 'street-view-marker';
      el.innerHTML = `
        <div style="
          width: 40px;
          height: 40px;
          background: linear-gradient(145deg, #0ea5e9, #0284c7);
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
          transition: transform 0.2s ease;
        ">
          <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      `;

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.1)';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([location.lng, location.lat])
        .setPopup(
          new mapboxgl.Popup({ 
            offset: 25,
            closeButton: false,
            className: 'street-view-popup'
          })
            .setHTML(`
              <div class="p-3">
                <h3 class="font-semibold text-foreground mb-1">${location.title}</h3>
                <p class="text-sm text-muted-foreground mb-2">${location.description}</p>
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span class="text-xs text-green-600">360° Street View Available</span>
                </div>
              </div>
            `)
        )
        .addTo(map.current!);

      markers.push(marker);
    });

    setStreetViewMarkers(markers);

    toast.success("Interactive Mogadishu map loaded successfully!");

    return () => {
      markers.forEach(marker => marker.remove());
      map.current?.remove();
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Enhanced search functionality
    const searchTerm = searchQuery.toLowerCase();
    const foundLocation = streetViewLocations.find(location => 
      location.title.toLowerCase().includes(searchTerm) ||
      location.description.toLowerCase().includes(searchTerm)
    );

    if (foundLocation && map.current) {
      map.current.flyTo({
        center: [foundLocation.lng, foundLocation.lat],
        zoom: 17,
        pitch: 60,
        duration: 2000
      });
      toast.success(`Found "${foundLocation.title}"`);
    } else {
      toast.info(`Searching for "${searchQuery}" in Mogadishu...`);
    }
  };

  const toggleStreetView = () => {
    setIsStreetView(!isStreetView);
    
    if (map.current) {
      if (!isStreetView) {
        // Enable street view mode - show routes more prominently
        map.current.setPaintProperty('street-routes-line', 'line-width', 6);
        map.current.setPaintProperty('street-routes-glow', 'line-width', 12);
        map.current.setPaintProperty('street-routes-glow', 'line-opacity', 0.5);
        
        // Adjust camera for street view
        map.current.flyTo({
          pitch: 60,
          zoom: 16,
          duration: 1000
        });
        
        toast.success("Street view mode enabled - Click blue markers for 360° views");
      } else {
        // Disable street view mode
        map.current.setPaintProperty('street-routes-line', 'line-width', 4);
        map.current.setPaintProperty('street-routes-glow', 'line-width', 8);
        map.current.setPaintProperty('street-routes-glow', 'line-opacity', 0.3);
        
        map.current.flyTo({
          pitch: 45,
          zoom: 13,
          duration: 1000
        });
        
        toast.info("Map view enabled");
      }
    }
  };

  const handleUpload = () => {
    setShowUpload(!showUpload);
  };

  const centerOnMogadishu = () => {
    if (map.current) {
      map.current.flyTo({
        center: [45.3254, 2.0469],
        zoom: 13,
        pitch: 45,
        bearing: -17.6,
        duration: 2000
      });
    }
  };

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden">
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Header Controls */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="bg-gradient-glass backdrop-blur-xl rounded-xl px-4 py-2 border border-border/30">
            <h1 className="text-lg font-bold text-foreground">Mogadishu Maps</h1>
          </div>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search locations in Mogadishu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card/95 backdrop-blur-md border-border/50"
              />
            </div>
          </form>
          
          {/* Menu Button */}
          <MapButton variant="floating" size="floating">
            <Menu className="w-5 h-5" />
          </MapButton>
        </div>
      </div>

      {/* Side Controls */}
      <div className="absolute top-20 right-4 z-10 flex flex-col gap-3">
        {/* Street View Toggle */}
        <MapButton
          variant={isStreetView ? "streetview" : "floating"}
          size="floating"
          onClick={toggleStreetView}
        >
          <Camera className="w-5 h-5" />
        </MapButton>

        {/* Layers Button */}
        <MapButton variant="floating" size="floating">
          <Layers className="w-5 h-5" />
        </MapButton>

        {/* Center on Mogadishu */}
        <MapButton variant="floating" size="floating" onClick={centerOnMogadishu}>
          <Compass className="w-5 h-5" />
        </MapButton>
      </div>

      {/* Upload Button */}
      <div className="absolute bottom-20 right-4 z-10">
        <MapButton
          variant="primary"
          size="floating"
          onClick={handleUpload}
          className="animate-float"
        >
          <Upload className="w-5 h-5" />
        </MapButton>
      </div>

      {/* Bottom Info Panel */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="bg-gradient-glass backdrop-blur-xl rounded-xl p-4 border border-border/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-foreground">
                {isStreetView ? "Street View Mode Active" : "Explore Mogadishu"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isStreetView 
                  ? "Navigate blue routes and click markers for 360° street views" 
                  : `${streetViewLocations.length} locations with street view available`
                }
              </p>
            </div>
            <MapButton variant="outline" size="sm">
              <Navigation className="w-4 h-4 mr-2" />
              Get Directions
            </MapButton>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-20 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-strong p-6 max-w-md w-full animate-slide-up">
            <h3 className="text-lg font-semibold text-foreground mb-4">Add 360° Street View</h3>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Upload 360° camera images
                </p>
                <p className="text-xs text-muted-foreground">
                  Supported cameras: Ricoh Theta, GoPro Max, Insta360
                </p>
              </div>
              <div className="flex gap-3">
                <MapButton variant="outline" className="flex-1" onClick={() => setShowUpload(false)}>
                  Cancel
                </MapButton>
                <MapButton variant="primary" className="flex-1">
                  Upload Images
                </MapButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;
