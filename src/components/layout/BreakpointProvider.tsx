import React, { createContext, useContext, useEffect, useState } from 'react';

interface BreakpointContextType {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  width: number;
  height: number;
}

const BreakpointContext = createContext<BreakpointContextType | undefined>(undefined);

interface BreakpointProviderProps {
  children: React.ReactNode;
}

export const BreakpointProvider: React.FC<BreakpointProviderProps> = ({ children }) => {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = dimensions.width < 768;
  const isTablet = dimensions.width >= 768 && dimensions.width < 1024;
  const isDesktop = dimensions.width >= 1024 && dimensions.width < 1440;
  const isWide = dimensions.width >= 1440;

  const value: BreakpointContextType = {
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    width: dimensions.width,
    height: dimensions.height,
  };

  return (
    <BreakpointContext.Provider value={value}>
      {children}
    </BreakpointContext.Provider>
  );
};

export const useBreakpoint = (): BreakpointContextType => {
  const context = useContext(BreakpointContext);
  if (context === undefined) {
    throw new Error('useBreakpoint must be used within a BreakpointProvider');
  }
  return context;
};