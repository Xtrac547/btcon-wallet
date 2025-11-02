import { useState, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

const STORAGE_KEYS = {
  AUTH_CONFIGURED: 'btcon_auth_configured',
  AUTH_TYPE: 'btcon_auth_type',
  PIN_CODE: 'btcon_pin_code',
  IS_AUTHENTICATED: 'btcon_is_authenticated',
};

type AuthType = 'pin' | 'pin-biometric' | null;

interface AuthState {
  isAuthConfigured: boolean;
  authType: AuthType;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBiometricAvailable: boolean;
  useBiometric: boolean;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [state, setState] = useState<AuthState>({
    isAuthConfigured: false,
    authType: null,
    isAuthenticated: false,
    isLoading: true,
    isBiometricAvailable: false,
    useBiometric: false,
  });

  const secureStorageAvailable = Platform.OS !== 'web';

  const storeSecurely = async (key: string, value: string) => {
    if (secureStorageAvailable) {
      await SecureStore.setItemAsync(key, value);
    } else {
      const encrypted = btoa(value);
      await AsyncStorage.setItem(key, encrypted);
    }
  };

  const getSecurely = async (key: string): Promise<string | null> => {
    if (secureStorageAvailable) {
      return await SecureStore.getItemAsync(key);
    } else {
      const encrypted = await AsyncStorage.getItem(key);
      if (encrypted) {
        try {
          return atob(encrypted);
        } catch {
          return null;
        }
      }
      return null;
    }
  };

  const checkBiometricAvailability = async () => {
    if (Platform.OS === 'web') {
      return false;
    }
    
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return compatible && enrolled;
    } catch {
      return false;
    }
  };

  const setupPinAuth = async (pin: string, enableBiometric: boolean = false) => {
    console.log('Setting up PIN authentication', { enableBiometric });
    await storeSecurely(STORAGE_KEYS.PIN_CODE, pin);
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_CONFIGURED, 'true');
    const authType = enableBiometric ? 'pin-biometric' : 'pin';
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TYPE, authType);

    setState(prev => ({
      ...prev,
      isAuthConfigured: true,
      authType,
      isAuthenticated: true,
      useBiometric: enableBiometric,
    }));
  };



  const verifyPin = async (pin: string): Promise<boolean> => {
    const storedPin = await getSecurely(STORAGE_KEYS.PIN_CODE);
    const isValid = storedPin === pin;

    if (isValid) {
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
      }));
    }

    return isValid;
  };

  const verifyBiometric = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return false;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authentification requise',
        cancelLabel: 'Annuler',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
        }));
        return true;
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
    }

    return false;
  };

  const logout = async () => {
    setState(prev => ({
      ...prev,
      isAuthenticated: false,
    }));
  };

  const resetAuth = async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_CONFIGURED);
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TYPE);
    if (secureStorageAvailable) {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.PIN_CODE);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.PIN_CODE);
    }

    setState(prev => ({
      ...prev,
      isAuthConfigured: false,
      authType: null,
      isAuthenticated: false,
    }));
  };

  const loadAuthState = async () => {
    console.log('Loading auth state...');
    try {
      const isConfigured = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_CONFIGURED);
      const authTypeStr = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TYPE);
      const isBioAvailable = await checkBiometricAvailability();

      setState(prev => ({
        ...prev,
        isAuthConfigured: isConfigured === 'true',
        authType: (authTypeStr as AuthType) || null,
        isLoading: false,
        isBiometricAvailable: isBioAvailable,
        useBiometric: authTypeStr === 'pin-biometric',
      }));

      console.log('Auth state loaded:', {
        isConfigured: isConfigured === 'true',
        authType: authTypeStr,
        isBioAvailable,
      });
    } catch (error) {
      console.error('Error loading auth state:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  };

  useEffect(() => {
    loadAuthState();
  }, []);

  return {
    ...state,
    setupPinAuth,
    verifyPin,
    verifyBiometric,
    logout,
    resetAuth,
  };
});
