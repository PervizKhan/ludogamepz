import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, Alert, FlatList
} from 'react-native';
import * as Clipboard from 'expo-clipboard';

const EASYPAISA_NUMBER = '03059836750'; // CHANGE THIS
const EASYPAISA_NAME = 'Perveez Khan';       // CHANGE THIS

export default function WalletScreen({ navigation, route, apiUrl }) {
  const { user } = route.params;
  const [amount, setAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [deposits, setDeposits] = useState([]);

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    try {
      const res = await fetch(`${apiUrl}/deposits?playerId=${user.id}`);
      const data = await res.json();
      if (data.success) setDeposits(data.deposits);
    } catch (e) {}
  };

  const copyNumber = () => {
    Clipboard.setStringAsync(EASYPAISA_NUMBER);
    Alert.alert('Copied!', 'EasyPaisa number copied');
  };

  const submitDeposit = async () => {
    if (!amount || parseInt(amount) < 50) return Alert.alert('Error', 'Minimum Rs 50');
    if (!transactionId.trim()) return Alert.alert('Error', 'Enter transaction ID');

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/deposits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: user.id,
          amount: parseInt(amount),
          transactionId: transactionId.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('Submitted!', 'Wait for admin approval');
        setAmount('');
        setTransactionId('');
        fetchDeposits();
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (e) {
      Alert.alert('Error', 'Connection failed');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Your Balance</Text>
        <Text style={styles.balanceAmount}>Rs {user.balance}</Text>
      </View>

      <View style={styles.depositSection}>
        <Text style={styles.sectionTitle}>Add Balance via EasyPaisa</Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Send money to:</Text>
          <Text style={styles.infoName}>{EASYPAISA_NAME}</Text>
          <TouchableOpacity onPress={copyNumber}>
            <Text style={styles.infoNumber}>📱 {EASYPAISA_NUMBER}</Text>
          </TouchableOpacity>
          <Text style={styles.copyHint}>Tap to copy number</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Amount (min Rs 50)"
          placeholderTextColor="#888"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Transaction ID from EasyPaisa"
          placeholderTextColor="#888"
          value={transactionId}
          onChangeText={setTransactionId}
          autoCapitalize="characters"
        />

        <TouchableOpacity style={styles.submitBtn} onPress={submitDeposit} disabled={loading}>
          <Text style={styles.submitBtnText}>{loading ? 'Submitting...' : 'Submit for Verification'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Deposit History</Text>
      <FlatList
        data={deposits}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={({ item }) => (
          <View style={[styles.historyItem, {
            borderLeftColor: item.status === 'approved' ? '#4ECDC4' :
                           item.status === 'rejected' ? '#FF6B6B' : '#FFD93D'
          }]}>
            <View>
              <Text style={styles.historyAmount}>Rs {item.amount}</Text>
              <Text style={styles.historyId}>{item.transaction_id}</Text>
            </View>
            <Text style={[styles.historyStatus, {
              color: item.status === 'approved' ? '#4ECDC4' :
                     item.status === 'rejected' ? '#FF6B6B' : '#FFD93D'
            }]}>
              {item.status?.toUpperCase()}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 16 },
  balanceCard: {
    backgroundColor: '#16213e', borderRadius: 16, padding: 20,
    alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: '#ffd200'
  },
  balanceLabel: { color: '#aaa', fontSize: 12, letterSpacing: 2 },
  balanceAmount: { color: '#ffd200', fontSize: 40, fontWeight: '800', marginTop: 8 },
  depositSection: { backgroundColor: '#16213e', borderRadius: 16, padding: 16, marginBottom: 20 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  infoBox: {
    backgroundColor: '#0f3460', borderRadius: 12, padding: 16,
    alignItems: 'center', marginBottom: 16
  },
  infoLabel: { color: '#aaa', fontSize: 12 },
  infoName: { color: '#fff', fontSize: 18, fontWeight: '700', marginVertical: 4 },
  infoNumber: { color: '#4ECDC4', fontSize: 20, fontWeight: '800', marginVertical: 4 },
  copyHint: { color: '#666', fontSize: 10, marginTop: 4 },
  input: {
    backgroundColor: '#0f3460', color: '#fff', padding: 14, borderRadius: 10,
    marginBottom: 10, fontSize: 16, borderWidth: 1, borderColor: '#1a1a40'
  },
  submitBtn: { backgroundColor: '#4ECDC4', padding: 14, borderRadius: 25, alignItems: 'center' },
  submitBtnText: { color: '#1a1a2e', fontWeight: '800', fontSize: 16 },
  historyItem: {
    backgroundColor: '#16213e', borderRadius: 10, padding: 12, marginBottom: 8,
    borderLeftWidth: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  historyAmount: { color: '#fff', fontWeight: '700', fontSize: 16 },
  historyId: { color: '#888', fontSize: 11 },
  historyStatus: { fontWeight: '700', fontSize: 11 }
});
