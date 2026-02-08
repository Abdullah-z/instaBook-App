import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { TextInput, Button, RadioButton, useTheme } from 'react-native-paper';
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
  const theme = useTheme();

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
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
      </View> */}

      <View style={styles.formContainer}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Join Circles to make new friends!
        </Text>

        <TextInput
          label="Full Name"
          value={fullname}
          onChangeText={setFullname}
          mode="outlined"
          style={[styles.input, { backgroundColor: theme.colors.surface }]}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
          textColor={theme.colors.onSurface}
          contentStyle={{ height: 50 }}
        />

        <TextInput
          label="Username"
          value={username}
          onChangeText={setUsername}
          mode="outlined"
          autoCapitalize="none"
          style={[styles.input, { backgroundColor: theme.colors.surface }]}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
          textColor={theme.colors.onSurface}
          contentStyle={{ height: 50 }}
        />

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          style={[styles.input, { backgroundColor: theme.colors.surface }]}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
          textColor={theme.colors.onSurface}
          contentStyle={{ height: 50 }}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry
          style={[styles.input, { backgroundColor: theme.colors.surface }]}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
          textColor={theme.colors.onSurface}
          contentStyle={{ height: 50 }}
        />

        <View style={styles.genderContainer}>
          <Text style={[styles.genderLabel, { color: theme.colors.onSurface }]}>Gender:</Text>
          <RadioButton.Group onValueChange={(newValue) => setGender(newValue)} value={gender}>
            <View style={styles.radioRow}>
              <View style={styles.radioItem}>
                <RadioButton value="male" color={theme.colors.primary} />
                <Text style={{ color: theme.colors.onSurface }}>Male</Text>
              </View>
              <View style={styles.radioItem}>
                <RadioButton value="female" color={theme.colors.primary} />
                <Text style={{ color: theme.colors.onSurface }}>Female</Text>
              </View>
              <View style={styles.radioItem}>
                <RadioButton value="other" color={theme.colors.primary} />
                <Text style={{ color: theme.colors.onSurface }}>Other</Text>
              </View>
            </View>
          </RadioButton.Group>
        </View>

        <Button
          mode="contained"
          onPress={handleRegister}
          loading={loading}
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          labelStyle={[styles.buttonLabel, { color: theme.colors.onPrimary }]}>
          Register
        </Button>

        <View style={styles.footer}>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.link, { color: theme.colors.primary }]}>Login</Text>
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
