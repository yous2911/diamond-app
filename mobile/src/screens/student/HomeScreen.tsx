import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

const StudentHomeScreen = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Welcome back, Alex!</Text>
        <View style={styles.streakContainer}>
          <Text style={styles.streakText}>🔥 5 day streak</Text>
        </View>
      </View>

      <View style={styles.mascotContainer}>
        <Image
          source={{ uri: 'https://placekitten.com/200/200' }}
          style={styles.mascot}
        />
        <Text style={styles.mascotText}>Mascot says: "You're doing great!"</Text>
      </View>

      <Card>
        <Text style={styles.cardTitle}>Daily Goals</Text>
        <Text style={styles.cardText}>- Complete 3 math exercises</Text>
        <Text style={styles.cardText}>- Read a story in French</Text>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Progress</Text>
        <View style={styles.placeholder}>
          <Text>Progress Chart Placeholder</Text>
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Achievements</Text>
        <View style={styles.placeholder}>
          <Text>Achievement Badges Placeholder</Text>
        </View>
      </Card>

      <Button title="Start an Exercise" onPress={() => {}} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
  },
  contentContainer: {
    padding: 15,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  streakContainer: {
    backgroundColor: '#ffedd5',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  streakText: {
    color: '#f97316',
    fontWeight: 'bold',
  },
  mascotContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  mascot: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  mascotText: {
    marginTop: 10,
    fontStyle: 'italic',
    color: '#555',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 16,
    marginBottom: 5,
  },
  placeholder: {
    height: 100,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
});

export default StudentHomeScreen;
