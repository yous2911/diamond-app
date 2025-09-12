import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useLeaderboard } from '../../hooks/useApiData';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Card } from '../../components/common/Card';

const LeaderboardScreen = () => {
  const { data: leaderboard, loading, error } = useLeaderboard();

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <Card style={styles.itemContainer}>
      <Text style={styles.rank}>{index + 1}</Text>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.xp}>{item.xp} XP</Text>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leaderboard</Text>
      {loading && <LoadingSpinner />}
      {error && <Text style={styles.errorText}>Error fetching leaderboard: {error}</Text>}
      {leaderboard && (
        <FlatList
          data={leaderboard}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f4f8',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  list: {
    paddingBottom: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  name: {
    fontSize: 18,
    flex: 1,
    marginHorizontal: 15,
  },
  xp: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
});

export default LeaderboardScreen;
