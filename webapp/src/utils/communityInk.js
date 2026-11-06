export function contrastRatio(a, b) {
  const luminance = (hex) => {
    const values = hex.replace('#', '').match(/../g).map((v) => parseInt(v, 16) / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
  };
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

export function communityInk(color) {
  if (!/^#[0-9a-f]{6}$/i.test(color || '')) return '#ffffff';
  return contrastRatio(color, '#101923') >= 4.5 ? '#101923' : contrastRatio(color, '#ffffff') >= 4.5 ? '#ffffff' : '#000000';
}
