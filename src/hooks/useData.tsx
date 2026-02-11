import React, { useCallback, useContext, useEffect, useState } from 'react';
import Storage from '@react-native-async-storage/async-storage';

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
import { light } from '../constants';
import { ITheme, IUseData } from '../constants/types';

export const DataContext = React.createContext({});

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(false);
  const [theme, setTheme] = useState<ITheme>(light);

  const [themeColor, setThemeColor] = useState('g');
  const [userData, setUserData] = useState(null);
  const [userID, setUserID] = useState(null);
  const [token, setToken] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [fullName, setFullName] = useState(null);
  const [themeLoaded, setThemeLoaded] = useState(false);

  // get isDark mode from storage
  const getInitialTheme = useCallback(async () => {
    try {
      const isDarkJSON = await Storage.getItem('isDark');
      if (isDarkJSON !== null) {
        setIsDark(JSON.parse(isDarkJSON));
      }

      const themeColorJSON = await Storage.getItem('themeColor');
      if (themeColorJSON !== null) {
        setThemeColor(themeColorJSON);
      }
      setThemeLoaded(true);
    } catch (e) {
      console.error('Failed to load theme settings', e);
    }
  }, []);

  // handle isDark mode
  const handleIsDark = useCallback(
    async (payload?: boolean) => {
      const newValue = payload !== undefined ? payload : !isDark;
      setIsDark(newValue);
      try {
        await Storage.setItem('isDark', JSON.stringify(newValue));
      } catch (e) {
        console.error('Failed to save isDark setting', e);
      }
    },
    [isDark, setIsDark]
  );

  const handleSetThemeColor = useCallback(
    async (color: string) => {
      setThemeColor(color);
      try {
        await Storage.setItem('themeColor', color);
      } catch (e) {
        console.error('Failed to save themeColor setting', e);
      }
    },
    [setThemeColor]
  );

  const changeTheme = () => {
    if (themeColor === 'g') {
      return {
        light: GreenLight,
        dark: GreenDark,
      };
    } else if (themeColor === 'b') {
      return {
        light: BlueLight,
        dark: BlueDark,
      };
    } else if (themeColor === 'p') {
      return {
        light: PurpleLight,
        dark: PurpleDark,
      };
    } else if (themeColor === 'r') {
      return {
        light: RedLight,
        dark: RedDark,
      };
    } else if (themeColor === 'o') {
      return {
        light: OrangeLight,
        dark: OrangeDark,
      };
    } else if (themeColor === 'y') {
      return {
        light: YellowLight,
        dark: YellowDark,
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
    } else if (themeColor === 'po') {
      return {
        light: PastelOrangeLight,
        dark: PastelOrangeDark,
      };
    } else {
      return {
        light: GreenLight,
        dark: GreenDark,
      };
    }
  };

  useEffect(() => {
    const themes = changeTheme();
    const selectedPaperTheme = isDark ? themes.dark : themes.light;
    const fullTheme: ITheme = {
      ...light,
      ...selectedPaperTheme,
      colors: {
        ...light.colors,
        ...selectedPaperTheme.colors,
      },
      fonts: light.fonts,
    };
    setTheme(fullTheme);
  }, [themeColor, isDark]);

  // get initial data for: isDark & themeColor
  useEffect(() => {
    getInitialTheme();
  }, [getInitialTheme]);

  const contextValue = {
    isDark,
    setIsDark,
    handleIsDark,
    theme,
    setTheme,

    themeColor,
    setThemeColor: handleSetThemeColor,
    changeTheme,
    userData,
    setUserData,
    userID,
    setUserID,
    token,
    setToken,
    avatar,
    setAvatar,
    fullName,
    setFullName,
    themeLoaded,
  };

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
};

export const useData = () => useContext(DataContext) as IUseData;
