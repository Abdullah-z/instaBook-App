import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { TextInput, Button, RadioButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../auth/AuthContext';

const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const { register } = useContext(AuthContext);

  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('male');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullname || !username || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await register({ fullname, username, email, password, gender });
      // Navigation to Home is handled by AuthContext state change (user becomes not null)
    } catch (err: any) {
      Alert.alert('Registration Failed', err.response?.data?.msg || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
      </View> */}

      <View style={styles.formContainer}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Pipel to make new friends!</Text>

        <TextInput
          label="Full Name"
          value={fullname}
          onChangeText={setFullname}
          mode="outlined"
          style={styles.input}
          theme={{ colors: { primary: '#000', outline: '#ccc' } }}
        />

        <TextInput
          label="Username"
          value={username}
          onChangeText={setUsername}
          mode="outlined"
          autoCapitalize="none"
          style={styles.input}
          theme={{ colors: { primary: '#000', outline: '#ccc' } }}
        />

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          theme={{ colors: { primary: '#000', outline: '#ccc' } }}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry
          style={styles.input}
          theme={{ colors: { primary: '#000', outline: '#ccc' } }}
        />

        <View style={styles.genderContainer}>
          <Text style={styles.genderLabel}>Gender:</Text>
          <RadioButton.Group onValueChange={(newValue) => setGender(newValue)} value={gender}>
            <View style={styles.radioRow}>
              <View style={styles.radioItem}>
                <RadioButton value="male" color="#D4F637" />
                <Text>Male</Text>
              </View>
              <View style={styles.radioItem}>
                <RadioButton value="female" color="#D4F637" />
                <Text>Female</Text>
              </View>
              <View style={styles.radioItem}>
                <RadioButton value="other" color="#D4F637" />
                <Text>Other</Text>
              </View>
            </View>
          </RadioButton.Group>
        </View>

        <Button
          mode="contained"
          onPress={handleRegister}
          loading={loading}
          style={styles.button}
          labelStyle={styles.buttonLabel}>
          Register
        </Button>

        <View style={styles.footer}>
          <Text>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 20,
  },
  backButton: {
    fontSize: 30,
    color: '#000',
  },
  formContainer: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  genderContainer: {
    marginBottom: 20,
  },
  genderLabel: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    marginTop: 10,
    backgroundColor: '#000',
    paddingVertical: 6,
    borderRadius: 8,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4F637', // Lime Green text
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  link: {
    fontWeight: 'bold',
    color: '#000', // Or Lime Green if preferred, but black is standard for links here
  },
});
