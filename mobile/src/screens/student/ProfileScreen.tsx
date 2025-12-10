import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useStudentStats } from '../../hooks/useApiData';
import Card from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const ProfileScreen = () => {
  const { user } = useAuth();

  // The user check should ideally be handled by navigation,
  // but we add a safeguard here.
  if (!user || user.type !== 'student') {
    return (
      <View style={styles.container}>
        <Text>You are not logged in as a student.</Text>
      </View>
    );
  }

  const { data: stats, loading, error } = useStudentStats(user.id);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Card>
        {loading && <LoadingSpinner />}
        {error && <Text style={styles.errorText}>Error fetching stats: {error}</Text>}
        {stats && (
          <View>
            <Text style={styles.name}>{user.name}</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalXp}</Text>
                <Text style={styles.statLabel}>Total XP</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.exercisesCompleted}</Text>
                <Text style={styles.statLabel}>Exercises Done</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.currentLevel}</Text>
                <Text style={styles.statLabel}>Level</Text>
              </View>
            </View>
          </View>
        )}
      </Card>
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
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  statLabel: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  }
});

export default ProfileScreen;
