import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const CryptoCard = ({ data }: { data: any[] }) => {
  if (!data || data.length === 0) return null;

  // Take top 5 coins
  const topCoins = data.slice(0, 5);

  const renderItem = ({ item }: { item: any }) => {
    const isPositive = item.price_change_percentage_24h >= 0;
    return (
      <View style={styles.coinContainer}>
        <View style={styles.coinHeader}>
          <Image source={{ uri: item.image }} style={styles.coinLogo} />
          <Text style={styles.coinSymbol}>{item.symbol.toUpperCase()}</Text>
        </View>
        <Text style={styles.coinPrice}>
          ${item.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
        </Text>
        <View style={styles.changeContainer}>
          <Ionicons
            name={isPositive ? 'caret-up' : 'caret-down'}
            size={12}
            color={isPositive ? '#4ade80' : '#f87171'}
          />
          <Text style={[styles.coinChange, { color: isPositive ? '#4ade80' : '#f87171' }]}>
            {Math.abs(item.price_change_percentage_24h).toFixed(2)}%
          </Text>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#7c3aed', '#4f46e5']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="logo-bitcoin" size={24} color="white" />
          <Text style={styles.title}>Crypto Markets</Text>
        </View>
      </View>
      
      <FlatList
        data={topCoins}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 10,
    marginVertical: 6,
    borderRadius: 24,
    paddingVertical: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  listContent: {
    paddingHorizontal: 12,
  },
  coinContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 8,
    width: 120,
  },
  coinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  coinLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  coinSymbol: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: 'bold',
    fontSize: 14,
  },
  coinPrice: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  coinChange: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default CryptoCard;
