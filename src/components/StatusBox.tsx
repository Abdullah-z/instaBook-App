import React, { useContext } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { AuthContext } from '../auth/AuthContext';

const StatusBox = () => {
  const { token } = useContext(AuthContext);
  const { user } = useContext(AuthContext);
  if (!user) return null;

  const handleOpenStatusModal = () => {
    console.log('Open status modal');
    // Later: trigger modal
  };

  return (
    <TouchableOpacity style={styles.statusBox} onPress={handleOpenStatusModal}>
      <Avatar.Image size={48} source={{ uri: user.avatar }} />
      <Text style={styles.prompt}>{user.username}, what's on your mind?</Text>
    </TouchableOpacity>
  );
};

export default StatusBox;

const styles = StyleSheet.create({
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f1f1f1',
    padding: 12,
    borderRadius: 8,
  },
  prompt: {
    marginLeft: 10,
    fontSize: 16,
    flex: 1,
  },
});
