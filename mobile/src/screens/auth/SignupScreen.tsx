import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFormValidation} from 'lifeos-shared';

import {AuthStackParamList} from '../../navigation/AuthNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

const validationConfig = {
  fullName: {required: true, minLength: 2, maxLength: 200},
  email: {required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/},
  password: {
    required: true,
    minLength: 12,
    custom: (value: string) => {
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(value)) {
        return 'Password must contain uppercase, lowercase, number, and special character';
      }
      return null;
    },
  },
  timezone: {required: true},
  acceptTerms: {required: true},
};

const SignupScreen: React.FC<Props> = ({navigation}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    timezone: '',
    acceptTerms: false,
  });

  const {errors, validate} = useFormValidation(validationConfig);

  const handleSignup = async () => {
    if (!validate(formData)) {
      return;
    }

    try {
      // TODO: Implement signup API call
      console.log('Signup data:', formData);
      navigation.navigate('Onboarding');
    } catch (error) {
      Alert.alert('Signup Failed', 'Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join LifeOS to optimize your life</Text>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, errors.fullName && styles.inputError]}
            placeholder="Full Name"
            value={formData.fullName}
            onChangeText={(value) => setFormData({...formData, fullName: value})}
          />
          {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}

          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="Email"
            value={formData.email}
            onChangeText={(value) => setFormData({...formData, email: value})}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <TextInput
            style={[styles.input, errors.password && styles.inputError]}
            placeholder="Password"
            value={formData.password}
            onChangeText={(value) => setFormData({...formData, password: value})}
            secureTextEntry
          />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          <TextInput
            style={styles.input}
            placeholder="Timezone (e.g., America/New_York)"
            value={formData.timezone}
            onChangeText={(value) => setFormData({...formData, timezone: value})}
          />

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setFormData({...formData, acceptTerms: !formData.acceptTerms})}>
            <View style={[styles.checkbox, formData.acceptTerms && styles.checkboxChecked]}>
              {formData.acceptTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxText}>
              I accept the Terms of Service and Privacy Policy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleSignup}>
            <Text style={styles.buttonText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#6b7280',
  },
  form: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 12,
    marginBottom: 16,
    borderRadius: 6,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: -12,
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  button: {
    backgroundColor: '#4f46e5',
    padding: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
  },
  linkText: {
    color: '#4f46e5',
    fontSize: 16,
  },
});

export default SignupScreen;