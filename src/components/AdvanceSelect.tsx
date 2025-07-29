import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import {
  Appbar,
  Divider,
  Headline,
  MD3DarkTheme,
  MD3LightTheme,
  PaperProvider,
  Paragraph,
  TextInput,
  ThemeProvider,
  TouchableRipple,
} from 'react-native-paper';
import {
  Dropdown,
  MultiSelectDropdown,
  DropdownInputProps,
  DropdownItemProps,
} from 'react-native-paper-dropdown';

const OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];

const MULTI_SELECT_OPTIONS = [
  { label: 'White', value: 'white' },
  { label: 'Red', value: 'red' },
  { label: 'Blue', value: 'blue' },
  { label: 'Green', value: 'green' },
  { label: 'Orange', value: 'orange' },
];

const CustomDropdownItem = ({
  width,
  option,
  value,
  onSelect,
  toggleMenu,
  isLast,
}: DropdownItemProps) => {
  const style: ViewStyle = useMemo(
    () => ({
      height: 50,
      width,
      backgroundColor:
        value === option.value ? MD3DarkTheme.colors.primary : MD3DarkTheme.colors.onPrimary,
      justifyContent: 'center',
      paddingHorizontal: 16,
    }),
    [option.value, value, width]
  );

  return (
    <>
      <TouchableRipple
        onPress={() => {
          onSelect?.(option.value);
          toggleMenu();
        }}
        style={style}>
        <Headline
          style={{
            color:
              value === option.value ? MD3DarkTheme.colors.onPrimary : MD3DarkTheme.colors.primary,
          }}>
          {option.label}
        </Headline>
      </TouchableRipple>
      {!isLast && <Divider />}
    </>
  );
};

const CustomDropdownInput = ({ placeholder, selectedLabel, rightIcon }: DropdownInputProps) => (
  <TextInput
    mode="outlined"
    placeholder={placeholder}
    placeholderTextColor={MD3DarkTheme.colors.onSecondary}
    value={selectedLabel}
    style={{ backgroundColor: MD3DarkTheme.colors.primary }}
    textColor={MD3DarkTheme.colors.onPrimary}
    right={rightIcon}
  />
);

export default function AdvanceSelect() {
  const [nightMode, setNightMode] = useState(false);
  const [gender, setGender] = useState<string>();
  const [colors, setColors] = useState<string[]>([]);
  const Theme = nightMode ? MD3DarkTheme : MD3LightTheme;

  return (
    <ThemeProvider theme={Theme}>
      <PaperProvider theme={Theme}>
        <View style={[styles.container, { backgroundColor: Theme.colors.background }]}>
          <Appbar.Header elevated>
            <Appbar.Content title="Dropdown Demo" />
            <Appbar.Action
              icon={nightMode ? 'brightness-7' : 'brightness-2'}
              onPress={() => setNightMode(!nightMode)}
            />
          </Appbar.Header>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.formWrapper}>
              <Headline>Single Select</Headline>
              <Paragraph>Default Dropdown</Paragraph>
              <Dropdown
                label="Gender"
                placeholder="Select Gender"
                options={OPTIONS}
                value={gender}
                onSelect={setGender}
              />
              {/* <Paragraph>Default Dropdown (Outline Mode)</Paragraph>
              <Dropdown
                label="Gender"
                placeholder="Select Gender"
                options={OPTIONS}
                value={gender}
                onSelect={setGender}
                mode="outlined"
              /> */}
              {/* <Paragraph>Custom Dropdown</Paragraph>
              <Dropdown
                label="Gender"
                placeholder="Select Gender"
                options={OPTIONS}
                value={gender}
                onSelect={setGender}
                menuContentStyle={{ backgroundColor: MD3DarkTheme.colors.onPrimary }}
                menuUpIcon={
                  <TextInput.Icon
                    icon="menu-up"
                    color={MD3DarkTheme.colors.primaryContainer}
                    pointerEvents="none"
                  />
                }
                menuDownIcon={
                  <TextInput.Icon
                    icon="menu-down"
                    color={MD3DarkTheme.colors.primaryContainer}
                    pointerEvents="none"
                  />
                }
                CustomDropdownItem={CustomDropdownItem}
                CustomDropdownInput={CustomDropdownInput}
              />

              <Headline>Multi Select</Headline>
              <Paragraph>Default Dropdown</Paragraph>
              <MultiSelectDropdown
                label="Colors"
                placeholder="Select Colors"
                options={MULTI_SELECT_OPTIONS}
                value={colors}
                onSelect={setColors}
              />
              <Paragraph>Default Dropdown (Outline Mode)</Paragraph>
              <MultiSelectDropdown
                label="Colors"
                placeholder="Select Colors"
                options={MULTI_SELECT_OPTIONS}
                value={colors}
                onSelect={setColors}
                mode="outlined"
              /> */}
            </View>
          </ScrollView>
        </View>
      </PaperProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formWrapper: {
    margin: 16,
  },
});
