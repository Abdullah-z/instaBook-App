import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useTheme, Text } from 'react-native-paper';
import { searchUser } from '../api/userAPI';
import UserCard from '../components/UserCard';
import PostCard from '../components/PostCard';
import { searchPostAPI, deletePostAPI } from '../api/postAPI';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

const VIBRANT_COLOR_KEYS = ['primary', 'secondary', 'tertiary', 'error'] as const;

const SearchScreen = () => {
  const route = useRoute<any>();
  const isChatSearch = route.params?.isChatSearch;
  const initialHashtag = route.params?.hashtag;

  const [query, setQuery] = useState(initialHashtag || '');
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [tab, setTab] = useState<'users' | 'posts'>(initialHashtag ? 'posts' : 'users');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();
  const theme = useTheme();

  useEffect(() => {
    if (initialHashtag) {
      setQuery(initialHashtag);
      setTab('posts');
    }
  }, [initialHashtag]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length > 0) {
        handleSearch();
      } else {
        setUsers([]);
        setPosts([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, tab]);

  const handleSearch = async () => {
    try {
      setLoading(true);
      if (tab === 'users') {
        const res = await searchUser(query);
        setUsers(res.users);
      } else {
        const res = await searchPostAPI(query);
        setPosts(res.posts);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostUpdate = (updatedPost: any) => {
    setPosts((prev) => prev.map((p) => (p._id === updatedPost._id ? updatedPost : p)));
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePostAPI(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      console.error('Delete search post error:', err);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Custom Header with Search Input */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant },
        ]}>
        {/* <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity> */}
        <View style={[styles.searchBox, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Ionicons
            name="search"
            size={20}
            color={theme.colors.onSurfaceVariant}
            style={styles.searchIcon}
          />
          <TextInput
            autoFocus
            style={[styles.input, { color: theme.colors.onSurface }]}
            placeholder="Search users..."
            value={query}
            onChangeText={(text) => setQuery(text.toLocaleLowerCase())}
            placeholderTextColor={theme.colors.onSurfaceVariant}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View
        style={[
          styles.tabContainer,
          { borderBottomColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface },
        ]}>
        <TouchableOpacity
          style={[
            styles.tab,
            tab === 'users' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setTab('users')}>
          <Text
            style={[
              styles.tabText,
              {
                color: tab === 'users' ? theme.colors.primary : theme.colors.onSurfaceVariant,
                fontWeight: tab === 'users' ? 'bold' : '500',
              },
            ]}>
            Users
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            tab === 'posts' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setTab('posts')}>
          <Text
            style={[
              styles.tabText,
              {
                color: tab === 'posts' ? theme.colors.primary : theme.colors.onSurfaceVariant,
                fontWeight: tab === 'posts' ? 'bold' : '500',
              },
            ]}>
            Posts
          </Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      )}

      <FlatList
        data={tab === 'users' ? users : posts}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => {
          if (tab === 'users') {
            return (
              <UserCard
                user={item}
                color={(theme.colors as any)[VIBRANT_COLOR_KEYS[index % VIBRANT_COLOR_KEYS.length]]}
                onPress={
                  isChatSearch
                    ? () =>
                        navigation.navigate('Chat', { userId: item._id, username: item.username })
                    : undefined
                }
              />
            );
          } else {
            return (
              <PostCard
                post={item}
                onPostUpdate={handlePostUpdate}
                onOpenComments={() =>
                  navigation.navigate('PostDetail', { postId: item._id, post: item })
                }
                onDelete={handleDeletePost}
              />
            );
          }
        }}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading && query.length > 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              No results found.
            </Text>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: {
    paddingRight: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
    paddingHorizontal: 12, // Increased padding
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingVertical: 0, // Remove default vertical padding for better centering
  },
  list: {
    padding: 10,
  },
  loader: {
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#D4F637',
  },
  tabText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#000',
    fontWeight: 'bold',
  },
});

export default SearchScreen;
