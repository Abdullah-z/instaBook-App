import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ScreenContent } from '~/components/ScreenContent';

import { StyleSheet, View } from 'react-native';

import { RootStackParamList } from '../navigation';
import Table from './Table';
import {
  Avatar,
  Button,
  Card,
  Icon,
  RadioButton,
  SegmentedButtons,
  Surface,
  Text,
  TextInput,
  TouchableRipple,
} from 'react-native-paper';
import { useData } from '../hooks';
import { ScrollView, Switch } from 'react-native-gesture-handler';
import React from 'react';
import { Dropdown } from 'react-native-paper-dropdown';
type OverviewScreenNavigationProps = StackNavigationProp<RootStackParamList, 'Overview'>;

const OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];
export default function Overview() {
  const navigation = useNavigation<OverviewScreenNavigationProps>();
  const { isDark, setIsDark, setThemeColor } = useData();
  const onToggleSwitch = () => setIsDark(!isDark);
  const [value, setValue] = React.useState('');
  console.log('isDark', isDark);
  const [checked, setChecked] = React.useState('first');
  const [text, setText] = React.useState('');
  const LeftContent = (props) => <Avatar.Icon {...props} icon="folder" />;
  return (
    <ScrollView>
      <Surface style={{ height: '100%', paddingHorizontal: 5, elevation: 0 }}>
        {/* <ScreenContent path="screens/overview.tsx" title="Overview"></ScreenContent> */}

        <Table></Table>

        <SegmentedButtons
          value={value}
          onValueChange={setValue}
          buttons={[
            {
              value: 'walk',
              label: 'Walking',
              icon: 'walk',
            },
            {
              value: 'train',
              label: 'Transit',
              icon: 'train',
            },
            { value: 'drive', label: 'Driving', icon: 'car' },
          ]}
        />

        <Switch value={isDark} onValueChange={onToggleSwitch} />

        <TouchableRipple onPress={() => setThemeColor('r')}>
          <Icon source="circle" color="red" size={20} />
        </TouchableRipple>
        <TouchableRipple onPress={() => setThemeColor('g')}>
          <Icon source="circle" color="green" size={20} />
        </TouchableRipple>
        <TouchableRipple onPress={() => setThemeColor('b')}>
          <Icon source="circle" color="blue" size={20} />
        </TouchableRipple>
        <TouchableRipple onPress={() => setThemeColor('y')}>
          <Icon source="circle" color="yellow" size={20} />
        </TouchableRipple>
        <TouchableRipple onPress={() => setThemeColor('p')}>
          <Icon source="circle" color="purple" size={20} />
        </TouchableRipple>
        <TouchableRipple onPress={() => setThemeColor('o')}>
          <Icon source="circle" color="orange" size={20} />
        </TouchableRipple>

        <View>
          <RadioButton
            value="first"
            status={checked === 'first' ? 'checked' : 'unchecked'}
            onPress={() => setChecked('first')}
          />
          <RadioButton
            value="second"
            status={checked === 'second' ? 'checked' : 'unchecked'}
            onPress={() => setChecked('second')}
          />
          <TextInput label="Email" value={text} onChangeText={(text) => setText(text)} />
        </View>

        <Card style={{ marginVertical: 10 }}>
          <Card.Title title="Card Title" subtitle="Card Subtitle" left={LeftContent} />
          <Card.Content>
            <Text variant="titleLarge">Card title</Text>
            <Text variant="bodyMedium">Card content</Text>
          </Card.Content>
          <Card.Cover source={{ uri: 'https://picsum.photos/700' }} />
          <Card.Actions>
            <Button>Cancel</Button>
            <Button>Ok</Button>
          </Card.Actions>
        </Card>

        <View style={{ marginVertical: 10 }}>
          <Dropdown label="Gender" placeholder="Select Gender" options={OPTIONS} />
        </View>

        <Button
          mode="contained"
          onPress={() =>
            navigation.navigate('Details', {
              name: 'Dan',
            })
          }>
          Details
        </Button>
      </Surface>
    </ScrollView>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
});
