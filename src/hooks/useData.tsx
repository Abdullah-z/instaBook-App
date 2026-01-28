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
import { light } from '../constants';
import { ITheme, IUseData } from '../constants/types';

export const DataContext = React.createContext({});

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(false);
  const [theme, setTheme] = useState<ITheme>(light);

  const [themeColor, setThemeColor] = useState('b');
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
    async (payload: boolean) => {
      setIsDark(payload);
      try {
        await Storage.setItem('isDark', JSON.stringify(payload));
      } catch (e) {
        console.error('Failed to save isDark setting', e);
      }
    },
    [setIsDark]
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

  // handle users / profiles
  // const handleUsers = useCallback(
  //   (payload: IUser[]) => {
  //     // set users / compare if has updated
  //     if (JSON.stringify(payload) !== JSON.stringify(users)) {
  //       setUsers({ ...users, ...payload });
  //     }
  //   },
  //   [users, setUsers]
  // );

  // // handle user
  // const handleUser = useCallback(
  //   (payload: IUser) => {
  //     // set user / compare if has updated
  //     if (JSON.stringify(payload) !== JSON.stringify(user)) {
  //       setUser(payload);
  //     }
  //   },
  //   [user, setUser]
  // );

  // // handle Article
  // const handleArticle = useCallback(
  //   (payload: IArticle) => {
  //     // set article / compare if has updated
  //     if (JSON.stringify(payload) !== JSON.stringify(article)) {
  //       setArticle(payload);
  //     }
  //   },
  //   [article, setArticle]
  // );

  const changeTheme = () => {
    console.log('callssed');
    if (themeColor === 'g') {
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
      return {
        light: BlueLight,
        dark: BlueDark,
      };
    }
  };

  useEffect(() => {
    changeTheme();
  }, [themeColor]);

  // get initial data for: isDark & themeColor
  useEffect(() => {
    getInitialTheme();
  }, [getInitialTheme]);

  // change theme based on isDark updates
  useEffect(() => {
    // Note: The custom matching ITheme for dark mode is not yet fully implemented
    // in constants, but we ensure the state is reactive to transitions.
    setTheme(isDark ? light : light);
  }, [isDark]);

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
