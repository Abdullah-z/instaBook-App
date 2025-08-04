export const getMapPreview = (latitude: number, longitude: number) => {
  const token = 'pk.b17d1c8a8e839864dc71cb3b90dd60bc'; // ← Replace with your real token
  return `https://maps.locationiq.com/v2/staticmap?key=${token}&center=${latitude},${longitude}&zoom=14&size=600x400&markers=icon:large-red-cutout|${latitude},${longitude}`;
};
