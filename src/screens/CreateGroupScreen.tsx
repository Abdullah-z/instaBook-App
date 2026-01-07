import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { searchUser } from '../api/userAPI';
import { createGroupAPI } from '../api/messageAPI';
import { AuthContext } from '../auth/AuthContext';

const CreateGroupScreen = () => {
  const navigation = useNavigation();
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
          (u: any) => u._id !== user._id && !selectedUsers.find((sel) => sel._id === u._id)
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Group</Text>
        <TouchableOpacity
          onPress={handleCreateGroup}
          disabled={creating || !groupName || selectedUsers.length < 2}>
          {creating ? (
            <ActivityIndicator size="small" color="#D4F637" />
          ) : (
            <Text
              style={[
                styles.createBtn,
                (!groupName || selectedUsers.length < 2) && styles.disabledBtn,
              ]}>
              Create
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Group Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter group name"
          value={groupName}
          onChangeText={setGroupName}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Add Members</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#666" style={{ marginRight: 8 }} />
          <TextInput
            style={{ flex: 1 }}
            placeholder="Search users..."
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
              <View style={styles.chip}>
                <Image source={{ uri: item.avatar }} style={styles.chipAvatar} />
                <Text style={styles.chipText}>{item.username}</Text>
                <TouchableOpacity onPress={() => toggleUserSelection(item)}>
                  <Ionicons name="close-circle" size={18} color="#666" />
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
            <TouchableOpacity style={styles.userItem} onPress={() => toggleUserSelection(item)}>
              <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
              <View>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.fullname}>{item.fullname}</Text>
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  createBtn: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D4F637',
    backgroundColor: '#000',
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
    color: '#666',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 8,
    fontSize: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
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
    backgroundColor: '#e6e6e6',
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
    borderBottomColor: '#f0f0f0',
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
