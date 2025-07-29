export default function rgbToHex(rgb) {
  const result = rgb.match(/\d+/g); // ["110", "93", "0"]
  if (!result || result.length < 3) return rgb;
  return (
    '#' +
    result
      .slice(0, 3)
      .map((x) => parseInt(x).toString(16).padStart(2, '0'))
      .join('')
  );
}
