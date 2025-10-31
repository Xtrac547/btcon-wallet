import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'btcon_following';

export interface FollowedUser {
  username: string;
  address: string;
  followedAt: number;
}

export const [FollowingProvider, useFollowing] = createContextHook(() => {
  const [following, setFollowing] = useState<FollowedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFollowing = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFollowing(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading following:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFollowing = async (newFollowing: FollowedUser[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newFollowing));
      setFollowing(newFollowing);
    } catch (error) {
      console.error('Error saving following:', error);
    }
  };

  const followUser = useCallback(async (username: string, address: string): Promise<void> => {
    const newUser: FollowedUser = {
      username,
      address,
      followedAt: Date.now(),
    };

    const exists = following.some(u => u.username === username);
    if (!exists) {
      const updated = [...following, newUser];
      await saveFollowing(updated);
    }
  }, [following]);

  const unfollowUser = useCallback(async (username: string): Promise<void> => {
    const updated = following.filter(u => u.username !== username);
    await saveFollowing(updated);
  }, [following]);

  const isFollowing = useCallback((username: string): boolean => {
    return following.some(u => u.username === username);
  }, [following]);

  const getFollowedUser = useCallback((username: string): FollowedUser | null => {
    return following.find(u => u.username === username) || null;
  }, [following]);

  useEffect(() => {
    loadFollowing();
  }, []);

  return useMemo(() => ({
    following,
    isLoading,
    followUser,
    unfollowUser,
    isFollowing,
    getFollowedUser,
  }), [following, isLoading, followUser, unfollowUser, isFollowing, getFollowedUser]);
});
