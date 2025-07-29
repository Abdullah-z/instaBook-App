import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  replyTo?: string | null;
  onCancelReply?: () => void;
};

const InputComment = ({
  value,
  onChange,
  onSubmit,
  placeholder,
  replyTo,
  onCancelReply,
}: Props) => {
  return (
    <View style={styles.container}>
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChange}
        multiline
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={onSubmit}>
        <MaterialIcons name="send" size={22} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default InputComment;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 120,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 20,
    marginLeft: 8,
  },
});
