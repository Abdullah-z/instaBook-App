import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

const HeaderLogo = () => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.logoBox, { backgroundColor: theme.colors.primary }]}>
        <Text style={[styles.logoP, { color: theme.colors.onPrimary }]}>iB.</Text>
      </View>
      <Text style={[styles.logoText, { color: theme.colors.onSurface }]}>Instabook</Text>
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
  logoBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logoP: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  logoText: {
    fontWeight: 'bold',
    fontSize: 20,
  },
});
