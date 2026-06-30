import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useTheme } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  bannerText?: string | null;
  onCancelBanner?: () => void;
  useBottomSheet?: boolean;
};

const InputComment = ({
  value,
  onChange,
  onSubmit,
  placeholder,
  bannerText,
  onCancelBanner,
  useBottomSheet,
}: Props) => {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant },
      ]}>
      {bannerText && (
        <View style={styles.replyBanner}>
          <Text style={[styles.replyText, { color: theme.colors.onSurfaceVariant }]}>
            {bannerText}
          </Text>
          <TouchableOpacity onPress={onCancelBanner}>
            <MaterialIcons name="close" size={20} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.inputRow}>
        {useBottomSheet ? (
          <BottomSheetTextInput
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
        ) : (
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
        )}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={onSubmit}>
          <MaterialIcons name="send" size={22} color={theme.colors.onPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default InputComment;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  replyBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  replyText: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
