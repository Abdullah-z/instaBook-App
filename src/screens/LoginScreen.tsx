import React, { useState, useContext } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { AuthContext } from '../auth/AuthContext';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

const LoginScreen = () => {
  const { login } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoginView, setIsLoginView] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter both email and password',
      });
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.msg || err.message || 'Login failed. Please check your credentials.';
      setError(errorMsg);
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: errorMsg,
      });
    } finally {
      setLoading(true); // Stay loading until navigation if success, though AuthContext usually handles redirect
      // Wait, AuthContext usually changes the state which triggers AppNavigator to re-render.
      // Let's set loading false if we catch error.
      setLoading(false);
    }
  };

  if (isLoginView) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setIsLoginView(false)}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <Text variant="headlineMedium" style={styles.title}>
            Welcome Back
          </Text>
          <Text style={styles.subtitle}>Please enter your details to sign in.</Text>

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            style={styles.input}
            mode="outlined"
            outlineColor="#eee"
            activeOutlineColor="#000"
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            style={styles.input}
            mode="outlined"
            outlineColor="#eee"
            activeOutlineColor="#000"
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
                color="#666"
              />
            }
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.loginButton}
            contentStyle={{ height: 50 }}
            labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
            Login
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoP}>i.</Text>
          </View>
          <Text style={styles.logoText}>instaBook</Text>
        </View> */}
        {/* <TouchableOpacity>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity> */}
      </View>

      <View style={styles.content}>
        <View style={styles.imageContainer}>
          {/* Placeholder for the collage illustration */}
          <View style={styles.circle1}>
            <Image
              source={{
                uri: 'https://camo.githubusercontent.com/9105e4cd984bdf30d9027d64564d5541774e471fdfb84db12ef7a707b533dd61/68747470733a2f2f63646e2e6a7364656c6976722e6e65742f67682f616c6f68652f617661746172732f706e672f6d656d6f5f31372e706e67',
              }}
              style={{ width: 200, height: 200 }}
            />
          </View>
          <View style={styles.circle2}>
            <Image
              source={{
                uri: 'https://camo.githubusercontent.com/7a6cfad569ac8a93acf81baab8218547473c367c38c0a783ab24031df7735579/68747470733a2f2f63646e2e6a7364656c6976722e6e65742f67682f616c6f68652f617661746172732f706e672f6d656d6f5f32352e706e67',
              }}
              style={{ width: 120, height: 120 }}
            />
          </View>
          <View style={styles.circle3}>
            <Image
              source={{
                uri: 'https://camo.githubusercontent.com/46eb94ece1df6fc5ef7112d225f2bd1c152f586bd2216f54bb33ecc49e65ec4e/68747470733a2f2f63646e2e6a7364656c6976722e6e65742f67682f616c6f68652f617661746172732f706e672f6d656d6f5f32342e706e67',
              }}
              style={{ width: 100, height: 100 }}
            />
          </View>
        </View>

        <Text style={styles.heroTitle}>Best Social App to Make New Friends</Text>
        <Text style={styles.heroSubtitle}>
          With instaBook you will find new friends from various countries and regions of the world
        </Text>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Register')}
            style={styles.getStartedButton}
            contentStyle={{ height: 55 }}
            labelStyle={{ color: '#000', fontWeight: 'bold', fontSize: 16 }}>
            Get Started
          </Button>

          <Button
            mode="outlined"
            onPress={() => setIsLoginView(true)}
            style={styles.loginOutlineButton}
            contentStyle={{ height: 55 }}
            labelStyle={{ color: '#000', fontWeight: 'bold', fontSize: 16 }}>
            Login
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoBox: {
    backgroundColor: '#D4F637', // Lime green
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logoP: { fontWeight: 'bold', fontSize: 18 },
  logoText: { fontWeight: 'bold', fontSize: 20 },
  skipText: { color: '#666', fontSize: 16 },

  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'flex-end', paddingBottom: 40 },

  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circle1: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#f0f0f0',
    position: 'absolute',
    top: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle2: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    position: 'absolute',
    top: 150,
    right: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle3: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#d0d0d0',
    position: 'absolute',
    top: 200,
    left: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  buttonContainer: { gap: 16 },
  getStartedButton: {
    backgroundColor: '#D4F637', // Lime green
    borderRadius: 30,
  },
  loginOutlineButton: {
    borderColor: '#eee',
    borderWidth: 1,
    borderRadius: 30,
  },

  // Form Styles
  backButton: { fontSize: 24, padding: 10 },
  formContainer: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: '#666', marginBottom: 32 },
  input: { marginBottom: 16, backgroundColor: '#fff' },
  error: { color: 'red', marginBottom: 16 },
  loginButton: {
    backgroundColor: '#000',
    borderRadius: 30,
    marginTop: 10,
  },
});
