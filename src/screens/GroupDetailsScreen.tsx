import { Image } from 'expo-image';
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { updateGroupAPI, getConversations, leaveGroupAPI } from '../api/messageAPI';
import { searchUser } from '../api/userAPI';
import { imageUpload } from '../utils/imageUpload';
import { AuthContext } from '../auth/AuthContext';

const GroupDetailsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useContext(AuthContext);
  const { conversationId } = route.params;

  const [loading, setLoading] = useState(true);
  const [groupData, setGroupData] = useState<any>(null);
  const [groupName, setGroupName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [avatarFile, setAvatarFile] = useState<any>(null);

  const [addMemberMode, setAddMemberMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Admin transfer modal
  const [showAdminTransfer, setShowAdminTransfer] = useState(false);
  const [selectedNewAdmin, setSelectedNewAdmin] = useState<string | null>(null);

  useEffect(() => {
    loadGroupData();
  }, [conversationId]);

  const loadGroupData = async () => {
    try {
      // Re-using getConversations to find the specific one is inefficient but works if we don't have getConversationById
      // Ideally we should have a getConversationById endpoint.
      // For now, let's assume getConversations returns needed data or we use what param passed + refetch?
      // Actually, messageCtrl.getConversations returns list.
      // Let's implement a quick fix: pass data via params if possible, or assume we fetch it.
      // Since existing API doesn't have getSingleConversation, we'll iterate or just rely on passing data?
      // Passing data might be stale.
      // Let's rely on getConversations (users list) for now, filtered.
      const res = await getConversations(1); // Potentially bug if paginated
      const conv = res.conversations.find((c: any) => c._id === conversationId);
      if (conv) {
        setGroupData(conv);
        setGroupName(conv.groupName);
        setAvatar(conv.groupAvatar);
        setMembers(conv.recipients);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatarFile(result.assets[0]);
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    setUpdating(true);
    try {
      let url = avatar;
      if (avatarFile) {
        const uploadRes = await imageUpload([avatarFile]);
        url = uploadRes[0].url;
      }

      await updateGroupAPI(conversationId, {
        groupName,
        groupAvatar: url,
        recipients: members.map((m) => m._id),
      });
      setIsEditing(false);
      setAvatarFile(null); // Reset file reference
      await loadGroupData(); // Reload to get updated avatar
      Alert.alert('Success', 'Group updated successfully');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update group');
    } finally {
      setUpdating(false);
    }
  };

  const removeMember = (memberId: string) => {
    if (members.length <= 3) {
      Alert.alert('Cannot remove', 'Group must have at least 3 members');
      return;
    }
    Alert.alert('Remove Member', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const newMembers = members.filter((m) => m._id !== memberId);
          setMembers(newMembers);
          // Auto-save or wait for save button? Let's wait for save button if in edit mode,
          // OR if not in edit mode, do prompt update.
          // Let's do prompt update for better UX.
          try {
            await updateGroupAPI(conversationId, { recipients: newMembers.map((m) => m._id) });
          } catch (e) {
            console.error(e);
          }
        },
      },
    ]);
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length > 2) {
      const res = await searchUser(text);
      // Filter out existing members
      const filtered = res.users.filter((u: any) => !members.find((m) => m._id === u._id));
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  };

  const addMember = async (newMember: any) => {
    const newMembers = [...members, newMember];
    setMembers(newMembers);
    setAddMemberMode(false);
    setSearchQuery('');
    try {
      await updateGroupAPI(conversationId, { recipients: newMembers.map((m) => m._id) });
    } catch (e) {
      console.error(e);
    }
  };

  const handleLeaveGroup = () => {
    if (!user) return;

    // Check if user is admin and last admin
    const isAdmin = groupData?.admins?.some((adminId: any) => adminId === user._id);
    const remainingAdmins = groupData?.admins?.filter((adminId: any) => adminId !== user._id) || [];
    const isLastAdmin = isAdmin && remainingAdmins.length === 0;

    if (isLastAdmin) {
      setShowAdminTransfer(true);
      return;
    }

    Alert.alert('Leave Group', 'Are you sure you want to leave?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await leaveGroupAPI(conversationId);
            Alert.alert('Success', 'Left group successfully');
            navigation.popToTop();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.msg || 'Failed to leave group');
          }
        },
      },
    ]);
  };

  const handleConfirmLeaveWithTransfer = async () => {
    if (!selectedNewAdmin) {
      Alert.alert('Error', 'Please select a new admin');
      return;
    }

    try {
      await leaveGroupAPI(conversationId, selectedNewAdmin);
      Alert.alert('Success', 'Admin transferred. Left group successfully');
      setShowAdminTransfer(false);
      navigation.popToTop();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to leave group');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4F637" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerImageContainer}>
        <Image
          source={{ uri: avatar || 'https://via.placeholder.com/150' }}
          style={styles.groupAvatar}
        />
        {isEditing && (
          <TouchableOpacity style={styles.editIcon} onPress={handlePickImage}>
            <Ionicons name="camera" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.infoContainer}>
        {isEditing ? (
          <TextInput
            style={styles.nameInput}
            value={groupName}
            onChangeText={setGroupName}
            placeholder="Group Name"
          />
        ) : (
          <Text style={styles.groupName}>{groupName}</Text>
        )}

        {isEditing ? (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <TouchableOpacity
              style={[styles.btn, styles.saveBtn]}
              onPress={handleSave}
              disabled={updating}>
              {updating ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.btnText}>Save</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn]}
              onPress={() => setIsEditing(false)}>
              <Text style={{ color: '#000' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
            <Ionicons name="pencil" size={16} color="#000" />
            <Text style={{ marginLeft: 5 }}>Edit Group Info</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.membersSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Members ({members.length})</Text>
          <TouchableOpacity onPress={() => setAddMemberMode(!addMemberMode)}>
            <Ionicons name={addMemberMode ? 'close' : 'person-add'} size={22} color="#000" />
          </TouchableOpacity>
        </View>

        {addMemberMode && (
          <View style={styles.searchBox}>
            <TextInput
              placeholder="Search users to add..."
              value={searchQuery}
              onChangeText={handleSearch}
              style={{ flex: 1, padding: 8 }}
            />
            {searchResults.length > 0 && (
              <View style={{ maxHeight: 150 }}>
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.searchItem} onPress={() => addMember(item)}>
                      <Image source={{ uri: item.avatar }} style={styles.smallAvatar} />
                      <Text>{item.username}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </View>
        )}

        {members.map((member) => (
          <View key={member._id} style={styles.memberItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image source={{ uri: member.avatar }} style={styles.memberAvatar} />
              <View>
                <Text style={styles.memberName}>{member.username}</Text>
                {groupData?.admins?.includes(member._id) && (
                  <Text style={styles.adminText}>Admin</Text>
                )}
              </View>
            </View>
            {member._id !== user._id && (
              <TouchableOpacity onPress={() => removeMember(member._id)}>
                <Ionicons name="trash-outline" size={20} color="#ff4444" />
              </TouchableOpacity>
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.leaveBtn} onPress={handleLeaveGroup}>
          <Text style={styles.leaveText}>Leave Group</Text>
        </TouchableOpacity>
      </View>

      {/* Admin Transfer Modal */}
      {showAdminTransfer && (
        <View style={styles.modalOverlay}>
          <View style={styles.adminModal}>
            <Text style={styles.modalTitle}>Transfer Admin Role</Text>
            <Text style={styles.modalSubtitle}>
              You are the last admin. Please select a new admin before leaving.
            </Text>

            <ScrollView style={styles.adminList}>
              {members
                .filter((m) => user && m._id !== user._id)
                .map((member) => (
                  <TouchableOpacity
                    key={member._id}
                    style={[
                      styles.adminOption,
                      selectedNewAdmin === member._id && styles.adminOptionSelected,
                    ]}
                    onPress={() => setSelectedNewAdmin(member._id)}>
                    <Image source={{ uri: member.avatar }} style={styles.smallAvatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName}>{member.username}</Text>
                      <Text style={styles.memberFullname}>{member.fullname}</Text>
                    </View>
                    {selectedNewAdmin === member._id && (
                      <Ionicons name="checkmark-circle" size={24} color="#D4F637" />
                    )}
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  setShowAdminTransfer(false);
                  setSelectedNewAdmin(null);
                }}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  styles.confirmBtn,
                  !selectedNewAdmin && styles.btnDisabled,
                ]}
                onPress={handleConfirmLeaveWithTransfer}
                disabled={!selectedNewAdmin}>
                <Text style={styles.confirmBtnText}>Transfer & Leave</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerImageContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  groupAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eee',
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: '#000',
    padding: 6,
    borderRadius: 20,
  },
  infoContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  groupName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  nameInput: {
    fontSize: 22,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    minWidth: 200,
    textAlign: 'center',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtn: {
    backgroundColor: '#D4F637',
  },
  cancelBtn: {
    backgroundColor: '#eee',
  },
  btnText: {
    fontWeight: 'bold',
  },
  membersSection: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
  },
  adminText: {
    fontSize: 10,
    color: 'gray',
  },
  leaveBtn: {
    marginTop: 20,
    alignSelf: 'center',
  },
  leaveText: {
    color: 'red',
    fontWeight: 'bold',
  },
  searchBox: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  smallAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: '#666',
    marginBottom: 16,
    fontSize: 14,
  },
  adminList: {
    maxHeight: 250,
  },
  adminOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  adminOptionSelected: {
    backgroundColor: '#D4F637' + '20',
    borderWidth: 1,
    borderColor: '#D4F637',
  },
  memberFullname: {
    fontSize: 12,
    color: '#999',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  modalBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#f0f0f0',
  },
  confirmBtn: {
    backgroundColor: '#D4F637',
  },
  confirmBtnText: {
    fontWeight: 'bold',
  },
  btnDisabled: {
    opacity: 0.5,
  },
});

export default GroupDetailsScreen;
