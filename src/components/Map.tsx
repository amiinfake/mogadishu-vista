import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapButton } from './ui/map-button';
import { Search, MapPin, Camera, Upload, Menu, Navigation } from 'lucide-react';
import { Input } from './ui/input';
import { toast } from 'sonner';

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [isStreetView, setIsStreetView] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock street view locations in Mogadishu
  const streetViewLocations = [
    { lng: 45.3254, lat: 2.0469, title: "Bakaara Market" },
    { lng: 45.3431, lat: 2.0469, title: "Aden Adde International Airport" },
    { lng: 45.3311, lat: 2.0394, title: "Villa Somalia" },
    { lng: 45.3200, lat: 2.0500, title: "Liido Beach" }
  ];

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Initialize map centered on Mogadishu
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [45.3254, 2.0469], // Mogadishu coordinates
      zoom: 12,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add street view markers
    streetViewLocations.forEach(location => {
      const marker = new mapboxgl.Marker({
        color: '#0ea5e9',
        scale: 0.8
      })
        .setLngLat([location.lng, location.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div class="p-2">
                <h3 class="font-medium">${location.title}</h3>
                <p class="text-sm text-muted-foreground">360° Street View Available</p>
              </div>
            `)
        )
        .addTo(map.current!);
    });

    toast.success("Mogadishu map loaded successfully!");

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Mock search functionality
    toast.info(`Searching for "${searchQuery}" in Mogadishu...`);
    
    // For demo, center on first street view location
    if (map.current) {
      map.current.flyTo({
        center: [streetViewLocations[0].lng, streetViewLocations[0].lat],
        zoom: 16,
        duration: 2000
      });
    }
  };

  const toggleStreetView = () => {
    setIsStreetView(!isStreetView);
    toast.info(isStreetView ? "Map view enabled" : "Street view mode enabled");
  };

  const handleUpload = () => {
    setShowUpload(!showUpload);
  };

  if (!mapboxToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-xl shadow-medium p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Mogadishu Maps</h1>
            <p className="text-muted-foreground">Enter your Mapbox token to get started</p>
          </div>
          
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter Mapbox Public Token"
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Get your token from{' '}
              <a 
                href="https://mapbox.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                mapbox.com
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

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

      {/* Street View Toggle */}
      <div className="absolute top-20 right-4 z-10">
        <MapButton
          variant={isStreetView ? "streetview" : "floating"}
          size="floating"
          onClick={toggleStreetView}
          className="mb-3"
        >
          <Camera className="w-5 h-5" />
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
                {isStreetView ? "Street View Mode" : "Explore Mogadishu"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isStreetView 
                  ? "Click on blue markers to view 360° images" 
                  : "Navigate and discover the capital of Somalia"
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

      {/* Upload Modal Overlay */}
      {showUpload && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-20 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-strong p-6 max-w-md w-full animate-slide-up">
            <h3 className="text-lg font-semibold text-foreground mb-4">Add 360° Street View</h3>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Upload 360° camera images (.jpg, .png)
                </p>
              </div>
              <div className="flex gap-3">
                <MapButton variant="outline" className="flex-1" onClick={() => setShowUpload(false)}>
                  Cancel
                </MapButton>
                <MapButton variant="primary" className="flex-1">
                  Upload
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