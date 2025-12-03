import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface Course {
  id: string;
  title: string;
  description: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  category: string;
  estimatedTime: number;
}

interface Recommendation {
  id: string;
  title: string;
  reason: string;
  category: string;
}

const LearnScreen = () => {
  const [activeTab, setActiveTab] = useState('courses');

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await fetch('/api/learning/courses');
      return response.json();
    },
  });

  const { data: recommendationsData } = useQuery({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const response = await fetch('/api/learning/recommendations');
      return response.json();
    },
  });

  const renderCourse = ({ item }: { item: Course }) => (
    <TouchableOpacity style={styles.courseCard}>
      <View style={styles.courseHeader}>
        <Text style={styles.courseTitle}>{item.title}</Text>
        <Text style={styles.courseCategory}>{item.category}</Text>
      </View>
      <Text style={styles.courseDescription} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.courseProgress}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${item.progress}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {item.completedLessons}/{item.totalLessons} lessons
        </Text>
      </View>
      <Text style={styles.courseTime}>
        {item.estimatedTime} min estimated
      </Text>
    </TouchableOpacity>
  );

  const renderRecommendation = ({ item }: { item: Recommendation }) => (
    <Card style={styles.recommendationCard}>
      <Text style={styles.recommendationTitle}>{item.title}</Text>
      <Text style={styles.recommendationReason}>{item.reason}</Text>
      <Text style={styles.recommendationCategory}>{item.category}</Text>
      <Button
        title="Start Learning"
        onPress={() => {/* Navigate to course */}}
        style={styles.startButton}
      />
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'courses' && styles.activeTab]}
          onPress={() => setActiveTab('courses')}
        >
          <Text style={[styles.tabText, activeTab === 'courses' && styles.activeTabText]}>
            My Courses
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recommendations' && styles.activeTab]}
          onPress={() => setActiveTab('recommendations')}
        >
          <Text style={[styles.tabText, activeTab === 'recommendations' && styles.activeTabText]}>
            Recommended
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'courses' ? (
        <FlatList
          data={coursesData?.courses || []}
          renderItem={renderCourse}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.coursesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No courses yet</Text>
              <Text style={styles.emptyText}>Start your learning journey by exploring recommendations</Text>
              <Button
                title="Browse Courses"
                onPress={() => setActiveTab('recommendations')}
                style={styles.browseButton}
              />
            </View>
          }
        />
      ) : (
        <FlatList
          data={recommendationsData?.recommendations || []}
          renderItem={renderRecommendation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.recommendationsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Loading recommendations...</Text>
            </View>
          }
        />
      )}

      {/* Learning Stats */}
      <View style={styles.statsContainer}>
        <Card style={styles.statsCard}>
          <Text style={styles.statsTitle}>Learning Progress</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{coursesData?.stats?.coursesCompleted || 0}</Text>
              <Text style={styles.statLabel}>Courses Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statsValue}>{coursesData?.stats?.totalLessons || 0}</Text>
              <Text style={styles.statLabel}>Lessons Learned</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{coursesData?.stats?.studyStreak || 0}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>
        </Card>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#275af4',
  },
  tabText: {
    fontSize: 16,
    color: '#64748b',
  },
  activeTabText: {
    color: '#275af4',
    fontWeight: '600',
  },
  coursesList: {
    padding: 16,
  },
  courseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f1724',
    flex: 1,
    marginRight: 8,
  },
  courseCategory: {
    fontSize: 12,
    color: '#275af4',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  courseDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 20,
  },
  courseProgress: {
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#275af4',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#64748b',
  },
  courseTime: {
    fontSize: 12,
    color: '#64748b',
  },
  recommendationsList: {
    padding: 16,
  },
  recommendationCard: {
    marginBottom: 12,
    padding: 16,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f1724',
    marginBottom: 4,
  },
  recommendationReason: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  recommendationCategory: {
    fontSize: 12,
    color: '#275af4',
    marginBottom: 12,
  },
  startButton: {
    alignSelf: 'flex-start',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f1724',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    minWidth: 150,
  },
  statsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  statsCard: {
    padding: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f1724',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#275af4',
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#275af4',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
});

export default LearnScreen;