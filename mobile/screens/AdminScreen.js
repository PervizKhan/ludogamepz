import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

export default function AdminScreen({ apiUrl }) {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchPending();
      const interval = setInterval(fetchPending, 5000);
      return () => clearInterval(interval);
    }, [])
  );

  const fetchPending = async () => {
    try {
      const res = await fetch(`${apiUrl}/admin/verify?pin=0000`);
      const data = await res.json();
      if (data.success) setDeposits(data.deposits);
    } catch (e) {}
  };

  const handleVerify = async (depositId, action) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depositId, action, adminPin: '0000' })
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('Done', `Deposit ${action}ed`);
        fetchPending();
      }
    } catch (e) {
      Alert.alert('Error', 'Failed');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pending Deposits</Text>
      {deposits.length === 0 ? (
        <Text style={styles.empty}>No pending deposits</Text>
      ) : (
        <FlatList
          data={deposits}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.playerName}>{item.player_name}</Text>
                <Text style={styles.amount}>Rs {item.amount}</Text>
                <Text style={styles.tid}>TID: {item.transaction_id}</Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approve]}
                  onPress={() => handleVerify(item.id, 'approve')}
                  disabled={loading}
                >
                  <Text style={styles.actionText}>✓</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.reject]}
                  onPress={() => handleVerify(item.id, 'reject')}
                  disabled={loading}
                >
                  <Text style={styles.actionText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 16 },
  empty: { color: '#888', textAlign: 'center', marginTop: 40, fontSize: 16 },
  card: {
    backgroundColor: '#16213e', borderRadius: 12, padding: 16, marginBottom: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  cardInfo: { flex: 1 },
  playerName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  amount: { color: '#ffd200', fontSize: 18, fontWeight: '800' },
  tid: { color: '#888', fontSize: 11, marginTop: 4 },
  cardActions: { flexDirection: 'row', gap: 10 },
  actionBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  approve: { backgroundColor: '#4ECDC4' },
  reject: { backgroundColor: '#FF6B6B' },
  actionText: { color: '#1a1a2e', fontSize: 20, fontWeight: '800' }
});
