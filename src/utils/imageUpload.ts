import * as ImageManipulator from 'expo-image-manipulator';
// import { Video } from 'react-native-compressor'; // Removed to avoid Expo Go crash

export const imageUpload = async (mediaList: any[], isHD: boolean = false) => {
  const mediaArr: { public_id: string; url: string; resource_type: string }[] = [];

  for (const item of mediaList) {
    try {
      let uri = typeof item === 'string' ? item : item.uri;
      const type = typeof item === 'string' ? 'image' : item.type || 'image';
      const isVideo =
        type === 'video' || uri.endsWith('.mp4') || uri.endsWith('.mov') || uri.endsWith('.m4v');

      console.log(`Processing ${isVideo ? 'VIDEO' : 'IMAGE'}... (HD: ${isHD})`);

      if (!isHD) {
        if (isVideo) {
          console.log('🎞️ Compressing video...');
          try {
            // Dynamic require to prevent crash in Expo Go if not linked
            const { Video } = require('react-native-compressor');
            uri = await Video.compress(uri, {
              compressionMethod: 'auto',
            });
            console.log('✅ Video compressed');
          } catch (e) {
            console.warn(
              '⚠️ Video compression failed or library not available (Expo Go?). Skipping compression.'
            );
          }
        } else {
          console.log('🖼️ Compressing image...');
          const result = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 2000 } }], // Increased from 1080 to 2000 for better detail
            { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG } // Increased quality from 0.7 to 0.9
          );
          uri = result.uri;
          console.log('✅ Image compressed');
        }
      }

      const formData: any = new FormData();
      const fileName = uri.split('/').pop() || (isVideo ? 'video.mp4' : 'photo.jpg');
      const mimeType = isVideo ? `video/mp4` : `image/jpeg`;

      formData.append('file', {
        uri,
        name: fileName,
        type: mimeType,
      } as any);

      formData.append('upload_preset', 'dprkhzls');
      formData.append('cloud_name', 'dcxgup2xo');

      const endpoint = isVideo
        ? 'https://api.cloudinary.com/v1_1/dcxgup2xo/video/upload'
        : 'https://api.cloudinary.com/v1_1/dcxgup2xo/image/upload';

      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Upload error response:', errorText);
        throw new Error(`Upload failed with status: ${res.status}`);
      }

      const data = await res.json();
      mediaArr.push({
        public_id: data.public_id,
        url: data.secure_url,
        resource_type: data.resource_type || (isVideo ? 'video' : 'image'),
      });

      console.log('✅ Uploaded successfully');
    } catch (error) {
      console.error('❌ Failed to process/upload media:', error);
      // Depending on requirements, we might want to continue or throw.
      // For now, let's keep going for other items.
    }
  }

  return mediaArr;
};
