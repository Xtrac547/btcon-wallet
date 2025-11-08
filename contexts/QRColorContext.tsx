import { useState, useCallback, useMemo, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'btcon_qr_colors';

interface QRColors {
  background: string;
  qr: string;
}

const DEFAULT_COLORS: QRColors = {
  background: '#000000',
  qr: '#FF8C00',
};

export const [QRColorProvider, useQRColor] = createContextHook(() => {
  const [colors, setColors] = useState<QRColors>(DEFAULT_COLORS);
  const [isLoading, setIsLoading] = useState(true);

  const loadColors = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setColors(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading QR colors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveColors = useCallback(async (newColors: QRColors): Promise<{ success: boolean; error?: string }> => {
    try {
      if (newColors.background.toLowerCase() === newColors.qr.toLowerCase()) {
        return { success: false, error: 'Les couleurs de fond et QR ne peuvent pas être identiques' };
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newColors));
      setColors(newColors);
      return { success: true };
    } catch (error) {
      console.error('Error saving QR colors:', error);
      return { success: false, error: 'Erreur lors de la sauvegarde' };
    }
  }, []);

  useEffect(() => {
    loadColors();
  }, []);

  return useMemo(() => ({
    colors,
    isLoading,
    saveColors,
  }), [colors, isLoading, saveColors]);
});
