import React, { useCallback, useContext, useEffect, useState } from 'react';
//import Storage from '@react-native-async-storage/async-storage';

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

  // get isDark mode from storage
  // const getIsDark = useCallback(async () => {
  //   // get preferance gtom storage
  //   //const isDarkJSON = await Storage.getItem('isDark');

  //   if (isDarkJSON !== null) {
  //     // set isDark / compare if has updated
  //     setIsDark(JSON.parse(isDarkJSON));
  //   }
  // }, [setIsDark]);

  // handle isDark mode
  const handleIsDark = useCallback(
    (payload: boolean) => {
      // set isDark / compare if has updated
      setIsDark(payload);
      // save preferance to storage
      // Storage.setItem('isDark', JSON.stringify(payload));
    },
    [setIsDark]
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

  // get initial data for: isDark & language
  // useEffect(() => {
  //   getIsDark();
  // }, [getIsDark]);

  // change theme based on isDark updates
  useEffect(() => {
    setTheme(isDark ? light : light);
  }, [isDark]);

  const contextValue = {
    isDark,
    setIsDark,
    handleIsDark,
    theme,
    setTheme,

    themeColor,
    setThemeColor,
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
  };

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
};

export const useData = () => useContext(DataContext) as IUseData;
