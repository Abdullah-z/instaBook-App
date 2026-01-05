import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Alert, Platform } from 'react-native';
import Toast from 'react-native-toast-message';

/**
 * Downloads an image from a URL and saves it to the device's media library.
 * @param url The image URL to download and save.
 */
export const downloadAndSaveImage = async (url: string) => {
  if (!url) {
    Toast.show({
      type: 'error',
      text1: 'Save failed',
      text2: 'Invalid image URL',
    });
    return;
  }

  try {
    // 1. Check existing Permissions
    let permission = await MediaLibrary.getPermissionsAsync();

    // If permission has already been denied once, we might need to ask again or show settings
    if (permission.status !== 'granted' && permission.canAskAgain) {
      permission = await MediaLibrary.requestPermissionsAsync();
    }

    if (permission.status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'We need your permission to save images to your gallery. Please enable it in your device settings.'
      );
      return;
    }

    // 2. Download the file
    Toast.show({
      type: 'info',
      text1: 'Saving image...',
      position: 'bottom',
    });

    const fileExtension = url.split('.').pop()?.split('?')[0] || 'jpg';
    const filename = `download_${Date.now()}.${fileExtension}`;
    const fileUri = `${FileSystem.documentDirectory}${filename}`;

    const downloadResumable = FileSystem.createDownloadResumable(url, fileUri);
    const downloadResult = await downloadResumable.downloadAsync();

    if (!downloadResult || downloadResult.status !== 200) {
      throw new Error('Download failed');
    }

    // 3. Save to Media Library
    const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);

    // Check if album exists, if not create it. Use copyAsset: true to avoid "modify photo" prompt
    const albumName = 'Instabook';
    const album = await MediaLibrary.getAlbumAsync(albumName);

    if (album) {
      // Use true to COPY asset to album instead of moving it, avoids "modify photo" prompt
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, true);
    } else {
      await MediaLibrary.createAlbumAsync(albumName, asset, true);
    }

    Toast.show({
      type: 'success',
      text1: 'Image saved to gallery',
      position: 'bottom',
    });
  } catch (err) {
    console.error('Error saving image:', err);
    Toast.show({
      type: 'error',
      text1: 'Save failed',
      text2: 'Could not save image to gallery',
    });
  }
};

/**
 * Prompt the user to save an image on long press.
 * @param url The image URL.
 */
export const promptSaveImage = (url: string) => {
  Alert.alert(
    'Save Image',
    'Do you want to save this image to your gallery?',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Save', onPress: () => downloadAndSaveImage(url) },
    ],
    { cancelable: true }
  );
};
