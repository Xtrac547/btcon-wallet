import '@/utils/shim';
import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUsername } from '@/contexts/UsernameContext';
import { useFollowing } from '@/contexts/FollowingContext';
import { ArrowLeft, Search, UserPlus, UserMinus, Send } from 'lucide-react-native';

export default function SearchUsersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getAllUsers, username: currentUsername } = useUsername();
  const { following, followUser, unfollowUser, isFollowing } = useFollowing();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<{ username: string; address: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const users = await getAllUsers();
      const filtered = users.filter(u => u.username !== currentUsername);
      console.log('Loaded users:', filtered.length, 'users found');
      setAllUsers(filtered);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return allUsers;
    }
    const query = searchQuery.toLowerCase().trim();
    return allUsers.filter(user => 
      user.username.toLowerCase().includes(query) ||
      user.address.toLowerCase().includes(query)
    );
  }, [allUsers, searchQuery]);

  const handleFollowToggle = async (username: string, address: string) => {
    if (isFollowing(username)) {
      await unfollowUser(username);
    } else {
      await followUser(username, address);
    }
  };

  const handleSendTo = (username: string) => {
    router.push({
      pathname: '/send',
      params: { recipient: `@${username}` }
    });
  };

  const formatAddress = (addr: string): string => {
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundPattern}>
        {[...Array(20)].map((_, i) => (
          <View
            key={`pattern-${i}`}
            style={[
              styles.patternDot,
              {
                left: (i * 50 + 20) % 400,
                top: Math.floor(i / 8) * 140 + 60,
                opacity: 0.3 + (i % 2) * 0.15,
              },
            ]}
          />
        ))}
      </View>

      <View style={[styles.header, { paddingTop: 60 + insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rechercher</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Search color="#666" size={20} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Rechercher un pseudo ou une adresse..."
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF8C00" />
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur disponible'}
            </Text>
          </View>
        ) : (
          <>
            {following.length > 0 && !searchQuery && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Suivis</Text>
                {following.map((user) => (
                  <View key={user.username} style={styles.userCard}>
                    <View style={styles.userInfo}>
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>
                          {user.username.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.userDetails}>
                        <Text style={styles.username}>@{user.username}</Text>
                        <Text style={styles.address}>{formatAddress(user.address)}</Text>
                      </View>
                    </View>
                    <View style={styles.userActions}>
                      <TouchableOpacity
                        style={styles.sendButton}
                        onPress={() => handleSendTo(user.username)}
                      >
                        <Send color="#FF8C00" size={18} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.followButton, styles.unfollowButton]}
                        onPress={() => handleFollowToggle(user.username, user.address)}
                      >
                        <UserMinus color="#FFF" size={18} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {searchQuery ? 'Résultats de recherche' : 'Tous les utilisateurs'}
              </Text>
              {filteredUsers.map((user) => {
                const isUserFollowed = isFollowing(user.username);
                
                return (
                  <View key={user.username} style={styles.userCard}>
                    <View style={styles.userInfo}>
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>
                          {user.username.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.userDetails}>
                        <Text style={styles.username}>@{user.username}</Text>
                        <Text style={styles.address}>{formatAddress(user.address)}</Text>
                      </View>
                    </View>
                    <View style={styles.userActions}>
                      <TouchableOpacity
                        style={styles.sendButton}
                        onPress={() => handleSendTo(user.username)}
                      >
                        <Send color="#FF8C00" size={18} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.followButton,
                          isUserFollowed && styles.unfollowButton
                        ]}
                        onPress={() => handleFollowToggle(user.username, user.address)}
                      >
                        {isUserFollowed ? (
                          <UserMinus color="#FFF" size={18} />
                        ) : (
                          <UserPlus color="#FFF" size={18} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative' as const,
  },
  backgroundPattern: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.08,
  },
  patternDot: {
    position: 'absolute' as const,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF8C00',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700' as const,
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f0f0f',
    borderRadius: 20,
    paddingHorizontal: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.15)',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 18,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800' as const,
    marginBottom: 18,
    paddingLeft: 4,
    letterSpacing: 0.5,
  },
  userCard: {
    backgroundColor: '#0f0f0f',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FF8C00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    color: '#000',
    fontSize: 24,
    fontWeight: '900' as const,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700' as const,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  address: {
    color: '#666',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  sendButton: {
    backgroundColor: 'rgba(255, 140, 0, 0.15)',
    borderRadius: 14,
    padding: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.25)',
  },
  followButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 14,
    padding: 13,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  unfollowButton: {
    backgroundColor: '#666',
  },
});
