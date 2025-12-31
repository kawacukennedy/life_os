import React, { useState } from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert} from 'react-native';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {useAuth} from '../../contexts/AuthContext';
import {useTheme} from '../../contexts/ThemeContext';

import {AppTabParamList} from '../../navigation/AppNavigator';

type Props = BottomTabScreenProps<AppTabParamList, 'Settings'>;

const SettingsScreen: React.FC<Props> = () => {
  const {logout, user} = useAuth();
  const {theme, toggleTheme} = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [aiPersonalization, setAiPersonalization] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert('Coming Soon', 'Data export functionality will be available soon!');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          Alert.alert('Account Deletion', 'Account deletion request submitted. You will receive a confirmation email.');
        }},
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingText}>Profile</Text>
            <Text style={styles.settingSubtext}>Update personal information</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingText}>Subscription</Text>
            <Text style={styles.settingSubtext}>Manage billing and plans</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingText}>Notifications</Text>
            <Text style={styles.settingSubtext}>Push notifications and alerts</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#767577', true: '#275af4' }}
            thumbColor={notificationsEnabled ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingText}>Dark Mode</Text>
            <Text style={styles.settingSubtext}>Toggle theme appearance</Text>
          </View>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: '#275af4' }}
            thumbColor={theme === 'dark' ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingText}>AI Personalization</Text>
            <Text style={styles.settingSubtext}>Allow AI to learn from your data</Text>
          </View>
          <Switch
            value={aiPersonalization}
            onValueChange={setAiPersonalization}
            trackColor={{ false: '#767577', true: '#275af4' }}
            thumbColor={aiPersonalization ? '#ffffff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Integrations Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connected Apps</Text>
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingText}>Google Calendar</Text>
            <Text style={styles.settingSubtext}>Connected • Manage access</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingText}>Apple Health</Text>
            <Text style={styles.settingSubtext}>Connected • Manage access</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingText}>Bank Accounts</Text>
            <Text style={styles.settingSubtext}>2 connected • Manage access</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingText}>Add Integration</Text>
            <Text style={styles.settingSubtext}>Connect new services</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Privacy & Data Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & Data</Text>
        <TouchableOpacity style={styles.settingItem} onPress={handleExportData}>
          <View style={styles.settingContent}>
            <Text style={styles.settingText}>Export Data</Text>
            <Text style={styles.settingSubtext}>Download your data</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingText}>Data Retention</Text>
            <Text style={styles.settingSubtext}>Manage data storage preferences</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingText}>Privacy Settings</Text>
            <Text style={styles.settingSubtext}>Control data sharing and usage</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingText}>Help Center</Text>
            <Text style={styles.settingSubtext}>FAQs and guides</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingText}>Contact Support</Text>
            <Text style={styles.settingSubtext}>Get help from our team</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingText}>About LifeOS</Text>
            <Text style={styles.settingSubtext}>Version 1.0.0</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Actions</Text>
        <TouchableOpacity
          style={[styles.settingItem, styles.dangerItem]}
          onPress={handleDeleteAccount}>
          <View style={styles.settingContent}>
            <Text style={styles.dangerText}>Delete Account</Text>
            <Text style={styles.settingSubtext}>Permanently delete your account</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={[styles.settingItem, styles.logoutButton]} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
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
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  settingItem: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingContent: {
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 2,
  },
  settingSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  dangerItem: {
    borderBottomColor: '#fecaca',
  },
  dangerText: {
    fontSize: 16,
    color: '#dc2626',
  },
  logoutButton: {
    marginTop: 40,
    marginHorizontal: 20,
    backgroundColor: '#ef4444',
    borderRadius: 6,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});

export default SettingsScreen;