import { create } from 'zustand';
import Storage from '@react-native-async-storage/async-storage';
import { ITheme, IUseData } from '../constants/types';
import { light } from '../constants';

import { GreenLight } from '../constants/themes/GreenLight';
import { GreenDark } from '../constants/themes/GreenDark';
import { RedLight } from '../constants/themes/RedLight';
import { RedDark } from '../constants/themes/RedDark';
import { YellowLight } from '../constants/themes/YellowLight';
import { YellowDark } from '../constants/themes/YellowDark';
import { BlueLight } from '../constants/themes/BlueLight';
import { BlueDark } from '../constants/themes/BlueDark';
import { PurpleLight } from '../constants/themes/PurpleLight';
import { PurpleDark } from '../constants/themes/PurpleDark';
import { OrangeLight } from '../constants/themes/OrangeLight';
import { OrangeDark } from '../constants/themes/OrangeDark';
import { NeonPinkLight } from '../constants/themes/NeonPinkLight';
import { NeonPinkDark } from '../constants/themes/NeonPinkDark';
import { NeonCyanLight } from '../constants/themes/NeonCyanLight';
import { NeonCyanDark } from '../constants/themes/NeonCyanDark';
import { NeonLimeLight } from '../constants/themes/NeonLimeLight';
import { NeonLimeDark } from '../constants/themes/NeonLimeDark';
import { ElectricBlueLight } from '../constants/themes/ElectricBlueLight';
import { ElectricBlueDark } from '../constants/themes/ElectricBlueDark';
import { PastelOrangeLight } from '../constants/themes/PastelOrangeLight';
import { PastelOrangeDark } from '../constants/themes/PastelOrangeDark';
import { NothingDark } from '../constants/themes/NothingDark';
import { NothingLight } from '../constants/themes/NothingLight';
import { MonochromeDark } from '../constants/themes/MonochromeDark';
import { MonochromeLight } from '../constants/themes/MonochromeLight';
import { OledDark } from '../constants/themes/OledDark';
import { OledLight } from '../constants/themes/OledLight';
import { GenZDark } from '../constants/themes/GenZDark';
import { GenZLight } from '../constants/themes/GenZLight';
import { SpectrumDark } from '../constants/themes/SpectrumDark';
import { SpectrumLight } from '../constants/themes/SpectrumLight';

const getThemesMap = (themeColor: string) => {
  switch (themeColor) {
    case 'g': return { light: GreenLight, dark: GreenDark };
    case 'b': return { light: BlueLight, dark: BlueDark };
    case 'p': return { light: PurpleLight, dark: PurpleDark };
    case 'r': return { light: RedLight, dark: RedDark };
    case 'o': return { light: OrangeLight, dark: OrangeDark };
    case 'y': return { light: YellowLight, dark: YellowDark };
    case 'np': return { light: NeonPinkLight, dark: NeonPinkDark };
    case 'nc': return { light: NeonCyanLight, dark: NeonCyanDark };
    case 'nl': return { light: NeonLimeLight, dark: NeonLimeDark };
    case 'eb': return { light: ElectricBlueLight, dark: ElectricBlueDark };
    case 'po': return { light: PastelOrangeLight, dark: PastelOrangeDark };
    case 'n': return { light: NothingLight, dark: NothingDark };
    case 'm': return { light: MonochromeLight, dark: MonochromeDark };
    case 'oled': return { light: OledLight, dark: OledDark };
    case 'genz': return { light: GenZLight, dark: GenZDark };
    case 'spectrum': return { light: SpectrumLight, dark: SpectrumDark };
    default: return { light: GreenLight, dark: GreenDark };
  }
};



const buildFullTheme = (isDark: boolean, themeColor: string): ITheme => {
  const themes = getThemesMap(themeColor);
  const selectedPaperTheme = isDark ? themes.dark : themes.light;
  return {
    ...light,
    ...selectedPaperTheme,
    colors: {
      ...light.colors,
      ...selectedPaperTheme.colors,
    },
    fonts: light.fonts,
  };
};

export const useDataStore = create<IUseData>((set, get) => ({
  isDark: false,
  theme: buildFullTheme(false, 'g'),
  themeColor: 'g',
  userData: null,
  userID: null,
  token: null,
  avatar: null,
  fullName: null,
  themeLoaded: false,

  setIsDark: (val) => {
    set((state) => ({ 
      isDark: val, 
      theme: buildFullTheme(val, state.themeColor)
    }));
  },
  setTheme: (theme) => set({ theme }),
  setThemeColor: (color) => {
    set((state) => ({ 
      themeColor: color,
      theme: buildFullTheme(state.isDark, color)
    }));
    Storage.setItem('themeColor', color).catch(e => console.error(e));
  },
  setUserData: (data) => set({ userData: data }),
  setUserID: (id) => set({ userID: id }),
  setToken: (token) => set({ token }),
  setAvatar: (avatar) => set({ avatar }),
  setFullName: (name) => set({ fullName: name }),

  handleIsDark: async (payload?: boolean) => {
    const { isDark } = get();
    const newValue = payload !== undefined ? payload : !isDark;
    
    set((state) => ({ 
      isDark: newValue, 
      theme: buildFullTheme(newValue, state.themeColor)
    }));

    try {
      await Storage.setItem('isDark', JSON.stringify(newValue));
    } catch (e) {
      console.error('Failed to save isDark setting', e);
    }
  },

  changeTheme: () => {
    const { themeColor } = get();
    return getThemesMap(themeColor);
  },

  getInitialTheme: async () => {
    try {
      const isDarkJSON = await Storage.getItem('isDark');
      let loadedIsDark = false;
      if (isDarkJSON !== null) {
        loadedIsDark = JSON.parse(isDarkJSON);
      }

      const themeColorJSON = await Storage.getItem('themeColor');
      let loadedThemeColor = 'g';
      if (themeColorJSON !== null) {
        loadedThemeColor = themeColorJSON;
      }
      
      set({ 
        isDark: loadedIsDark,
        themeColor: loadedThemeColor,
        theme: buildFullTheme(loadedIsDark, loadedThemeColor),
        themeLoaded: true 
      });
    } catch (e) {
      console.error('Failed to load theme settings', e);
      set({ themeLoaded: true });
    }
  }
}));

// Initialize theme on creation
useDataStore.getState().getInitialTheme();

export default useDataStore;
