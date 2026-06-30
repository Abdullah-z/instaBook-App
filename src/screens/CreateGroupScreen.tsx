import { Image } from 'expo-image';
import React, { useState, useContext } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { searchUser } from '../api/userAPI';
import { createGroupAPI } from '../api/messageAPI';
import { AuthContext } from '../auth/AuthContext';

const CreateGroupScreen = () => {
  const navigation = useNavigation<any>();
  const theme = useTheme();
  const { user } = useContext(AuthContext);

  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length > 2) {
      setLoading(true);
      try {
        const res = await searchUser(text);
        // Filter out self and already selected users from results
        const filtered = res.users.filter(
          (u: any) => user && u._id !== user._id && !selectedUsers.find((sel) => sel._id === u._id)
        );
        setSearchResults(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const toggleUserSelection = (userToAdd: any) => {
    if (selectedUsers.find((u) => u._id === userToAdd._id)) {
      setSelectedUsers(selectedUsers.filter((u) => u._id !== userToAdd._id));
    } else {
      setSelectedUsers([...selectedUsers, userToAdd]);
      setSearchResults(searchResults.filter((u) => u._id !== userToAdd._id));
      setSearchQuery(''); // Clear search after selection
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }
    if (selectedUsers.length < 2) {
      Alert.alert('Error', 'Please select at least 2 members');
      return;
    }

    setCreating(true);
    try {
      const res = await createGroupAPI({
        groupName,
        recipients: selectedUsers.map((u) => u._id),
      });
      // Navigate to ChatScreen with the new group
      navigation.replace(
        'Chat' as never,
        {
          userId: res.conversation._id,
          username: res.conversation.groupName,
          avatar: res.conversation.groupAvatar,
          isGroup: true,
        } as never
      );
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant },
        ]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>New Group</Text>
        <TouchableOpacity
          onPress={handleCreateGroup}
          disabled={creating || !groupName || selectedUsers.length < 2}>
          {creating ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Text
              style={[
                styles.createBtn,
                { color: theme.colors.onPrimary, backgroundColor: theme.colors.primary },
                (!groupName || selectedUsers.length < 2) && styles.disabledBtn,
              ]}>
              Create
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Group Name</Text>
        <TextInput
          style={[
            styles.input,
            { borderBottomColor: theme.colors.outlineVariant, color: theme.colors.onSurface },
          ]}
          placeholder="Enter group name"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          value={groupName}
          onChangeText={setGroupName}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Add Members</Text>
        <View style={[styles.searchBox, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Ionicons
            name="search"
            size={20}
            color={theme.colors.onSurfaceVariant}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={{ flex: 1, color: theme.colors.onSurface }}
            placeholder="Search users..."
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      {/* Selected Users Chips */}
      {selectedUsers.length > 0 && (
        <View style={styles.selectedContainer}>
          <FlatList
            data={selectedUsers}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={[styles.chip, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Image source={{ uri: item.avatar }} style={styles.chipAvatar} />
                <Text style={[styles.chipText, { color: theme.colors.onSurface }]}>
                  {item.username}
                </Text>
                <TouchableOpacity onPress={() => toggleUserSelection(item)}>
                  <Ionicons name="close-circle" size={18} color={theme.colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      )}

      {/* Search Results */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.userItem, { borderBottomColor: theme.colors.outlineVariant }]}
              onPress={() => toggleUserSelection(item)}>
              <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
              <View>
                <Text style={[styles.username, { color: theme.colors.onSurface }]}>
                  {item.username}
                </Text>
                <Text style={[styles.fullname, { color: theme.colors.onSurfaceVariant }]}>
                  {item.fullname}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          style={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  createBtn: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  inputContainer: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderBottomWidth: 1,
    paddingVertical: 8,
    fontSize: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 10,
  },
  selectedContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  chipAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  chipText: {
    marginRight: 6,
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  fullname: {
    color: '#666',
    fontSize: 14,
  },
});

export default CreateGroupScreen;
