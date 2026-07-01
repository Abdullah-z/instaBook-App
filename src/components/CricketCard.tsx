import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const CricketCard = ({ data }: { data: any[] }) => {
  if (!data) return null;

  // Take up to 3 live matches
  const liveMatches = data.slice(0, 3);

  return (
    <LinearGradient
      colors={['#15803d', '#065f46']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="baseball" size={24} color="white" />
          <Text style={styles.title}>Live Cricket</Text>
        </View>
      </View>

      {liveMatches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No live matches right now 🏏</Text>
        </View>
      ) : (
        <View style={styles.matchesContainer}>
          {liveMatches.map((match, index) => (
            <View key={match.id || index} style={styles.matchItem}>
              <View style={styles.matchHeader}>
                <Text style={styles.matchName} numberOfLines={1}>{match.name}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{match.matchType?.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.matchStatus} numberOfLines={2}>{match.status}</Text>
              
              {/* If scores are available, render a summary */}
              {match.score && match.score.length > 0 && (
                <View style={styles.scoreContainer}>
                  {match.score.map((sc: any, idx: number) => (
                    <Text key={idx} style={styles.scoreText}>
                      {sc.inning}: {sc.r}/{sc.w} ({sc.o} ov)
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}
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
  emptyContainer: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  matchesContainer: {
    gap: 12,
  },
  matchItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 12,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  matchName: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  badge: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  matchStatus: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  scoreContainer: {
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 8,
  },
  scoreText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
  },
});

export default CricketCard;
