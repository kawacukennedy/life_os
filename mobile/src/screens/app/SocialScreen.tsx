import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';

import {AppTabParamList} from '../../navigation/AppNavigator';

type Props = BottomTabScreenProps<AppTabParamList, 'Social'>;

const SocialScreen: React.FC<Props> = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Social</Text>
      <Text style={styles.subtitle}>Connect with friends and share goals</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default SocialScreen;