import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'http://localhost:3000/api';

export default function LoginScreen({ onLogin }: any) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim()) return Alert.alert('Error', 'Enter username');
    if (!password || password.length < 4) return Alert.alert('Error', 'Password must be at least 4 characters');

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();

      if (data.success) {
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        Alert.alert('Error', data.message || 'Invalid credentials');
      }
    } catch (e) {
      Alert.alert('Error', 'Cannot connect to server');
    }
    setLoading(false);
  };

  const sendOTP = async () => {
    if (!username.trim()) return Alert.alert('Error', 'Choose a username');
    if (!password || password.length < 4) return Alert.alert('Error', 'Password must be at least 4 characters');
    if (!email.includes('@')) return Alert.alert('Error', 'Enter a valid email');

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setStep('otp');
      } else {
        Alert.alert('Error', data.message || 'Failed to send OTP');
      }
    } catch (e) {
      Alert.alert('Error', 'Cannot connect to server');
    }
    setLoading(false);
  };

  const verifyOTP = async () => {
    if (otp.length < 6) return Alert.alert('Error', 'Enter 6-digit OTP');

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp,
          username: username.trim(),
          password,
        }),
      });
      const data = await res.json();

      if (data.success) {
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        Alert.alert('Welcome!', 'Account created! Starting balance: ₹500');
        onLogin(data.user);
      } else {
        Alert.alert('Error', data.message || 'Invalid OTP');
      }
    } catch (e) {
      Alert.alert('Error', 'Connection failed');
    }
    setLoading(false);
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setEmail('');
    setOtp('');
    setStep('form');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <Text style={styles.title}>🎲 Dice Duel</Text>
      <Text style={styles.subtitle}>Bet & Win Real Money</Text>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, mode === 'login' && styles.activeTab]} onPress={() => { setMode('login'); resetForm(); }}>
          <Text style={[styles.tabText, mode === 'login' && styles.activeTabText]}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, mode === 'register' && styles.activeTab]} onPress={() => { setMode('register'); resetForm(); }}>
          <Text style={[styles.tabText, mode === 'register' && styles.activeTabText]}>Register</Text>
        </TouchableOpacity>
      </View>

      {mode === 'login' && (
        <View style={styles.form}>
          <Text style={styles.stepTitle}>Welcome Back</Text>
          <TextInput style={styles.input} placeholder="Username" placeholderTextColor="#888" value={username} onChangeText={setUsername} autoCapitalize="none" autoFocus />
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#888" value={password} onChangeText={setPassword} secureTextEntry />
          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#1a1a2e" /> : <Text style={styles.buttonText}>Login</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode('register')}>
            <Text style={styles.switchText}>Don't have an account? Register</Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === 'register' && step === 'form' && (
        <View style={styles.form}>
          <Text style={styles.stepTitle}>Create Account</Text>
          <TextInput style={styles.input} placeholder="Choose Username" placeholderTextColor="#888" value={username} onChangeText={setUsername} autoCapitalize="none" autoFocus />
          <TextInput style={styles.input} placeholder="Password (min 4 chars)" placeholderTextColor="#888" value={password} onChangeText={setPassword} secureTextEntry />
          <TextInput style={styles.input} placeholder="Email for verification" placeholderTextColor="#888" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TouchableOpacity style={styles.button} onPress={sendOTP} disabled={loading}>
            {loading ? <ActivityIndicator color="#1a1a2e" /> : <Text style={styles.buttonText}>Send OTP to Email</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode('login')}>
            <Text style={styles.switchText}>Already have an account? Login</Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === 'register' && step === 'otp' && (
        <View style={styles.form}>
          <Text style={styles.stepTitle}>Verify Email</Text>
          <Text style={styles.otpSent}>Code sent to <Text style={{ color: '#FFD700' }}>{email}</Text></Text>
          <TextInput style={[styles.input, styles.otpInput]} placeholder="000000" placeholderTextColor="#888" value={otp} onChangeText={setOtp} keyboardType="numeric" maxLength={6} autoFocus />
          <TouchableOpacity style={styles.button} onPress={verifyOTP} disabled={loading}>
            {loading ? <ActivityIndicator color="#1a1a2e" /> : <Text style={styles.buttonText}>Create Account</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setStep('form'); setOtp(''); }}>
            <Text style={styles.switchText}>← Back</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>🎁 New accounts get ₹500 bonus!</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e', padding: 20 },
  title: { fontSize: 42, fontWeight: '800', color: '#ffd200', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#aaa', marginBottom: 30 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#16213e', borderRadius: 12, padding: 4, marginBottom: 30, width: '100%' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#e94560' },
  tabText: { fontSize: 16, fontWeight: '700', color: '#a0a0a0' },
  activeTabText: { color: '#fff' },
  form: { width: '100%', gap: 12 },
  stepTitle: { fontSize: 24, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 8 },
  input: { backgroundColor: '#16213e', color: '#fff', padding: 16, borderRadius: 12, fontSize: 16, borderWidth: 2, borderColor: '#0f3460' },
  otpInput: { fontSize: 32, textAlign: 'center', letterSpacing: 12, fontWeight: '800' },
  button: { backgroundColor: '#ffd200', padding: 16, borderRadius: 25, alignItems: 'center', marginTop: 8, minHeight: 52, justifyContent: 'center' },
  buttonText: { color: '#1a1a2e', fontWeight: '800', fontSize: 18 },
  switchText: { color: '#4ECDC4', textAlign: 'center', marginTop: 8, fontSize: 14 },
  otpSent: { color: '#a0a0a0', textAlign: 'center', marginBottom: 8, fontSize: 14 },
  footer: { position: 'absolute', bottom: 40 },
  footerText: { color: '#4ECDC4', fontSize: 14, fontWeight: '600' },
});
