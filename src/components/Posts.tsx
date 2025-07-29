import React from 'react';
import { FlatList, View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';

const Posts = ({ posts, loadingMore, onLoadMore }) => {
  const renderPost = ({ item }) => (
    <View style={styles.postCard}>
      <Text style={{ fontWeight: 'bold' }}>{item.user.fullname}</Text>
      <Text>{item.content}</Text>
      <Image source={{ uri: item.images[0] }} style={{ width: '100%', height: 200 }}></Image>
    </View>
  );

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item._id}
      renderItem={renderPost}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loadingMore ? <ActivityIndicator style={{ marginVertical: 10 }} /> : null
      }
    />
  );
};

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
  },
});

export default Posts;
