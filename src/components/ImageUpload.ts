export const imageUpload = async (images: string[]) => {
  const imgArr: { public_id: string; url: string }[] = [];

  for (const uri of images) {
    const formData = new FormData();

    const fileName = uri.split('/').pop() || 'photo.jpg';
    const fileType = fileName.split('.').pop();

    formData.append('file', {
      uri,
      name: fileName,
      type: `image/${fileType}`,
    } as any);

    formData.append('upload_preset', 'dprkhzls');
    formData.append('cloud_name', 'dcxgup2xo');

    const res = await fetch('https://api.cloudinary.com/v1_1/dcxgup2xo/image/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    imgArr.push({ public_id: data.public_id, url: data.secure_url });
  }

  return imgArr;
};
