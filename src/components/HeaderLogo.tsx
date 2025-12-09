import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const HeaderLogo = () => {
  return (
    <View style={styles.container}>
      <View style={styles.logoBox}>
        <Text style={styles.logoP}>iB.</Text>
      </View>
      <Text style={styles.logoText}>instaBook</Text>
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
    backgroundColor: '#D4F637',
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
