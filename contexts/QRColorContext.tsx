import { useMemo, useCallback, useState, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'btcon_qr_color_assignments';

interface ColorAssignments {
  [address: string]: string;
}

const USED_COLORS = new Set<string>();

const DEVELOPER_COLORS = {
  foreground: '#0047AB',
  background: '#FFD700',
};

const generateUniqueColor = (): string => {
  const maxAttempts = 1000;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 50 + Math.floor(Math.random() * 30);
    const lightness = 35 + Math.floor(Math.random() * 25);
    
    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    
    if (!USED_COLORS.has(color)) {
      USED_COLORS.add(color);
      return color;
    }
  }
  
  const timestamp = Date.now();
  const hue = timestamp % 360;
  const color = `hsl(${hue}, 65%, 45%)`;
  USED_COLORS.add(color);
  return color;
};

const isDeveloper = (address: string): boolean => {
  const developerAddresses = [
    'bc1qdff8680vyy0qthr5vpe3ywzw48r8rr4jn4jvac',
    'bc1qh78w8awednuw3336fnwcnr0sr4q5jxu980eyyd',
  ];
  return developerAddresses.includes(address);
};

export const [QRColorProvider, useQRColor] = createContextHook(() => {
  const [colorAssignments, setColorAssignments] = useState<ColorAssignments>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadColorAssignments = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: ColorAssignments = JSON.parse(stored);
          setColorAssignments(parsed);
          
          Object.values(parsed).forEach(color => {
            USED_COLORS.add(color);
          });
        }
      } catch (error) {
        console.error('Error loading color assignments:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadColorAssignments();
  }, []);

  const saveColorAssignments = async (assignments: ColorAssignments) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
    } catch (error) {
      console.error('Error saving color assignments:', error);
    }
  };

  const getQRColors = useCallback((address: string | null) => {
    if (!address) {
      return { background: '#FFFFFF', qr: '#000000' };
    }
    
    if (isDeveloper(address)) {
      return { 
        background: DEVELOPER_COLORS.background, 
        qr: DEVELOPER_COLORS.foreground 
      };
    }
    
    if (colorAssignments[address]) {
      return { background: '#FFFFFF', qr: colorAssignments[address] };
    }
    
    const newColor = generateUniqueColor();
    const newAssignments = { ...colorAssignments, [address]: newColor };
    setColorAssignments(newAssignments);
    saveColorAssignments(newAssignments);
    
    return { background: '#FFFFFF', qr: newColor };
  }, [colorAssignments]);

  return useMemo(() => ({
    getQRColors,
    isLoaded,
  }), [getQRColors, isLoaded]);
});
