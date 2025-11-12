import { useMemo, useCallback, useState, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'btcon_qr_color_assignments';

const DEVELOPER_ADDRESSES = [
  'bc1qdff8680vyy0qthr5vpe3ywzw48r8rr4jn4jvac',
  'bc1qh78w8awednuw3336fnwcnr0sr4q5jxu980eyyd',
];

interface ColorAssignments {
  [address: string]: string;
}

const generateColorFromAddress = (address: string): string => {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  
  const hue = Math.abs(hash) % 360;
  const saturation = 70 + (Math.abs(hash >> 8) % 25);
  const lightness = 45 + (Math.abs(hash >> 16) % 15);
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
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
    
    const isDeveloper = DEVELOPER_ADDRESSES.includes(address);
    
    if (isDeveloper) {
      return { background: '#FFFFFF', qr: '#FF8C00' };
    }
    
    if (colorAssignments[address]) {
      return { background: '#FFFFFF', qr: colorAssignments[address] };
    }
    
    const newColor = generateColorFromAddress(address);
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
