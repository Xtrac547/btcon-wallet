import { useEffect, useState, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';

if (Platform.OS !== 'web') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (error) {
    console.log('Notifications configuration skipped - using fallback mode');
  }
}

const DEVELOPER_ADDRESSES = [
  'bc1qdff8680vyy0qthr5vpe3ywzw48r8rr4jn4jvac',
  'bc1qh78w8awednuw3336fnwcnr0sr4q5jxu980eyyd',
];

interface NotificationState {
  hasPermission: boolean;
  isDeveloper: boolean;
}

export const [NotificationProvider, useNotifications] = createContextHook(() => {
  const [state, setState] = useState<NotificationState>({
    hasPermission: false,
    isDeveloper: false,
  });

  const requestPermissions = useCallback(async () => {
    if (Platform.OS === 'web') {
      setState(prev => ({ ...prev, hasPermission: false }));
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      const granted = finalStatus === 'granted';
      setState(prev => ({ ...prev, hasPermission: granted }));
      return granted;
    } catch (error) {
      console.log('Notifications not supported in Expo Go - using Alert fallback');
      setState(prev => ({ ...prev, hasPermission: false }));
      return false;
    }
  }, []);

  const checkDeveloperStatus = useCallback((address: string | null): boolean => {
    if (!address) return false;
    return DEVELOPER_ADDRESSES.includes(address);
  }, []);

  const sendLocalNotification = useCallback(async (title: string, body: string) => {
    if (Platform.OS === 'web') {
      console.log('Notification (web):', title, body);
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: null,
      });
      console.log('Notification sent:', title);
    } catch (error) {
      console.log('Using Alert fallback for notification');
      Alert.alert(title, body, [{ text: 'OK' }]);
    }
  }, []);

  const notifyTransaction = useCallback(async (type: 'sent' | 'received', amount: number) => {
    const btcon = Math.floor(amount);
    const title = type === 'sent' ? '💸 Transaction envoyée' : '💰 Transaction reçue';
    const body = type === 'sent' 
      ? `Vous avez envoyé ${btcon} Btcon`
      : `Vous avez reçu ${btcon} Btcon`;
    
    await sendLocalNotification(title, body);
  }, [sendLocalNotification]);

  const notifyDeveloperLogin = useCallback(() => {
    if (Platform.OS === 'web') {
      Alert.alert(
        '👨‍💻 Mode Développeur',
        'Vous êtes connecté avec une adresse développeur. Accédez aux fonctionnalités avancées dans les paramètres.'
      );
    } else {
      Alert.alert(
        '👨‍💻 Mode Développeur',
        'Vous êtes connecté avec une adresse développeur. Accédez aux fonctionnalités avancées dans les paramètres.',
        [{ text: 'OK' }]
      );
    }
  }, []);

  const setDeveloperStatus = useCallback((address: string | null) => {
    const isDev = checkDeveloperStatus(address);
    setState(prev => ({ ...prev, isDeveloper: isDev }));
    
    if (isDev) {
      notifyDeveloperLogin();
    }
  }, [checkDeveloperStatus, notifyDeveloperLogin]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      requestPermissions().catch(() => {
        console.log('Notification permissions not available - using fallback');
      });
    }
  }, [requestPermissions]);

  return useMemo(() => ({
    ...state,
    requestPermissions,
    sendLocalNotification,
    notifyTransaction,
    setDeveloperStatus,
    checkDeveloperStatus,
  }), [state, requestPermissions, sendLocalNotification, notifyTransaction, setDeveloperStatus, checkDeveloperStatus]);
});
