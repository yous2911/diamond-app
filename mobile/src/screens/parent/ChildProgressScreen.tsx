import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useXpTracking, useStudentStats } from '../../hooks/useApiData';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import Card from '../../components/common/Card';

// A simple progress bar component
const ProgressBar = ({ progress, label }: { progress: number, label: string }) => (
  <View style={styles.progressBarContainer}>
    <Text style={styles.progressBarLabel}>{label}</Text>
    <View style={styles.progressBarBackground}>
      <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
    </View>
    <Text>{`${progress}%`}</Text>
  </View>
);


const ChildProgressCard = ({ studentId }: { studentId: string }) => {
  const { data: student, loading: studentLoading, error: studentError } = useStudentStats(studentId);
  const { data: progress, loading: progressLoading, error: progressError } = useXpTracking(studentId);

  if (studentLoading || progressLoading) return <Card><LoadingSpinner /></Card>;
  if (studentError || progressError) return <Card><Text style={styles.errorText}>Error loading progress.</Text></Card>;
  if (!student || !progress) return null;

  // Assuming progress.level gives a number from 1 to 10 for progress bar
  const levelProgress = (progress.level / 10) * 100;

  return (
    <Card style={styles.childCard}>
      <Text style={styles.childName}>{student.name}</Text>
      <ProgressBar progress={levelProgress} label={`Level ${progress.level}`} />
      <Text style={styles.xpText}>Total XP: {progress.xp}</Text>
    </Card>
  );
};

const ChildProgressScreen = () => {
  const { user } = useAuth();

  // Assuming parent user object has a `children` array with student info
  // In a real app, this would be part of the User type for parents.
  // For now, we'll mock it if it doesn't exist.
  const children = (user as any)?.children || [{ id: 'student-123', name: 'Mock Child' }];

  if (!user || user.type !== 'parent') {
    return <View style={styles.container}><Text>Please log in as a parent.</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Children's Progress</Text>
      {children.map((child: any) => (
        <ChildProgressCard key={child.id} studentId={child.id} />
      ))}
    </ScrollView>
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
  childCard: {
    marginBottom: 20,
  },
  childName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  xpText: {
      fontSize: 16,
      marginTop: 10,
      textAlign: 'center'
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  progressBarContainer: {
    marginBottom: 10,
  },
  progressBarLabel: {
    fontSize: 16,
    marginBottom: 5,
  },
  progressBarBackground: {
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4a90e2',
  },
});

export default ChildProgressScreen;
