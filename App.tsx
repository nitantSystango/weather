import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { TimelineScrubber } from './components/TimelineScrubber';
import { LocationPanel } from './components/LocationPanel';
import { GlobeScene } from './components/GlobeScene';
import { GlassPanel } from './components/GlassPanel';
import { weatherService } from './services/weatherService';
import { WeatherLocation } from './types';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [locations, setLocations] = useState<WeatherLocation[]>([]);
  const [selectedHour, setSelectedHour] = useState(0);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dataSource, setDataSource] = useState<'ZEUS_NODE' | 'ZEUS' | 'CONNECTING'>('ZEUS');
  const [clickedCoordinates, setClickedCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoadingCoordinates, setIsLoadingCoordinates] = useState(false);
  
  // Refs for loop
  const intervalRef = useRef<number | null>(null);

  // Playback Logic
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = window.setInterval(() => {
        setSelectedHour(prev => {
          if (prev >= 23) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 500); // 0.5s per hour
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  // Derived
  const selectedLocation = locations.find(l => l.id === selectedLocationId) || null;
  const currentTimestamp = selectedLocation?.forecast[selectedHour]?.timestamp || 
                          locations[0]?.forecast[selectedHour]?.timestamp || 
                          new Date().toISOString();

  // Handlers
  const handleLocationSelect = (id: string) => {
    setSelectedLocationId(prev => prev === id ? null : id); // Toggle
    setClickedCoordinates(null); // Clear coordinate selection when selecting a location
  };

  const handleClosePanel = () => {
    setSelectedLocationId(null);
    setClickedCoordinates(null);
  };

  const handleGlobeClick = async (latitude: number, longitude: number) => {
    setClickedCoordinates({ latitude, longitude });
    setSelectedLocationId(null); // Clear location selection
    setIsLoadingCoordinates(true);
    
    try {
      const response = await weatherService.getWeatherByCoordinates(latitude, longitude);
      
      if (response.location) {
        // Add or update the location in the locations array
        setLocations(prev => {
          const existingIndex = prev.findIndex(loc => 
            Math.abs(loc.latitude - latitude) < 0.01 && 
            Math.abs(loc.longitude - longitude) < 0.01
          );
          
          if (existingIndex >= 0) {
            // Update existing location
            const updated = [...prev];
            updated[existingIndex] = response.location!;
            return updated;
          } else {
            // Add new location
            return [...prev, response.location!];
          }
        });
        
        // Select the newly added/updated location
        setSelectedLocationId(response.location.id);
        setDataSource(response.source);
      }
    } catch (error) {
      console.error('Error fetching weather for coordinates:', error);
    } finally {
      setIsLoadingCoordinates(false);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-space-950 font-sans selection:bg-accent-cyan/30 text-slate-100">
      
      {/* 3D Background */}
      <GlobeScene 
        locations={locations} 
        selectedHour={selectedHour}
        onLocationSelect={handleLocationSelect}
        selectedLocationId={selectedLocationId}
        onGlobeClick={handleGlobeClick}
        clickedCoordinates={clickedCoordinates}
      />

      {/* UI Overlay Layer */}
      <Header />
      
      {/* Loading Overlay - Only show when fetching data for clicked location */}
      {isLoadingCoordinates && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-space-950/80 backdrop-blur-sm">
           <GlassPanel className="p-8 flex flex-col items-center gap-4">
             <Loader2 className="w-10 h-10 text-accent-cyan animate-spin" />
             <div className="text-center">
               <h3 className="text-lg font-display font-bold text-white">
                 FETCHING WEATHER DATA
               </h3>
               <p className="text-xs font-mono text-slate-400 mt-1">
                 {clickedCoordinates 
                   ? `Loading data for ${clickedCoordinates.latitude.toFixed(2)}°, ${clickedCoordinates.longitude.toFixed(2)}°...`
                   : 'Connecting to Zeus API...'}
               </p>
             </div>
           </GlassPanel>
        </div>
      )}
      
      <LocationPanel 
        location={selectedLocation} 
        currentHour={selectedHour} 
        onClose={handleClosePanel} 
      />

      <TimelineScrubber 
        currentHour={selectedHour} 
        onHourChange={setSelectedHour}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
      />

      <Footer currentTime={currentTimestamp} dataSource={dataSource} />

      {/* Decorative Overlays (Vignette) */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />
      
    </div>
  );
};

export default App;