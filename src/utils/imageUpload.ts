export const imageUpload = async (images: any[]) => {
  let imgArr = [];

  for (const item of images) {
    try {
      const formData: any = new FormData();

      // Get file extension from URI
      const uriParts = item.uri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      // Format image data for React Native
      const imageData = {
        uri: item.uri,
        type: `image/${fileType}`,
        name: `photo_${Date.now()}.${fileType}`,
      };

      formData.append('file', imageData as any);
      formData.append('upload_preset', 'dprkhzls');
      formData.append('cloud_name', 'dcxgup2xo');

      console.log('📤 Uploading image to Cloudinary...');

      const res = await fetch('https://api.cloudinary.com/v1_1/dcxgup2xo/image/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Upload error response:', errorText);
        throw new Error(`Upload failed with status: ${res.status}`);
      }

      const data = await res.json();
      console.log('✅ Image uploaded successfully');
      imgArr.push({ public_id: data.public_id, url: data.secure_url });
    } catch (error) {
      console.error('❌ Failed to upload image:', error);
      throw error;
    }
  }

  return imgArr;
};
