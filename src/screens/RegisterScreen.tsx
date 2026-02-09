import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { TextInput, Button, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../auth/AuthContext';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

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
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill in all fields',
      });
      return;
    }

    try {
      setLoading(true);
      await register({ fullname, username, email, password, gender });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: err.response?.data?.msg || 'Something went wrong',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backIconBtn, { backgroundColor: theme.colors.surfaceVariant }]}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.formContainer}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Join the community and start connecting!
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
            contentStyle={{ height: 56 }}
            outlineStyle={{ borderRadius: 16 }}
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
            contentStyle={{ height: 56 }}
            outlineStyle={{ borderRadius: 16 }}
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
            contentStyle={{ height: 56 }}
            outlineStyle={{ borderRadius: 16 }}
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
            contentStyle={{ height: 56 }}
            outlineStyle={{ borderRadius: 16 }}
          />

          <View style={styles.genderContainer}>
            <Text style={[styles.genderLabel, { color: theme.colors.onSurface }]}>Identify as</Text>
            <View style={styles.genderRow}>
              {['male', 'female', 'other'].map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => setGender(g)}
                  style={[
                    styles.genderPill,
                    {
                      backgroundColor:
                        gender === g ? theme.colors.primary : theme.colors.surfaceVariant,
                      borderColor:
                        gender === g ? theme.colors.primary : theme.colors.outlineVariant,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.genderText,
                      {
                        color:
                          gender === g ? theme.colors.onPrimary : theme.colors.onSurfaceVariant,
                      },
                    ]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            style={[styles.registerButton, { backgroundColor: theme.colors.primary }]}
            contentStyle={{ height: 56 }}
            labelStyle={{ color: theme.colors.onPrimary, fontWeight: '900', fontSize: 16 }}>
            Create Account
          </Button>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.loginLink, { color: theme.colors.primary }]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  formContainer: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    fontWeight: '500',
    lineHeight: 24,
  },
  input: {
    marginBottom: 16,
  },
  genderContainer: {
    marginTop: 8,
    marginBottom: 32,
  },
  genderLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  genderText: {
    fontWeight: '700',
    fontSize: 14,
  },
  registerButton: {
    borderRadius: 18,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '800',
  },
});
