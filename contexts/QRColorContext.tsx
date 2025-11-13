import { useMemo, useCallback, useState, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'btcon_qr_color_assignments';

interface ColorAssignments {
  [address: string]: string;
}

const COLOR_PALETTE = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DFE6E9',
  '#00B894',
  '#0984E3',
  '#6C5CE7',
  '#FD79A8',
  '#FDCB6E',
  '#E17055',
  '#74B9FF',
  '#A29BFE',
  '#FF7675',
  '#FF8C00',
  '#55EFC4',
  '#81ECEC',
  '#FAB1A0',
  '#FF85A2',
];

const generateColorFromAddress = (address: string): string => {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  
  const colorIndex = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[colorIndex];
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
