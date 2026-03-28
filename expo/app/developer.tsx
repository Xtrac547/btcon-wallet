import '@/utils/shim';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Modal, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useWallet } from '@/contexts/WalletContext';
import { useUsername } from '@/contexts/UsernameContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useUserImage } from '@/contexts/UserImageContext';
import { ArrowLeft, UserX, Users, Trash2, Search, Shield, Lock, Pyramid } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface UserEntry {
  username: string;
  address: string;
}

export default function DeveloperScreen() {
  const router = useRouter();
  const { address, deleteWallet } = useWallet();
  const { getAllUsers, deleteUserByAddress } = useUsername();
  const { setDeveloperPin, verifyDeveloperPin, hasDeveloperPinSet, checkDeveloperStatus } = useNotifications();
  const { isDeveloper: isAddressDeveloper } = useUserImage();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserEntry | null>(null);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [showAllUsers, setShowAllUsers] = useState(true);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showPinVerification, setShowPinVerification] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [isPinSet, setIsPinSet] = useState(false);

  const checkPinStatus = async () => {
    const pinSet = await hasDeveloperPinSet();
    setIsPinSet(pinSet);
    if (!pinSet) {
      setShowPinSetup(true);
    }
  };

  useEffect(() => {
    checkPinStatus();
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const allUsers = await getAllUsers();
    setUsers(allUsers);
  };

  const handleRefresh = () => {
    loadUsers();
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const requestPinVerification = (action: () => void) => {
    setPendingAction(() => action);
    setPinInput('');
    setShowPinVerification(true);
  };

  const handleSetPin = async () => {
    if (pinInput.length !== 6) {
      Alert.alert('Erreur', 'Le code PIN doit contenir 6 chiffres');
      return;
    }

    const success = await setDeveloperPin(pinInput);
    if (success) {
      setIsPinSet(true);
      setShowPinSetup(false);
      setPinInput('');
      Alert.alert('Succès', 'Code PIN configuré avec succès');
    } else {
      Alert.alert('Erreur', 'Le code PIN doit contenir 6 chiffres');
    }
  };

  const handleVerifyPin = async () => {
    if (pinInput.length !== 6) {
      Alert.alert('Erreur', 'Le code PIN doit contenir 6 chiffres');
      return;
    }

    const isValid = await verifyDeveloperPin(pinInput);
    if (isValid) {
      setShowPinVerification(false);
      setPinInput('');
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
    } else {
      Alert.alert('Erreur', 'Code PIN incorrect');
      setPinInput('');
    }
  };

  const handleDeleteUser = (user: UserEntry) => {
    if (isAddressDeveloper(user.address)) {
      Alert.alert('Erreur', 'Vous ne pouvez pas supprimer un autre développeur');
      return;
    }
    
    requestPinVerification(() => {
      setSelectedUser(user);
      setShowDeleteModal(true);
    });
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await deleteUserByAddress(selectedUser.address);
      Alert.alert('Succès', `L'utilisateur @${selectedUser.username} a été supprimé`);
      setShowDeleteModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch {
      Alert.alert('Erreur', 'Impossible de supprimer l\'utilisateur');
    }
  };

  const handleDeleteAccount = (targetAddress: string) => {
    if (isAddressDeveloper(targetAddress) && targetAddress !== address) {
      Alert.alert('Erreur', 'Vous ne pouvez pas supprimer un autre développeur');
      return;
    }
    
    requestPinVerification(() => {
      Alert.alert(
        'Supprimer le compte',
        `Êtes-vous sûr de vouloir supprimer le compte avec l'adresse ${targetAddress.slice(0, 10)}... ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteUserByAddress(targetAddress);
                
                if (targetAddress === address) {
                  await deleteWallet();
                  Alert.alert('Compte supprimé', 'Votre compte a été supprimé', [
                    { text: 'OK', onPress: () => router.replace('/onboarding') }
                  ]);
                } else {
                  Alert.alert('Succès', 'Le compte a été supprimé');
                  loadUsers();
                }
              } catch {
                Alert.alert('Erreur', 'Impossible de supprimer le compte');
              }
            },
          },
        ]
      );
    });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <View style={styles.backButtonCircle}>
            <ArrowLeft color="#FFF" size={20} strokeWidth={2.5} />
          </View>
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Shield color="#FF8C00" size={24} />
          <Text style={styles.headerTitle}>Mode Développeur</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.warningBanner}>
          <Shield color="#FF8C00" size={20} />
          <Text style={styles.warningText}>
            Vous avez accès aux fonctionnalités développeur car vous utilisez une adresse autorisée.
          </Text>
        </View>

        <Pressable
          style={styles.hierarchyButton}
          onPress={() => router.push('/developer-hierarchy')}
        >
          <View style={styles.hierarchyButtonIcon}>
            <Pyramid color="#FF8C00" size={24} />
          </View>
          <View style={styles.hierarchyButtonContent}>
            <Text style={styles.hierarchyButtonTitle}>Hiérarchie des développeurs</Text>
            <Text style={styles.hierarchyButtonSubtitle}>
              Gérer les niveaux et permissions des développeurs
            </Text>
          </View>
        </Pressable>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users color="#FFF" size={24} />
            <Text style={styles.sectionTitle}>Gestion des Pseudos</Text>
          </View>

          <View style={styles.searchContainer}>
            <Search color="#666" size={20} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Rechercher un utilisateur..."
              placeholderTextColor="#666"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Afficher tous les utilisateurs</Text>
            <Switch
              value={showAllUsers}
              onValueChange={(value) => {
                setShowAllUsers(value);
                if (value) {
                  loadUsers();
                } else {
                  setUsers([]);
                }
              }}
              trackColor={{ false: '#333', true: '#FF8C00' }}
              thumbColor={showAllUsers ? '#FFB347' : '#999'}
            />
          </View>

          {showAllUsers && (
            <>
              <Pressable style={styles.refreshButton} onPress={handleRefresh}>
                <Text style={styles.refreshButtonText}>Actualiser la liste</Text>
              </Pressable>

              {filteredUsers.length > 0 ? (
                <View style={styles.usersList}>
                  <Text style={styles.usersCount}>
                    {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
                  </Text>
                  {filteredUsers.map((user) => (
                    <View key={user.address} style={styles.userItem}>
                      <View style={styles.userInfo}>
                        <Text style={styles.username}>@{user.username}</Text>
                        <Text style={styles.userAddress}>{user.address.slice(0, 16)}...</Text>
                      </View>
                      <Pressable
                        style={styles.deleteUserButton}
                        onPress={() => handleDeleteUser(user)}
                      >
                        <UserX color="#FF4444" size={20} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noUsersText}>
                  {searchQuery ? 'Aucun utilisateur trouvé' : 'Chargement...'}
                </Text>
              )}
            </>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Trash2 color="#FF4444" size={24} />
            <Text style={styles.sectionTitle}>Suppression de Compte</Text>
          </View>

          <View style={styles.dangerCard}>
            <Text style={styles.dangerCardTitle}>Supprimer un compte BTC</Text>
            <Text style={styles.dangerCardText}>
              Entrez une adresse Bitcoin pour supprimer le compte associé. Cette action est irréversible.
            </Text>
            
            <Pressable
              style={styles.dangerButton}
              onPress={() => {
                Alert.prompt(
                  'Supprimer un compte',
                  'Entrez l\'adresse Bitcoin du compte à supprimer:',
                  [
                    { text: 'Annuler', style: 'cancel' },
                    {
                      text: 'Supprimer',
                      style: 'destructive',
                      onPress: (inputAddress: string | undefined) => {
                        if (inputAddress && inputAddress.trim()) {
                          handleDeleteAccount(inputAddress.trim());
                        }
                      },
                    },
                  ],
                  'plain-text'
                );
              }}
            >
              <Trash2 color="#FFF" size={20} />
              <Text style={styles.dangerButtonText}>Supprimer un Compte</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Ces fonctionnalités sont réservées aux adresses développeur autorisées. Utilisez-les avec précaution.
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={showPinSetup}
        animationType="fade"
        transparent
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Lock color="#FF8C00" size={40} style={{ alignSelf: 'center', marginBottom: 16 }} />
            <Text style={styles.modalTitle}>Configurer le code PIN</Text>
            <Text style={styles.modalText}>
              Créez un code PIN à 6 chiffres pour sécuriser l&apos;accès au mode développeur.
            </Text>
            
            <TextInput
              style={styles.pinInput}
              value={pinInput}
              onChangeText={(text) => setPinInput(text.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="000000"
              placeholderTextColor="#666"
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
            />
            
            <Pressable
              style={[styles.primaryButton, pinInput.length !== 6 && styles.primaryButtonDisabled]}
              onPress={handleSetPin}
              disabled={pinInput.length !== 6}
            >
              <Text style={styles.primaryButtonText}>Confirmer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPinVerification}
        animationType="fade"
        transparent
        onRequestClose={() => setShowPinVerification(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setShowPinVerification(false);
            setPinInput('');
            setPendingAction(null);
          }}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Lock color="#FF8C00" size={40} style={{ alignSelf: 'center', marginBottom: 16 }} />
            <Text style={styles.modalTitle}>Vérification PIN</Text>
            <Text style={styles.modalText}>
              Entrez votre code PIN à 6 chiffres pour continuer.
            </Text>
            
            <TextInput
              style={styles.pinInput}
              value={pinInput}
              onChangeText={(text) => setPinInput(text.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="000000"
              placeholderTextColor="#666"
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalButtonCancel}
                onPress={() => {
                  setShowPinVerification(false);
                  setPinInput('');
                  setPendingAction(null);
                }}
              >
                <Text style={styles.modalButtonCancelText}>Annuler</Text>
              </Pressable>
              
              <Pressable
                style={[styles.modalButtonConfirm, pinInput.length !== 6 && styles.modalButtonDisabled]}
                onPress={handleVerifyPin}
                disabled={pinInput.length !== 6}
              >
                <Text style={styles.modalButtonConfirmText}>Vérifier</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowDeleteModal(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Supprimer l&apos;utilisateur</Text>
            {selectedUser && (
              <>
                <Text style={styles.modalText}>
                  Êtes-vous sûr de vouloir supprimer l&apos;utilisateur @{selectedUser.username} ?
                </Text>
                <Text style={styles.modalAddress}>{selectedUser.address}</Text>
              </>
            )}
            
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalButtonCancel}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Annuler</Text>
              </Pressable>
              
              <Pressable
                style={styles.modalButtonConfirm}
                onPress={confirmDeleteUser}
              >
                <Text style={styles.modalButtonConfirmText}>Supprimer</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#0A0A0A',
  },
  backButton: {
    padding: 4,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700' as const,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 140, 0, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.3)',
  },
  warningText: {
    flex: 1,
    color: '#FF8C00',
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#141414',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700' as const,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleLabel: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  refreshButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  usersList: {
    gap: 12,
  },
  usersCount: {
    color: '#999',
    fontSize: 13,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    borderRadius: 12,
    padding: 16,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  userAddress: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  deleteUserButton: {
    padding: 8,
  },
  noUsersText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  dangerCard: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
  },
  dangerCardTitle: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  dangerCardText: {
    color: '#999',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  dangerButton: {
    backgroundColor: '#FF4444',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  dangerButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  infoCard: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  infoText: {
    color: '#666',
    fontSize: 13,
    lineHeight: 18,
  },
  hierarchyButton: {
    backgroundColor: '#141414',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#222',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  hierarchyButtonIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 140, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.3)',
  },
  hierarchyButtonContent: {
    flex: 1,
  },
  hierarchyButtonTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  hierarchyButtonSubtitle: {
    color: '#999',
    fontSize: 13,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  modalText: {
    color: '#999',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  modalAddress: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  modalButtonConfirm: {
    flex: 1,
    backgroundColor: '#FF4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalButtonConfirmText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  pinInput: {
    backgroundColor: '#0A0A0A',
    borderRadius: 12,
    padding: 16,
    color: '#FFF',
    fontSize: 24,
    textAlign: 'center',
    fontWeight: '700' as const,
    letterSpacing: 8,
    marginVertical: 24,
    borderWidth: 2,
    borderColor: '#333',
  },
  primaryButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#555',
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
});
