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
              style={styles.hashtag}
              onPress={() => navigation.navigate('Search', { hashtag: part })}>
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
  hashtag: {
    color: '#1877F2',
    fontWeight: '500',
  },
});

export default HashtagText;
