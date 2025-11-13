import '@/utils/shim';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useWallet } from '@/contexts/WalletContext';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, Loader } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { Transaction } from '@/services/esplora';

type TransactionType = 'sent' | 'received';
type TransactionStatus = 'pending' | 'confirmed';

interface ProcessedTransaction {
  txid: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  timestamp?: number;
  confirmations: number;
}

export default function HistoryScreen() {
  const router = useRouter();
  const { transactions, address, esploraService } = useWallet();
  const insets = useSafeAreaInsets();
  const [processedTransactions, setProcessedTransactions] = useState<ProcessedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!address) return;
    
    const processTransactions = () => {
      const processed: ProcessedTransaction[] = transactions.map((tx: Transaction) => {
        let amount = 0;
        let type: TransactionType = 'received';

        const isReceived = tx.vout.some((output) => output.scriptpubkey_address === address);
        const isSent = tx.vin.some((input) => input.prevout.scriptpubkey_address === address);

        if (isSent) {
          type = 'sent';
          const totalInput = tx.vin.reduce((sum, input) => {
            if (input.prevout.scriptpubkey_address === address) {
              return sum + input.prevout.value;
            }
            return sum;
          }, 0);

          const totalOutput = tx.vout.reduce((sum, output) => {
            if (output.scriptpubkey_address === address) {
              return sum + output.value;
            }
            return sum;
          }, 0);

          amount = totalInput - totalOutput;
        } else {
          tx.vout.forEach((output) => {
            if (output.scriptpubkey_address === address) {
              amount += output.value;
            }
          });
        }

        return {
          txid: tx.txid,
          type,
          amount,
          status: tx.status.confirmed ? 'confirmed' : 'pending',
          timestamp: tx.status.block_time,
          confirmations: 0,
        };
      });

      setProcessedTransactions(processed);
      setIsLoading(false);
    };

    processTransactions();
  }, [transactions, address]);

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'En attente';
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: TransactionStatus) => {
    return status === 'confirmed' ? '#4CAF50' : '#FFB800';
  };

  const getStatusIcon = (status: TransactionStatus) => {
    if (status === 'confirmed') {
      return <CheckCircle color="#4CAF50" size={18} strokeWidth={2.5} />;
    }
    return <Clock color="#FFB800" size={18} strokeWidth={2.5} />;
  };

  const getStatusText = (status: TransactionStatus) => {
    return status === 'confirmed' ? 'Confirmé' : 'En attente';
  };

  const handleTransactionPress = (txid: string) => {
    const url = esploraService.getExplorerUrl(txid);
    console.log('Opening transaction:', url);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <View style={styles.backButtonCircle}>
            <ArrowLeft color="#FFF" size={20} strokeWidth={2.5} />
          </View>
        </Pressable>
        <Text style={styles.headerTitle}>Historique</Text>
        <View style={styles.placeholder} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8C00" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        >
          {processedTransactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Loader color="#666" size={48} strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyTitle}>Aucune transaction</Text>
              <Text style={styles.emptyText}>
                Vos transactions apparaîtront ici
              </Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {processedTransactions.map((tx) => (
                <Pressable
                  key={tx.txid}
                  style={({ pressed }) => [
                    styles.transactionCard,
                    tx.status === 'pending' && styles.transactionCardPending,
                    pressed && styles.transactionCardPressed,
                  ]}
                  onPress={() => handleTransactionPress(tx.txid)}
                >
                  <View style={styles.transactionLeft}>
                    <View style={[
                      styles.transactionIcon,
                      tx.type === 'sent' ? styles.transactionIconSent : styles.transactionIconReceived,
                    ]}>
                      {tx.type === 'sent' ? (
                        <ArrowUpRight color="#FFF" size={20} strokeWidth={2.5} />
                      ) : (
                        <ArrowDownLeft color="#FFF" size={20} strokeWidth={2.5} />
                      )}
                    </View>
                    
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionType}>
                        {tx.type === 'sent' ? 'Envoyé' : 'Reçu'}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {formatDate(tx.timestamp)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.transactionRight}>
                    <Text style={[
                      styles.transactionAmount,
                      tx.type === 'sent' ? styles.transactionAmountSent : styles.transactionAmountReceived,
                    ]}>
                      {tx.type === 'sent' ? '-' : '+'}{tx.amount.toLocaleString()} Btcon
                    </Text>
                    
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: `${getStatusColor(tx.status)}15`, borderColor: getStatusColor(tx.status) }
                    ]}>
                      {getStatusIcon(tx.status)}
                      <Text style={[styles.statusText, { color: getStatusColor(tx.status) }]}>
                        {getStatusText(tx.status)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      )}
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
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700' as const,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#141414',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  emptyText: {
    color: '#999',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  transactionCardPending: {
    borderColor: 'rgba(255, 184, 0, 0.3)',
    backgroundColor: 'rgba(255, 184, 0, 0.05)',
  },
  transactionCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionIconSent: {
    backgroundColor: '#FF8C00',
  },
  transactionIconReceived: {
    backgroundColor: '#4CAF50',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  transactionDate: {
    color: '#999',
    fontSize: 13,
    fontWeight: '500' as const,
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  transactionAmountSent: {
    color: '#FF8C00',
  },
  transactionAmountReceived: {
    color: '#4CAF50',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
});
