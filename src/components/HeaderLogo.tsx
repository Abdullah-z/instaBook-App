import { Image } from 'expo-image';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

interface HeaderLogoProps {
  size?: number;
  showText?: boolean;
}

const HeaderLogo: React.FC<HeaderLogoProps> = ({ size = 34, showText = true }) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/new_logo.png')}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
      {showText && (
        <Text
          style={[
            styles.logoText,
            { color: theme.colors.onSurface, fontSize: Math.round(size * 0.84) },
          ]}
        >
          Circles
        </Text>
      )}
    </View>
  );
};

export default HeaderLogo;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    gap: 8,
  },
  logoText: {
    fontWeight: '900',
    letterSpacing: -1.2,
  },
});
