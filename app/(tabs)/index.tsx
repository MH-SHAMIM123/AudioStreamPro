// app/(tabs)/index.tsx - এই সম্পূর্ণ corrected code টি copy-paste করুন

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<any>(null);
  const [status, setStatus] = useState('Ready to start');
  const [isLoading, setIsLoading] = useState(false);
  const recordingRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'This app needs microphone access to function properly.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.log('Permission error:', error);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      setIsLoading(true);
      setStatus('Requesting permissions...');

      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        setIsLoading(false);
        return;
      }

      setStatus('Configuring audio...');

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      setStatus('Starting recording...');

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      setRecording(recording);
      setIsRecording(true);
      setIsLoading(false);
      setStatus('🎤 Recording... (Keep app open)');

      setTimeout(() => {
        processRecording();
      }, 10000);

    } catch (error) {
      console.error('Recording start failed:', error);
      setIsLoading(false);
      setStatus('Failed to start');
      Alert.alert(
        'Recording Error',
        'Could not start audio recording. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const processRecording = async () => {
    if (!recordingRef.current || !isRecording) return;

    try {
      setStatus('Processing audio...');
      
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      
      if (uri) {
        const audioData = await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64' as any, // FIXED LINE
        });
        
        console.log('📱 iPhone Audio Chunk:', audioData.length, 'bytes');
        await FileSystem.deleteAsync(uri);
      }

      if (isRecording) {
        setStatus('🎤 Recording...');
        await startRecording();
      }
      
    } catch (error) {
      console.log('Processing error:', error);
      if (isRecording) {
        setStatus('Error - Retrying...');
        setTimeout(() => startRecording(), 2000);
      }
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setStatus('Stopping...');

      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }

      setRecording(null);
      setStatus('⏹️ Recording Stopped');
      
    } catch (error) {
      console.log('Stop recording error:', error);
      setStatus('Stopped with error');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎤 AudioStream Pro</Text>
      <Text style={styles.subtitle}>iPhone Version 📱</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.status}>{status}</Text>
        {isLoading && <ActivityIndicator size="small" color="#0000ff" />}
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title={isLoading ? "INITIALIZING..." : "START STREAMING"}
          onPress={startRecording}
          disabled={isRecording || isLoading}
          color="#007AFF"
        />
        <Button
          title="STOP STREAMING"
          onPress={stopRecording}
          disabled={!isRecording}
          color="#FF3B30"
        />
      </View>

      <View style={styles.featureBox}>
        <Text style={styles.featureTitle}>iPhone Features:</Text>
        <Text style={styles.featureItem}>✅ High Quality Audio</Text>
        <Text style={styles.featureItem}>✅ Background Processing</Text>
        <Text style={styles.featureItem}>⚠️ Keep App Open</Text>
        <Text style={styles.featureItem}>📡 Ready for Server</Text>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>Testing Instructions:</Text>
        <Text style={styles.instruction}>1. Start Recording - কথা বলুন</Text>
        <Text style={styles.instruction}>2. Check console logs</Text>
        <Text style={styles.instruction}>3. App open রাখুন</Text>
        <Text style={styles.instruction}>4. Stop when done</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1c1c1e',
  },
  subtitle: {
    fontSize: 16,
    color: '#8e8e93',
    marginBottom: 30,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  status: {
    fontSize: 18,
    color: '#1c1c1e',
    fontWeight: '600',
    marginRight: 10,
  },
  buttonContainer: {
    gap: 15,
    width: '80%',
    marginBottom: 30,
  },
  featureBox: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
    color: '#1c1c1e',
  },
  featureItem: {
    fontSize: 14,
    marginBottom: 5,
    color: '#48484a',
  },
  instructions: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  instructionsTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976d2',
  },
  instruction: {
    fontSize: 12,
    marginBottom: 3,
    color: '#424242',
  },
});