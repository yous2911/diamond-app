import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Card from '../../components/common/Card';

const ParentHomeScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Parent Dashboard</Text>
      </View>

      <View style={styles.childSelector}>
        <Text style={styles.childSelectorText}>Viewing progress for:</Text>
        <TouchableOpacity style={styles.childSelectorButton}>
          <Text style={styles.childSelectorButtonText}>Alex</Text>
        </TouchableOpacity>
      </View>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Learning Analytics</Text>
        <View style={styles.placeholder}>
          <Text>Progress Chart Placeholder</Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Time Management</Text>
        <View style={styles.placeholder}>
          <Text>Time Controls Placeholder</Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Recent Achievements</Text>
        <Text style={styles.achievementText}>- Alex earned the "Math Whiz" badge!</Text>
        <Text style={styles.achievementText}>- Alex completed a 5-day streak!</Text>
      </Card>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
  },
  header: {
    padding: 20,
    backgroundColor: '#6366f1',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  childSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  childSelectorText: {
    fontSize: 16,
  },
  childSelectorButton: {
    backgroundColor: '#e0e7ff',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 15,
  },
  childSelectorButtonText: {
    color: '#4f46e5',
    fontWeight: 'bold',
  },
  card: {
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 0,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  placeholder: {
    height: 150,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  achievementText: {
    fontSize: 16,
    marginBottom: 5,
  },
});

export default ParentHomeScreen;
