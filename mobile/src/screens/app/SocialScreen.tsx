import React, { useState } from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Image} from 'react-native';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {Card} from '../../components/ui/Card';
import {Button} from '../../components/ui/Button';

import {AppTabParamList} from '../../navigation/AppNavigator';

type Props = BottomTabScreenProps<AppTabParamList, 'Social'>;

interface User {
  id: string;
  name: string;
  avatar?: string;
  bio: string;
  mutualGoals: number;
  isConnected: boolean;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  progress: number;
  sharedBy: string;
  likes: number;
  comments: number;
}

const SocialScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'connections' | 'discover'>('feed');

  // Mock data
  const connections: User[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      bio: 'Fitness enthusiast & productivity coach',
      mutualGoals: 3,
      isConnected: true,
    },
    {
      id: '2',
      name: 'Mike Johnson',
      bio: 'Entrepreneur building sustainable habits',
      mutualGoals: 2,
      isConnected: true,
    },
    {
      id: '3',
      name: 'Emma Davis',
      bio: 'Learning new skills every day',
      mutualGoals: 1,
      isConnected: false,
    },
  ];

  const goals: Goal[] = [
    {
      id: '1',
      title: 'Run 5K every morning',
      description: 'Building consistency in my morning routine',
      progress: 75,
      sharedBy: 'Sarah Chen',
      likes: 12,
      comments: 3,
    },
    {
      id: '2',
      title: 'Read 50 books this year',
      description: 'Currently on book 28, loving the journey!',
      progress: 56,
      sharedBy: 'Mike Johnson',
      likes: 8,
      comments: 5,
    },
  ];

  const renderConnection = ({ item }: { item: User }) => (
    <Card style={styles.connectionCard}>
      <View style={styles.connectionHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.connectionInfo}>
          <Text style={styles.connectionName}>{item.name}</Text>
          <Text style={styles.connectionBio}>{item.bio}</Text>
          <Text style={styles.mutualGoals}>{item.mutualGoals} mutual goals</Text>
        </View>
      </View>
      {!item.isConnected && (
        <Button
          title="Connect"
          onPress={() => {/* Handle connect */}}
          style={styles.connectButton}
        />
      )}
    </Card>
  );

  const renderGoal = ({ item }: { item: Goal }) => (
    <Card style={styles.goalCard}>
      <View style={styles.goalHeader}>
        <Text style={styles.goalTitle}>{item.title}</Text>
        <Text style={styles.goalAuthor}>by {item.sharedBy}</Text>
      </View>
      <Text style={styles.goalDescription}>{item.description}</Text>
      <View style={styles.goalProgress}>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${item.progress}%` }]}
          />
        </View>
        <Text style={styles.progressText}>{item.progress}% complete</Text>
      </View>
      <View style={styles.goalActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>👍 {item.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>💬 {item.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Social</Text>
        <Text style={styles.subtitle}>Connect with friends and share goals</Text>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'feed' && styles.activeTab]}
          onPress={() => setActiveTab('feed')}>
          <Text style={[styles.tabText, activeTab === 'feed' && styles.activeTabText]}>
            Feed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'connections' && styles.activeTab]}
          onPress={() => setActiveTab('connections')}>
          <Text style={[styles.tabText, activeTab === 'connections' && styles.activeTabText]}>
            Connections
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discover' && styles.activeTab]}
          onPress={() => setActiveTab('discover')}>
          <Text style={[styles.tabText, activeTab === 'discover' && styles.activeTabText]}>
            Discover
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'feed' && (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Goal Updates</Text>
          <FlatList
            data={goals}
            renderItem={renderGoal}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            style={styles.feedList}
          />
        </View>
      )}

      {activeTab === 'connections' && (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Your Connections</Text>
          <FlatList
            data={connections.filter(c => c.isConnected)}
            renderItem={renderConnection}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            style={styles.connectionsList}
          />

          <Text style={[styles.sectionTitle, styles.suggestionsTitle]}>Suggested Connections</Text>
          <FlatList
            data={connections.filter(c => !c.isConnected)}
            renderItem={renderConnection}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            style={styles.connectionsList}
          />
        </View>
      )}

      {activeTab === 'discover' && (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Discover People</Text>
          <Card style={styles.discoverCard}>
            <Text style={styles.discoverTitle}>Find people with similar goals</Text>
            <Text style={styles.discoverText}>
              Connect with others who share your interests and motivation.
            </Text>
            <Button
              title="Explore"
              onPress={() => {/* Handle explore */}}
              style={styles.exploreButton}
            />
          </Card>

          <Text style={[styles.sectionTitle, styles.trendingTitle]}>Trending Goals</Text>
          <View style={styles.trendingGoals}>
            <TouchableOpacity style={styles.trendingGoal}>
              <Text style={styles.trendingGoalText}>#FitnessJourney</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.trendingGoal}>
              <Text style={styles.trendingGoalText}>#LearnNewSkills</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.trendingGoal}>
              <Text style={styles.trendingGoalText}>#FinancialFreedom</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.actions}>
        <Button
          title="Share My Goal"
          onPress={() => {/* Handle share goal */}}
          style={styles.actionButton}
        />
        <Button
          title="Find Friends"
          onPress={() => setActiveTab('discover')}
          style={styles.actionButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#4f46e5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#4f46e5',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: 'white',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  suggestionsTitle: {
    marginTop: 32,
  },
  trendingTitle: {
    marginTop: 32,
  },
  feedList: {
    marginBottom: 20,
  },
  connectionsList: {
    marginBottom: 20,
  },
  connectionCard: {
    marginBottom: 12,
    padding: 16,
  },
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  connectionInfo: {
    flex: 1,
  },
  connectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  connectionBio: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  mutualGoals: {
    fontSize: 12,
    color: '#4f46e5',
    fontWeight: '500',
  },
  connectButton: {
    alignSelf: 'flex-start',
  },
  goalCard: {
    marginBottom: 16,
    padding: 16,
  },
  goalHeader: {
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  goalAuthor: {
    fontSize: 14,
    color: '#6b7280',
  },
  goalDescription: {
    fontSize: 14,
    color: '#4f2937',
    marginBottom: 12,
    lineHeight: 20,
  },
  goalProgress: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
  },
  goalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  discoverCard: {
    marginBottom: 24,
    padding: 20,
    alignItems: 'center',
  },
  discoverTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  discoverText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  exploreButton: {
    minWidth: 120,
  },
  trendingGoals: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trendingGoal: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  trendingGoalText: {
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: '500',
  },
  actions: {
    padding: 20,
    gap: 12,
  },
  actionButton: {
    marginBottom: 12,
  },
});

export default SocialScreen;