import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { api } from '../api/client';

type LeaderboardType = 'daily' | 'weekly' | 'alltime';

export default function LeaderboardScreen() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<LeaderboardType>('daily');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [activeTab, user?.id])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [lbRes, statsRes] = await Promise.all([
        api.getLeaderboard(activeTab),
        user ? api.getPlayerStats(user.id) : Promise.resolve(null),
      ]);
      if (lbRes.leaderboard) setLeaderboard(lbRes.leaderboard);
      if (statsRes?.stats) setPlayerStats(statsRes.stats);
    } catch (e) {}
    setLoading(false);
  };

  const tabs: { id: LeaderboardType; label: string }[] = [
    { id: 'daily', label: '📅 Daily' },
    { id: 'weekly', label: '📊 Weekly' },
    { id: 'alltime', label: '🏆 All Time' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Leaderboard</Text>
      </View>

      {playerStats && (
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}><Text style={styles.statValue}>{playerStats.wins || 0}</Text><Text style={styles.statLabel}>Wins</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}><Text style={styles.statValue}>{playerStats.win_rate || 0}%</Text><Text style={styles.statLabel}>Win Rate</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}><Text style={styles.statValue}>🪙 {(playerStats.total_winnings || 0).toLocaleString()}</Text><Text style={styles.statLabel}>Earnings</Text></View>
          </View>
        </View>
      )}

      <View style={styles.tabContainer}>
        {tabs.map(tab => (
          <TouchableOpacity key={tab.id} style={[styles.tabButton, activeTab === tab.id && styles.activeTab]} onPress={() => setActiveTab(tab.id)}>
            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={leaderboard}
          renderItem={({ item, index }) => (
            <View style={[styles.playerRow, index < 3 && styles.topPlayerRow]}>
              <Text style={[styles.rankText, { color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#a0a0a0' }]}>
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
              </Text>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{item.username}</Text>
                <Text style={styles.playerStats}>{item.wins}W / {(item.total_games || 0) - (item.wins || 0)}L • {item.win_rate}% WR</Text>
              </View>
              <View style={styles.winningsContainer}>
                <Text style={styles.winningsLabel}>Won</Text>
                <Text style={styles.winningsAmount}>🪙 {(item.total_winnings || 0).toLocaleString()}</Text>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id?.toString()}
          contentContainerStyle={{ padding: 15 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#16213e' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFD700' },
  statsCard: { backgroundColor: '#0f3460', margin: 15, padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#FFD700' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#FFD700' },
  statLabel: { fontSize: 12, color: '#a0a0a0', marginTop: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: '#16213e' },
  tabContainer: { flexDirection: 'row', padding: 15, gap: 10 },
  tabButton: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#0f3460', alignItems: 'center' },
  activeTab: { backgroundColor: '#e94560' },
  tabText: { color: '#a0a0a0', fontSize: 14, fontWeight: 'bold' },
  activeTabText: { color: '#fff' },
  playerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f3460', padding: 15, borderRadius: 12, marginBottom: 10 },
  topPlayerRow: { borderWidth: 2, borderColor: '#FFD700' },
  rankText: { fontSize: 20, fontWeight: 'bold', width: 50 },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  playerStats: { fontSize: 12, color: '#a0a0a0', marginTop: 2 },
  winningsContainer: { alignItems: 'flex-end' },
  winningsLabel: { fontSize: 10, color: '#a0a0a0' },
  winningsAmount: { fontSize: 16, fontWeight: 'bold', color: '#00ff88' },
});
