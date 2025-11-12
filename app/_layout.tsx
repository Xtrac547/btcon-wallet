import '@/utils/shim';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { WalletProvider } from "@/contexts/WalletContext";
import { UsernameProvider } from "@/contexts/UsernameContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { FollowingProvider } from "@/contexts/FollowingContext";
import { UserImageProvider } from "@/contexts/UserImageContext";
import { DeveloperHierarchyProvider } from "@/contexts/DeveloperHierarchyContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { QRColorProvider } from "@/contexts/QRColorContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Platform } from 'react-native';

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="set-username" options={{ headerShown: false }} />
      <Stack.Screen name="wallet" options={{ headerShown: false }} />
      <Stack.Screen name="receive" options={{ headerShown: false }} />
      <Stack.Screen name="send" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="developer" options={{ headerShown: false }} />
      <Stack.Screen name="developer-hierarchy" options={{ headerShown: false }} />
      <Stack.Screen name="search-users" options={{ headerShown: false }} />
      <Stack.Screen name="profile-image" options={{ headerShown: false }} />
      <Stack.Screen name="qr-colors" options={{ headerShown: false }} />
      <Stack.Screen name="buy-btc" options={{ headerShown: false }} />
      <Stack.Screen name="setup-auth" options={{ headerShown: false }} />
      <Stack.Screen name="verify-auth" options={{ headerShown: false }} />
      <Stack.Screen name="stories" options={{ presentation: "modal", headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    const hideSplash = async () => {
      try {
        if (Platform.OS !== 'web') {
          await SplashScreen.hideAsync();
        }
      } catch (error) {
        console.log('Error hiding splash:', error);
      }
    };
    
    setTimeout(hideSplash, 100);
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <WalletProvider>
          <AuthProvider>
            <UsernameProvider>
              <FollowingProvider>
                <NotificationProvider>
                  <DeveloperHierarchyProvider>
                    <UserImageProvider>
                      <QRColorProvider>
                        <GestureHandlerRootView style={{ flex: 1 }}>
                          <RootLayoutNav />
                        </GestureHandlerRootView>
                      </QRColorProvider>
                    </UserImageProvider>
                  </DeveloperHierarchyProvider>
                </NotificationProvider>
              </FollowingProvider>
            </UsernameProvider>
          </AuthProvider>
        </WalletProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
