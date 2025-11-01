import { useState, useCallback, useMemo, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_IMAGES: 'btcon_user_images',
  IMAGE_CHANGES: 'btcon_image_changes',
};

const BTC_IMAGE_URL = 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=400&fit=crop';

const DEVELOPER_ADDRESSES = [
  'bc1qdff8680vyy0qthr5vpe3ywzw48r8rr4jn4jvac',
  'bc1qh78w8awednuw3336fnwcnr0sr4q5jxu980eyyd',
];

interface UserImageData {
  profileImage: string;
  qrImage: string;
  changesCount: number;
  lastChangeTimestamp: number | null;
}

interface UserImagesRegistry {
  [address: string]: UserImageData;
}

export const [UserImageProvider, useUserImage] = createContextHook(() => {
  const [userImages, setUserImages] = useState<UserImagesRegistry>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadUserImages = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_IMAGES);
      if (stored) {
        setUserImages(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading user images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserImages = async (images: UserImagesRegistry) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_IMAGES, JSON.stringify(images));
      setUserImages(images);
    } catch (error) {
      console.error('Error saving user images:', error);
    }
  };

  const isDeveloper = useCallback((address: string): boolean => {
    return DEVELOPER_ADDRESSES.includes(address);
  }, []);

  const getImageForUser = useCallback((address: string | null): UserImageData => {
    if (!address) {
      return {
        profileImage: BTC_IMAGE_URL,
        qrImage: BTC_IMAGE_URL,
        changesCount: 0,
        lastChangeTimestamp: null,
      };
    }

    if (isDeveloper(address)) {
      return {
        profileImage: BTC_IMAGE_URL,
        qrImage: BTC_IMAGE_URL,
        changesCount: 0,
        lastChangeTimestamp: null,
      };
    }

    return userImages[address] || {
      profileImage: BTC_IMAGE_URL,
      qrImage: BTC_IMAGE_URL,
      changesCount: 0,
      lastChangeTimestamp: null,
    };
  }, [userImages, isDeveloper]);

  const canChangeImage = useCallback((address: string): boolean => {
    const imageData = getImageForUser(address);
    return imageData.changesCount === 0;
  }, [getImageForUser]);

  const needsPaymentForChange = useCallback((address: string): boolean => {
    const imageData = getImageForUser(address);
    return imageData.changesCount >= 1;
  }, [getImageForUser]);

  const updateUserImage = useCallback(async (
    address: string,
    profileImage: string,
    qrImage: string,
    hasPaid: boolean = false
  ): Promise<boolean> => {
    try {
      if (isDeveloper(address)) {
        return false;
      }

      const currentData = getImageForUser(address);
      
      if (currentData.changesCount > 0 && !hasPaid) {
        return false;
      }

      const updatedImages = {
        ...userImages,
        [address]: {
          profileImage,
          qrImage,
          changesCount: currentData.changesCount + 1,
          lastChangeTimestamp: Date.now(),
        },
      };

      await saveUserImages(updatedImages);
      return true;
    } catch (error) {
      console.error('Error updating user image:', error);
      return false;
    }
  }, [userImages, getImageForUser, isDeveloper]);

  const updateUserImageWithPin = useCallback(async (
    address: string,
    profileImage: string,
    qrImage: string
  ): Promise<boolean> => {
    try {
      const updatedImages = {
        ...userImages,
        [address]: {
          profileImage,
          qrImage,
          changesCount: userImages[address]?.changesCount || 0,
          lastChangeTimestamp: Date.now(),
        },
      };

      await saveUserImages(updatedImages);
      return true;
    } catch (error) {
      console.error('Error updating user image with PIN:', error);
      return false;
    }
  }, [userImages]);

  const resetImageChanges = useCallback(async (address: string): Promise<void> => {
    try {
      const updatedImages = {
        ...userImages,
        [address]: {
          ...userImages[address],
          changesCount: 0,
        },
      };
      await saveUserImages(updatedImages);
    } catch (error) {
      console.error('Error resetting image changes:', error);
    }
  }, [userImages]);

  useEffect(() => {
    loadUserImages();
  }, []);

  return useMemo(() => ({
    userImages,
    isLoading,
    getImageForUser,
    canChangeImage,
    needsPaymentForChange,
    updateUserImage,
    updateUserImageWithPin,
    resetImageChanges,
    isDeveloper,
  }), [
    userImages,
    isLoading,
    getImageForUser,
    canChangeImage,
    needsPaymentForChange,
    updateUserImage,
    updateUserImageWithPin,
    resetImageChanges,
    isDeveloper,
  ]);
});
