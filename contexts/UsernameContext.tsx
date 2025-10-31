import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USERNAME: 'btcon_username',
  USERNAME_REGISTRY: 'btcon_username_registry',
};

interface UsernameRegistry {
  [username: string]: string;
}

export const [UsernameProvider, useUsername] = createContextHook(() => {
  const [username, setUsernameState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUsername = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.USERNAME);
      if (stored) {
        setUsernameState(stored);
      }
    } catch (error) {
      console.error('Error loading username:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRegistry = async (): Promise<UsernameRegistry> => {
    try {
      const registryStr = await AsyncStorage.getItem(STORAGE_KEYS.USERNAME_REGISTRY);
      return registryStr ? JSON.parse(registryStr) : {};
    } catch (error) {
      console.error('Error getting registry:', error);
      return {};
    }
  };

  const saveRegistry = async (registry: UsernameRegistry) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USERNAME_REGISTRY, JSON.stringify(registry));
    } catch (error) {
      console.error('Error saving registry:', error);
    }
  };

  const getUsernameForAddress = useCallback(async (address: string): Promise<string | null> => {
    try {
      const registry = await getRegistry();
      const entry = Object.entries(registry).find(([_, addr]) => addr === address);
      return entry ? entry[0] : null;
    } catch (error) {
      console.error('Error getting username for address:', error);
      return null;
    }
  }, []);

  const setUsername = useCallback(async (newUsername: string, address: string): Promise<boolean> => {
    try {
      const cleanUsername = newUsername.toLowerCase().trim();
      
      if (cleanUsername.length < 3) {
        return false;
      }

      const existingUsername = await getUsernameForAddress(address);
      if (existingUsername) {
        console.warn('Username already set for this address:', existingUsername);
        return false;
      }

      const registry = await getRegistry();
      
      const existingAddress = registry[cleanUsername];
      if (existingAddress && existingAddress !== address) {
        return false;
      }

      registry[cleanUsername] = address;
      await saveRegistry(registry);
      await AsyncStorage.setItem(STORAGE_KEYS.USERNAME, cleanUsername);
      setUsernameState(cleanUsername);

      console.log('Username set:', cleanUsername, 'for address:', address);
      return true;
    } catch (error) {
      console.error('Error setting username:', error);
      return false;
    }
  }, [getUsernameForAddress]);

  const getAddressForUsername = useCallback(async (username: string): Promise<string | null> => {
    try {
      const cleanUsername = username.toLowerCase().trim().replace(/^@/, '');
      const registry = await getRegistry();
      return registry[cleanUsername] || null;
    } catch (error) {
      console.error('Error getting address for username:', error);
      return null;
    }
  }, []);

  const deleteUsername = useCallback(async () => {
    try {
      if (username) {
        const registry = await getRegistry();
        delete registry[username];
        await saveRegistry(registry);
      }
      await AsyncStorage.removeItem(STORAGE_KEYS.USERNAME);
      setUsernameState(null);
    } catch (error) {
      console.error('Error deleting username:', error);
    }
  }, [username]);

  const getAllUsers = useCallback(async (): Promise<{ username: string; address: string }[]> => {
    try {
      const registry = await getRegistry();
      return Object.entries(registry).map(([username, address]) => ({ username, address }));
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }, []);

  const deleteUserByAddress = useCallback(async (address: string): Promise<void> => {
    try {
      const registry = await getRegistry();
      const entry = Object.entries(registry).find(([_, addr]) => addr === address);
      if (entry) {
        const [usernameToDelete] = entry;
        delete registry[usernameToDelete];
        await saveRegistry(registry);
        
        if (usernameToDelete === username) {
          await AsyncStorage.removeItem(STORAGE_KEYS.USERNAME);
          setUsernameState(null);
        }
      }
    } catch (error) {
      console.error('Error deleting user by address:', error);
    }
  }, [username]);

  useEffect(() => {
    loadUsername();
  }, []);

  return useMemo(() => ({
    username,
    isLoading,
    setUsername,
    getUsernameForAddress,
    getAddressForUsername,
    deleteUsername,
    getAllUsers,
    deleteUserByAddress,
  }), [username, isLoading, setUsername, getUsernameForAddress, getAddressForUsername, deleteUsername, getAllUsers, deleteUserByAddress]);
});
