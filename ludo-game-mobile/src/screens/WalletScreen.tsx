import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { api } from '../api/client';

export default function WalletScreen() {
  const { user, refreshBalance } = useUser();
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user?.id])
  );

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await refreshBalance();
      const [walletRes, statsRes] = await Promise.all([
        api.getWallet(user.id),
        api.getPlayerStats(user.id),
      ]);
      if (walletRes.transactions) setTransactions(walletRes.transactions.slice(0, 20));
      if (statsRes.stats) setStats(statsRes.stats);
    } catch (e) {}
    setLoading(false);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#FFD700" /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Your Coins</Text>
        <Text style={styles.balanceAmount}>🪙 {(user?.balance || 0).toLocaleString()}</Text>
        <Text style={styles.balanceHint}>Play games to earn more coins!</Text>
      </View>

      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statBox}><Text style={styles.statValue}>🪙 {(stats.total_winnings || 0).toLocaleString()}</Text><Text style={styles.statLabel}>Total Won</Text></View>
          <View style={styles.statBox}><Text style={styles.statValue}>{stats.wins || 0}W / {(stats.total_games || 0) - (stats.wins || 0)}L</Text><Text style={styles.statLabel}>Record</Text></View>
          <View style={styles.statBox}><Text style={styles.statValue}>{stats.win_rate || 0}%</Text><Text style={styles.statLabel}>Win Rate</Text></View>
        </View>
      )}

      <View style={styles.transactionsContainer}>
        <Text style={styles.sectionTitle}>📜 Recent Activity</Text>
        {transactions.map((t: any) => (
          <View key={t.id} style={styles.transactionItem}>
            <Text style={styles.transactionIcon}>{t.type === 'win' ? '🏆' : t.type === 'loss' ? '😔' : '🪙'}</Text>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionDesc}>{t.description}</Text>
              <Text style={styles.transactionDate}>{new Date(t.created_at).toLocaleDateString()}</Text>
            </View>
            <Text style={[styles.transactionAmount, { color: t.amount > 0 ? '#00ff88' : '#e94560' }]}>
              {t.amount > 0 ? '+' : ''}{t.amount} 🪙
            </Text>
          </View>
        ))}
        {transactions.length === 0 && <Text style={styles.noTransactions}>No games played yet</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' },
  balanceCard: { backgroundColor: '#0f3460', margin: 15, padding: 25, borderRadius: 20, alignItems: 'center', borderWidth: 2, borderColor: '#FFD700' },
  balanceLabel: { fontSize: 16, color: '#a0a0a0', marginBottom: 10 },
  balanceAmount: { fontSize: 42, fontWeight: 'bold', color: '#FFD700', marginBottom: 10 },
  balanceHint: { fontSize: 14, color: '#4ECDC4' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', padding: 15 },
  statBox: { backgroundColor: '#0f3460', padding: 15, borderRadius: 12, alignItems: 'center', width: '30%' },
  statValue: { fontSize: 14, fontWeight: 'bold', color: '#FFD700', marginBottom: 5 },
  statLabel: { fontSize: 11, color: '#a0a0a0' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 15, paddingHorizontal: 15 },
  transactionsContainer: { padding: 15 },
  transactionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f3460', padding: 15, borderRadius: 12, marginBottom: 10 },
  transactionIcon: { fontSize: 24, marginRight: 15 },
  transactionInfo: { flex: 1 },
  transactionDesc: { color: '#fff', fontSize: 14, marginBottom: 4 },
  transactionDate: { color: '#a0a0a0', fontSize: 12 },
  transactionAmount: { fontSize: 16, fontWeight: 'bold' },
  noTransactions: { color: '#a0a0a0', textAlign: 'center', marginTop: 20 },
});
