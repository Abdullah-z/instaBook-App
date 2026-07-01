import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import API from '../api/axios';

const FactCard = ({ data: initialData }: { data: any }) => {
  const [fact, setFact] = useState(initialData?.text);
  const [loading, setLoading] = useState(false);

  const fetchNewFact = async () => {
    setLoading(true);
    try {
      const res = await API.get('/external/fact?refresh=true');
      setFact(res.data.fact.text);
    } catch (err) {
      console.log('Failed to fetch new fact', err);
    } finally {
      setLoading(false);
    }
  };

  if (!fact) return null;

  return (
    <LinearGradient
      colors={['#d97706', '#b45309']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="bulb" size={24} color="white" />
          <Text style={styles.title}>Did you know?</Text>
        </View>
        <TouchableOpacity onPress={fetchNewFact} disabled={loading} style={styles.refreshBtn}>
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="refresh" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>
      
      <Text style={styles.factText}>"{fact}"</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 10,
    marginVertical: 6,
    borderRadius: 24,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  refreshBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 6,
    borderRadius: 16,
  },
  factText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
    fontWeight: '500',
  },
});

export default FactCard;
