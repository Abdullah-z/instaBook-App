import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#F2F3F5',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
    maxHeight: 100,
    color: '#000',
  },
  button: {
    backgroundColor: '#000',
    width: 38,
    height: 38,
    borderRadius: 19,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
});
