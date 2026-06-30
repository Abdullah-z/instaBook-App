import { Image } from 'expo-image';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

const HeaderLogo = () => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/circles.png')}
        style={styles.logoImage}
        resizeMode="contain"
      />
      <Text style={[styles.logoText, { color: theme.colors.onSurface }]}>Circles</Text>
    </View>
  );
};

export default HeaderLogo;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
  },
  logoImage: {
    width: 50,
    height: 50,
    marginRight: 0,
  },
  logoText: {
    fontWeight: '900',
    fontSize: 28,
    letterSpacing: -1.5,
  },
});
