import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { WeatherLocation } from '../types';

// Fix for missing R3F types in JSX
declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: any;
      sphereGeometry: any;
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      meshPhongMaterial: any;
      group: any;
      line: any;
      bufferGeometry: any;
      float32BufferAttribute: any;
      lineBasicMaterial: any;
      fog: any;
      ambientLight: any;
      hemisphereLight: any;
      pointLight: any;
      directionalLight: any;
    }
  }
}

// --- Types ---
interface GlobeSceneProps {
  locations: WeatherLocation[];
  selectedHour: number;
  onLocationSelect: (id: string) => void;
  selectedLocationId: string | null;
  onGlobeClick?: (latitude: number, longitude: number) => void;
  clickedCoordinates?: { latitude: number; longitude: number } | null;
}

// --- Utils ---
const latLngToVector3 = (lat: number, lng: number, radius: number): THREE.Vector3 => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius) * Math.sin(phi) * Math.cos(theta);
  const z = (radius) * Math.sin(phi) * Math.sin(theta);
  const y = (radius) * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
};

// Convert 3D point on sphere to lat/long
const vector3ToLatLng = (point: THREE.Vector3, radius: number): { latitude: number; longitude: number } => {
  const normalized = point.clone().normalize();
  
  // Calculate latitude: -90 to 90 degrees
  const latitude = 90 - (Math.acos(Math.max(-1, Math.min(1, normalized.y))) * 180 / Math.PI);
  
  // Calculate longitude: -180 to 180 degrees
  let longitude = (Math.atan2(normalized.z, -normalized.x) * 180 / Math.PI);
  
  // Normalize longitude to -180 to 180 range
  while (longitude > 180) longitude -= 360;
  while (longitude < -180) longitude += 360;
  
  // Clamp to valid ranges
  const clampedLatitude = Math.max(-90, Math.min(90, latitude));
  const clampedLongitude = Math.max(-180, Math.min(180, longitude));
  
  return { latitude: clampedLatitude, longitude: clampedLongitude };
};

const getRiskColor = (score: number) => {
  if (score > 0.7) return new THREE.Color('#dc2626');
  if (score > 0.4) return new THREE.Color('#f97316');
  if (score > 0.2) return new THREE.Color('#f59e0b');
  return new THREE.Color('#10b981');
};

// --- Components ---

const GlobeMesh: React.FC<{ onGlobeClick?: (lat: number, lng: number) => void }> = ({ onGlobeClick }) => {
  const [textures, setTextures] = useState<{
    earthTexture: THREE.Texture | null;
    earthBumpMap: THREE.Texture | null;
    earthSpecularMap: THREE.Texture | null;
    earthNightMap: THREE.Texture | null;
  }>({
    earthTexture: null,
    earthBumpMap: null,
    earthSpecularMap: null,
    earthNightMap: null
  });
  const [texturesLoaded, setTexturesLoaded] = useState(false);

  // Load textures asynchronously - doesn't block initial render
  useEffect(() => {
    let mounted = true;
    const loader = new THREE.TextureLoader();
    
    // Load all textures in parallel
    Promise.all([
      new Promise<THREE.Texture | null>((resolve) => {
        loader.load(
          'https://raw.githubusercontent.com/mrdoob/three.js/r129/examples/textures/planets/earth_atmos_2048.jpg',
          (texture) => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.anisotropy = 16;
            resolve(texture);
          },
          undefined,
          () => resolve(null) // On error, resolve with null
        );
      }),
      new Promise<THREE.Texture | null>((resolve) => {
        loader.load(
          'https://raw.githubusercontent.com/mrdoob/three.js/r129/examples/textures/planets/earth_normal_2048.jpg',
          (texture) => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.anisotropy = 16;
            resolve(texture);
          },
          undefined,
          () => resolve(null)
        );
      }),
      new Promise<THREE.Texture | null>((resolve) => {
        loader.load(
          'https://raw.githubusercontent.com/mrdoob/three.js/r129/examples/textures/planets/earth_specular_2048.jpg',
          (texture) => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.anisotropy = 16;
            resolve(texture);
          },
          undefined,
          () => resolve(null)
        );
      }),
      new Promise<THREE.Texture | null>((resolve) => {
        loader.load(
          'https://raw.githubusercontent.com/mrdoob/three.js/r129/examples/textures/planets/earth_lights_2048.jpg',
          (texture) => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.anisotropy = 16;
            resolve(texture);
          },
          undefined,
          () => resolve(null)
        );
      })
    ]).then(([tex1, tex2, tex3, tex4]) => {
      if (mounted) {
        setTextures({
          earthTexture: tex1,
          earthBumpMap: tex2,
          earthSpecularMap: tex3,
          earthNightMap: tex4
        });
        // Only mark as loaded if we got at least the main texture
        if (tex1) {
          setTexturesLoaded(true);
        }
      }
    }).catch((error) => {
      console.warn('Some textures failed to load:', error);
      // Keep fallback material
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleDoubleClick = (event: any) => {
    if (!onGlobeClick) return;
    
    // R3F's onDoubleClick event provides intersection data
    const intersection = event.intersections?.[0];
    if (intersection && intersection.point) {
      const { latitude, longitude } = vector3ToLatLng(intersection.point, 4.5);
      onGlobeClick(latitude, longitude);
      event.stopPropagation();
    }
  };

  return (
    <mesh 
      onDoubleClick={handleDoubleClick}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'auto'}
    >
      <sphereGeometry args={[4.5, 128, 128]} />
      {texturesLoaded && textures.earthTexture ? (
        // Realistic Earth texture material
        <meshPhongMaterial
          map={textures.earthTexture}
          bumpMap={textures.earthBumpMap || undefined}
          bumpScale={0.1}
          specularMap={textures.earthSpecularMap || undefined}
          specular={new THREE.Color(0x333333)}
          emissiveMap={textures.earthNightMap || undefined}
          emissive={new THREE.Color(0x000000)}
          emissiveIntensity={0.4}
          shininess={15}
          transparent={false}
        />
      ) : (
        // Fallback material - shows immediately while textures load
        <meshStandardMaterial 
          color="#1a4d8c" 
          emissive="#0a1f3a"
          emissiveIntensity={0.3}
          roughness={0.7}
          metalness={0.2}
        />
      )}
    </mesh>
  );
};

// Atmospheric glow effect
const AtmosphereGlow = () => {
  return (
    <mesh>
      <sphereGeometry args={[4.52, 64, 64]} />
      <meshBasicMaterial 
        color="#4a90e2" 
        transparent 
        opacity={0.15}
        side={THREE.BackSide}
      />
    </mesh>
  );
};

const ClickedCoordinateMarker: React.FC<{ 
  coordinates: { latitude: number; longitude: number } | null;
}> = ({ coordinates }) => {
  if (!coordinates) return null;
  
  const pos = latLngToVector3(coordinates.latitude, coordinates.longitude, 4.5);
  const color = new THREE.Color('#00d9ff');
  
  return (
    <group position={pos}>
      {/* Pulsing marker for clicked coordinate */}
      <mesh>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      
      {/* Outer glow ring */}
      <mesh>
        <ringGeometry args={[0.15, 0.25, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      
      {/* Label */}
      <Html distanceFactor={12} zIndexRange={[100, 0]}>
        <div className="bg-space-950/90 text-white px-3 py-1.5 rounded-md text-xs font-mono border border-accent-cyan/30 whitespace-nowrap shadow-[0_0_15px_rgba(0,217,255,0.3)] backdrop-blur-md transform translate-y-4">
          {coordinates.latitude.toFixed(2)}°, {coordinates.longitude.toFixed(2)}°
        </div>
      </Html>
    </group>
  );
};

const LocationMarkers: React.FC<{ 
  locations: WeatherLocation[]; 
  hour: number;
  onSelect: (id: string) => void;
  selectedId: string | null;
}> = ({ locations, hour, onSelect, selectedId }) => {
  
  return (
    <group>
      {locations.map((loc) => {
        const pos = latLngToVector3(loc.latitude, loc.longitude, 4.5);
        const data = loc.forecast[hour];
        const color = getRiskColor(data.riskScore);
        const isSelected = selectedId === loc.id;
        
        return (
          <group key={loc.id} position={pos}>
            {/* The Marker Dot */}
            <mesh 
              onClick={(e) => { e.stopPropagation(); onSelect(loc.id); }}
              onPointerOver={() => document.body.style.cursor = 'pointer'}
              onPointerOut={() => document.body.style.cursor = 'auto'}
            >
              <sphereGeometry args={[isSelected ? 0.12 : 0.08, 16, 16]} />
              <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>

            {/* Glow Halo */}
            <mesh>
               <sphereGeometry args={[isSelected ? 0.3 : 0.2, 16, 16]} />
               <meshBasicMaterial color={color} transparent opacity={0.4} toneMapped={false} />
            </mesh>
            
            {/* Height Line (Stick) connecting to center - Visual anchor */}
            {isSelected && (
               <line>
                <bufferGeometry>
                   <float32BufferAttribute attach="attributes-position" count={2} array={new Float32Array([0,0,0, -pos.x * 0.15, -pos.y * 0.15, -pos.z * 0.15])} itemSize={3} />
                </bufferGeometry>
                <lineBasicMaterial color={color} transparent opacity={0.6} linewidth={2} />
              </line>
            )}

            {/* Label */}
            {isSelected && (
              <Html distanceFactor={12} zIndexRange={[100, 0]}>
                <div className="bg-space-950/90 text-white px-3 py-1.5 rounded-md text-xs font-mono border border-accent-cyan/30 whitespace-nowrap shadow-[0_0_15px_rgba(0,217,255,0.3)] backdrop-blur-md transform translate-y-4">
                  {loc.name}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
};

const CameraController: React.FC<{ selectedLocation: WeatherLocation | null }> = ({ selectedLocation }) => {
  const { controls } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (selectedLocation && controlsRef.current) {
      controlsRef.current.autoRotate = false;
      // Ideally we would animate camera to look at the new vector here,
      // but standard OrbitControls doesn't support smooth transition nicely without external libs.
      // Auto-rotate disable allows user to inspect.
    } else if (controlsRef.current) {
        controlsRef.current.autoRotate = true;
    }
  }, [selectedLocation]);

  return (
    <OrbitControls 
      ref={controlsRef}
      enablePan={false}
      enableZoom={true}
      minDistance={6}
      maxDistance={20}
      autoRotate={true}
      autoRotateSpeed={0.8}
      dampingFactor={0.05}
    />
  );
};


// --- Main Scene ---

export const GlobeScene: React.FC<GlobeSceneProps> = ({ 
  locations, 
  selectedHour, 
  onLocationSelect, 
  selectedLocationId,
  onGlobeClick,
  clickedCoordinates
}) => {
  const selectedLoc = useMemo(() => locations.find(l => l.id === selectedLocationId) || null, [locations, selectedLocationId]);

  return (
    <div className="w-full h-full absolute inset-0 bg-space-950">
      <Canvas camera={{ position: [0, 0, 14], fov: 45 }}>
        {/* Adjusted fog to not occlude the globe (starts at 15 units away) */}
        <fog attach="fog" args={['#05070f', 15, 40]} />
        
        {/* Lights - Realistic sunlight simulation */}
        <ambientLight intensity={0.3} />
        <directionalLight 
          position={[20, 10, 5]} 
          intensity={1.5} 
          color="#ffffff"
          castShadow={false}
        />
        <pointLight position={[20, 10, 10]} intensity={0.8} color="#ffffff" distance={50} />
        <pointLight position={[-15, -10, 5]} intensity={0.3} color="#4a90e2" distance={50} />
        
        {/* Environment */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        {/* Globe Group */}
        <group>
            <GlobeMesh onGlobeClick={onGlobeClick} />
            <AtmosphereGlow />
            <LocationMarkers 
              locations={locations} 
              hour={selectedHour} 
              onSelect={onLocationSelect} 
              selectedId={selectedLocationId}
            />
            <ClickedCoordinateMarker coordinates={clickedCoordinates || null} />
        </group>

        {/* Controls */}
        <CameraController selectedLocation={selectedLoc} />
      </Canvas>
    </div>
  );
};