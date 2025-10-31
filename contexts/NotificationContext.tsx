import { useState, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Platform, Alert } from 'react-native';

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
    console.log('Notifications requièrent un build développeur - utilisation des alertes');
    setState(prev => ({ ...prev, hasPermission: false }));
    return false;
  }, []);

  const checkDeveloperStatus = useCallback((address: string | null): boolean => {
    if (!address) return false;
    return DEVELOPER_ADDRESSES.includes(address);
  }, []);

  const sendLocalNotification = useCallback(async (title: string, body: string) => {
    console.log('Notification:', title, body);
    Alert.alert(title, body, [{ text: 'OK' }]);
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



  return useMemo(() => ({
    ...state,
    requestPermissions,
    sendLocalNotification,
    notifyTransaction,
    setDeveloperStatus,
    checkDeveloperStatus,
  }), [state, requestPermissions, sendLocalNotification, notifyTransaction, setDeveloperStatus, checkDeveloperStatus]);
});
