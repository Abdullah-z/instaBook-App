import { BlueDark } from './BlueDark';
import { BlueLight } from './BlueLight';
import { GreenDark } from './GreenDark';
import { GreenLight } from './GreenLight';
import { RedDark } from './RedDark';
import { RedLight } from './RedLight';
import { YellowDark } from './YellowDark';
import { YellowLight } from './YellowLight';
import { PurpleDark } from './PurpleDark';
import { PurpleLight } from './PurpleLight';
import { OrangeDark } from './OrangeDark';
import { OrangeLight } from './OrangeLight';
import { NeonPinkDark } from './NeonPinkDark';
import { NeonPinkLight } from './NeonPinkLight';
import { NeonCyanDark } from './NeonCyanDark';
import { NeonCyanLight } from './NeonCyanLight';
import { NeonLimeDark } from './NeonLimeDark';
import { NeonLimeLight } from './NeonLimeLight';
import { ElectricBlueDark } from './ElectricBlueDark';
import { ElectricBlueLight } from './ElectricBlueLight';

export const changeTheme = (themeColor: string) => {
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
  } else if (themeColor === 'p') {
    return {
      light: PurpleLight,
      dark: PurpleDark,
    };
  } else if (themeColor === 'o') {
    return {
      light: OrangeLight,
      dark: OrangeDark,
    };
  } else if (themeColor === 'np') {
    return {
      light: NeonPinkLight,
      dark: NeonPinkDark,
    };
  } else if (themeColor === 'nc') {
    return {
      light: NeonCyanLight,
      dark: NeonCyanDark,
    };
  } else if (themeColor === 'nl') {
    return {
      light: NeonLimeLight,
      dark: NeonLimeDark,
    };
  } else if (themeColor === 'eb') {
    return {
      light: ElectricBlueLight,
      dark: ElectricBlueDark,
    };
  } else {
    return {};
  }
};
