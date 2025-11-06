import { View, Text, StyleSheet, Dimensions, Animated, PanResponder, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import { X } from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const STORIES = [
  {
    id: '1',
    username: '@btcon_user1',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=800&fit=crop',
    caption: 'Bitcoin to the moon! 🚀',
    color: '#FF6B35',
  },
  {
    id: '2',
    username: '@crypto_fan',
    image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&h=800&fit=crop',
    caption: 'Just received my first Btcon! 🎉',
    color: '#4ECDC4',
  },
  {
    id: '3',
    username: '@btcon_trader',
    image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=800&fit=crop',
    caption: 'Trading like a pro 💰',
    color: '#FFE66D',
  },
  {
    id: '4',
    username: '@hodl_master',
    image: 'https://images.unsplash.com/photo-1605792657660-596af9009e82?w=400&h=800&fit=crop',
    caption: 'HODL forever! 💎🙌',
    color: '#95E1D3',
  },
];

export default function StoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const translateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0 && currentIndex < STORIES.length - 1) {
          translateY.setValue(gestureState.dy);
        } else if (gestureState.dy > 0 && currentIndex === 0) {
          translateY.setValue(gestureState.dy);
        } else if (gestureState.dy < 0 && currentIndex < STORIES.length - 1) {
          translateY.setValue(gestureState.dy);
        } else if (gestureState.dy > 0 && currentIndex > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -100 && currentIndex < STORIES.length - 1) {
          Animated.timing(translateY, {
            toValue: -SCREEN_HEIGHT,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setCurrentIndex(currentIndex + 1);
            translateY.setValue(0);
          });
        } else if (gestureState.dy > 100 && currentIndex > 0) {
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setCurrentIndex(currentIndex - 1);
            translateY.setValue(0);
          });
        } else if (gestureState.dy > 100 && currentIndex === 0) {
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            router.back();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleClose = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      router.back();
    });
  };

  return (
    <View style={styles.container}>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.storiesContainer,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        {STORIES.map((story, index) => {
          const isVisible = index === currentIndex;
          const isPrevious = index === currentIndex - 1;
          const isNext = index === currentIndex + 1;

          if (!isVisible && !isPrevious && !isNext) return null;

          return (
            <View
              key={story.id}
              style={[
                styles.storySlide,
                {
                  opacity: isVisible ? 1 : 0.3,
                  transform: [
                    {
                      translateY: isVisible
                        ? 0
                        : isPrevious
                        ? -SCREEN_HEIGHT
                        : SCREEN_HEIGHT,
                    },
                  ],
                },
              ]}
            >
              <Image
                source={{ uri: story.image }}
                style={styles.storyImage}
                resizeMode="cover"
              />
              <View style={styles.gradient} />

              <View style={[styles.topBar, { paddingTop: insets.top + 16 }]}>
                <View style={styles.progressBar}>
                  {STORIES.map((_, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.progressSegment,
                        idx <= currentIndex && styles.progressSegmentActive,
                      ]}
                    />
                  ))}
                </View>
                <View style={styles.userInfo}>
                  <View style={[styles.userAvatar, { backgroundColor: story.color }]}>
                    <Text style={styles.userInitial}>
                      {story.username[1].toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.username}>{story.username}</Text>
                </View>
              </View>

              <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 24 }]}>
                <Text style={styles.caption}>{story.caption}</Text>
              </View>
            </View>
          );
        })}
      </Animated.View>

      <View style={[styles.closeButton, { top: insets.top + 16 }]}>
        <View
          style={styles.closeButtonTouchable}
          onTouchEnd={handleClose}
        >
          <X color="#FFFFFF" size={28} strokeWidth={2.5} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  storiesContainer: {
    flex: 1,
  },
  storySlide: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    gap: 16,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 4,
    height: 3,
  },
  progressSegment: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  progressSegmentActive: {
    backgroundColor: '#FFFFFF',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
  },
  username: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  },
  caption: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600' as const,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    zIndex: 1000,
  },
  closeButtonTouchable: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
