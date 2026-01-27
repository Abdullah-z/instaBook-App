import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from 'react-native-paper';
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
  const theme = useTheme();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant },
      ]}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={theme.colors.onSurfaceVariant}
        value={value}
        onChangeText={onChange}
        multiline
        style={[
          styles.input,
          { backgroundColor: theme.colors.surfaceVariant, color: theme.colors.onSurface },
        ]}
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
        onPress={onSubmit}>
        <MaterialIcons name="send" size={22} color={theme.colors.onPrimary} />
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
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  button: {
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
