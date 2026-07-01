import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from 'react-native-paper';
import * as WebBrowser from 'expo-web-browser';

const NewsCard = ({ article }: { article: any }) => {
  const theme = useTheme();

  if (!article) return null;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}
      onPress={() => WebBrowser.openBrowserAsync(article.url)}
      activeOpacity={0.8}
    >
      {article.urlToImage && (
        <Image source={{ uri: article.urlToImage }} style={styles.image} contentFit="cover" />
      )}
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]} numberOfLines={3}>
          {article.title}
        </Text>
        <Text style={[styles.meta, { color: theme.colors.onSurfaceVariant }]}>
          {article.source?.name} • {new Date(article.publishedAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 10,
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 22,
  },
  meta: {
    fontSize: 12,
  },
});

export default NewsCard;
