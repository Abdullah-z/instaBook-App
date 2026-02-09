import React, { useState, useContext } from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { AuthContext } from '../auth/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import HeaderLogo from '../components/HeaderLogo';
import { addOpacity } from '../utils/colorUtils';

const LoginScreen = () => {
  const { login } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoginView, setIsLoginView] = useState(false);
  const theme = useTheme();

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
      setLoading(false);
    }
  };

  if (isLoginView) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.formHeader}>
          <TouchableOpacity
            style={[styles.backIconBtn, { backgroundColor: theme.colors.surfaceVariant }]}
            onPress={() => setIsLoginView(false)}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.formContainer}>
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>Welcome Back</Text>
            <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Enter your credentials to continue your journey.
            </Text>

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={[styles.input, { backgroundColor: theme.colors.surface }]}
              mode="outlined"
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
              secureTextEntry={!showPassword}
              style={[styles.input, { backgroundColor: theme.colors.surface }]}
              mode="outlined"
              outlineColor={theme.colors.outline}
              activeOutlineColor={theme.colors.primary}
              textColor={theme.colors.onSurface}
              contentStyle={{ height: 56 }}
              outlineStyle={{ borderRadius: 16 }}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                  color={theme.colors.onSurfaceVariant}
                />
              }
            />

            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>
                Forgot password?
              </Text>
            </TouchableOpacity>

            {error ? (
              <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>
            ) : null}

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={[styles.loginButton, { backgroundColor: theme.colors.primary }]}
              contentStyle={{ height: 56 }}
              labelStyle={{ color: theme.colors.onPrimary, fontWeight: '900', fontSize: 16 }}>
              Sign In
            </Button>

            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
              <Text style={[styles.dividerText, { color: theme.colors.onSurfaceVariant }]}>
                or continue with
              </Text>
              <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity
                style={[styles.socialBtn, { borderColor: theme.colors.outlineVariant }]}>
                <Ionicons name="logo-google" size={24} color={theme.colors.onSurface} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialBtn, { borderColor: theme.colors.outlineVariant }]}>
                <Ionicons name="logo-apple" size={24} color={theme.colors.onSurface} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialBtn, { borderColor: theme.colors.outlineVariant }]}>
                <Ionicons name="logo-facebook" size={24} color="#1877F2" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.heroSection}>
          <View style={styles.imageGrid}>
            <View
              style={[
                styles.heroCircle,
                styles.mainCircle,
                { backgroundColor: theme.colors.primaryContainer },
              ]}>
              <Image
                source={{
                  uri: 'https://camo.githubusercontent.com/9105e4cd984bdf30d9027d64564d5541774e471fdfb84db12ef7a707b533dd61/68747470733a2f2f63646e2e6a7364656c6976722e6e65742f67682f616c6f68652f617661746172732f706e672f6d656d6f5f31372e706e67',
                }}
                style={styles.heroImg}
              />
            </View>
            <View
              style={[
                styles.heroCircle,
                styles.smallCircle1,
                { backgroundColor: theme.colors.secondaryContainer },
              ]}>
              <Image
                source={{
                  uri: 'https://camo.githubusercontent.com/7a6cfad569ac8a93acf81baab8218547473c367c38c0a783ab24031df7735579/68747470733a2f2f63646e2e6a7364656c6976722e6e65742f67682f616c6f68652f617661746172732f706e672f6d656d6f5f32352e706e67',
                }}
                style={styles.heroImgSmall}
              />
            </View>
            <View
              style={[
                styles.heroCircle,
                styles.smallCircle2,
                { backgroundColor: theme.colors.tertiaryContainer },
              ]}>
              <Image
                source={{
                  uri: 'https://camo.githubusercontent.com/46eb94ece1df6fc5ef7112d225f2bd1c152f586bd2216f54bb33ecc49e65ec4e/68747470733a2f2f63646e2e6a7364656c6976722e6e65742f67682f616c6f68652f617661746172732f706e672f6d656d6f5f32342e706e67',
                }}
                style={styles.heroImgSmall}
              />
            </View>
          </View>
        </View>

        <View style={styles.heroBottom}>
          <Text style={[styles.heroTitle, { color: theme.colors.onSurface }]}>
            Best Social App to Make New Friends
          </Text>
          <Text style={[styles.heroSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            With Circles you will find new friends from various countries and regions of the world
          </Text>

          <View style={styles.heroButtons}>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Register')}
              style={[styles.mainBtn, { backgroundColor: theme.colors.primary }]}
              contentStyle={{ height: 60 }}
              labelStyle={{ color: theme.colors.onPrimary, fontWeight: '900', fontSize: 18 }}>
              Get Started
            </Button>

            <TouchableOpacity
              onPress={() => setIsLoginView(true)}
              style={[
                styles.secondaryBtn,
                { borderColor: theme.colors.outlineVariant, borderWidth: 1 },
              ]}>
              <Text style={{ color: theme.colors.onSurface, fontWeight: '900', fontSize: 16 }}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  formHeader: {
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
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
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
    marginBottom: 20,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  error: {
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: 18,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 40,
  },
  socialBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1 },
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageGrid: {
    width: width,
    height: 350,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  heroCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  mainCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    zIndex: 2,
  },
  smallCircle1: {
    width: 140,
    height: 140,
    borderRadius: 70,
    position: 'absolute',
    top: 20,
    right: 30,
    zIndex: 1,
  },
  smallCircle2: {
    width: 100,
    height: 100,
    borderRadius: 50,
    position: 'absolute',
    bottom: 30,
    left: 40,
    zIndex: 3,
  },
  heroImg: { width: 180, height: 180 },
  heroImgSmall: { width: 80, height: 80 },
  heroBottom: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    fontWeight: '500',
    opacity: 0.7,
  },
  heroButtons: {
    gap: 16,
  },
  mainBtn: {
    borderRadius: 20,
    elevation: 4,
  },
  secondaryBtn: {
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
