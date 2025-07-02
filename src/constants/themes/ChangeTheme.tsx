import {BlueDark} from './BlueDark';
import {BlueLight} from './BlueLight';
import {GreenDark} from './GreenDark';
import {GreenLight} from './GreenLight';
import {RedDark} from './RedDark';
import {RedLight} from './RedLight';
import {YellowDark} from './YellowDark';
import {YellowLight} from './YellowLight';

export const changeTheme = () => {
  console.log('called');
  if (themeColor === 'b') {
    return {
      light: BlueLight,
      dark: BlueDark,
    };
  } else if (themeColor === 'g') {
    return {
      light: GreenLight,
      dark: GreenDark,
    };
  } else if (themeColor === 'r') {
    return {
      light: RedLight,

      dark: RedDark,
    };
  } else if (themeColor === 'y') {
    return {
      light: YellowLight,
      dark: YellowDark,
    };
  } else {
    return {};
  }
};
