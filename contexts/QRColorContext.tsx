import { useState, useCallback, useMemo, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'btcon_qr_style';

export type QRStyle = 'classic' | 'rounded' | 'dots' | 'minimal';

const DEFAULT_STYLE: QRStyle = 'classic';

export const [QRColorProvider, useQRColor] = createContextHook(() => {
  const [qrStyle, setQRStyle] = useState<QRStyle>(DEFAULT_STYLE);
  const [isLoading, setIsLoading] = useState(true);

  const loadStyle = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setQRStyle(stored as QRStyle);
      }
    } catch (error) {
      console.error('Error loading QR style:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveStyle = useCallback(async (newStyle: QRStyle): Promise<{ success: boolean; error?: string }> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newStyle);
      setQRStyle(newStyle);
      return { success: true };
    } catch (error) {
      console.error('Error saving QR style:', error);
      return { success: false, error: 'Erreur lors de la sauvegarde' };
    }
  }, []);

  useEffect(() => {
    loadStyle();
  }, []);

  return useMemo(() => ({
    qrStyle,
    isLoading,
    saveStyle,
  }), [qrStyle, isLoading, saveStyle]);
});
