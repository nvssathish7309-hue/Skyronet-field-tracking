import React, { createContext, useContext, useEffect, useState } from 'react';

interface GoogleMapsContextType {
  isLoaded: boolean;
  apiKey: string;
  hasKey: boolean;
}

const GoogleMapsContext = createContext<GoogleMapsContextType | undefined>(undefined);

export const GoogleMapsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const hasKey = !!apiKey && apiKey.length > 5;

  useEffect(() => {
    if (!hasKey) {
      setIsLoaded(false);
      return;
    }

    if ((window as any).google && (window as any).google.maps) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => setIsLoaded(false);

    document.head.appendChild(script);

    return () => {
      // script cleanup if unmounted before load
    };
  }, [apiKey, hasKey]);

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, apiKey, hasKey }}>
      {children}
    </GoogleMapsContext.Provider>
  );
};

export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider');
  }
  return context;
};
