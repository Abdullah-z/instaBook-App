import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface Props {
  children: string;
  style?: any;
}

const HashtagText: React.FC<Props> = ({ children, style }) => {
  const navigation = useNavigation<any>();

  if (!children) return null;

  const parts = children.split(/(\s+)/);

  return (
    <Text style={[styles.text, style]}>
      {parts.map((part, index) => {
        if (part.startsWith('#')) {
          return (
            <Text
              key={index}
              style={styles.link}
              onPress={() => navigation.navigate('Search', { hashtag: part })}>
              {part}
            </Text>
          );
        }
        if (part.startsWith('@')) {
          const username = part.slice(1);
          // We don't have the userId here, but SearchScreen or Profile might handle username lookup
          // For now, let's assume navigation to Search with mention works, or if we can navigate to Profile by username
          return (
            <Text
              key={index}
              style={styles.link}
              onPress={() => navigation.navigate('Profile', { username })}>
              {part}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 15,
    color: '#050505',
  },
  link: {
    color: '#1877F2',
    fontWeight: '500',
  },
});

export default HashtagText;
