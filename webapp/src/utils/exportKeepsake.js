import { toPng } from 'html-to-image';

// Render at a predictable phone width; the complete content determines height.
export async function exportKeepsake(element) {
  await document.fonts?.ready;
  const host = document.createElement('div');
  const clone = element.cloneNode(true);
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:390px;pointer-events:none;';
  clone.style.width = '390px';
  clone.style.maxWidth = 'none';
  host.appendChild(clone);
  document.body.appendChild(host);
  try {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const height = Math.ceil(clone.getBoundingClientRect().height);
    // Respect conservative canvas limits without shrinking the reading width.
    const pixelRatio = Math.min(3, 16384 / height, Math.sqrt(16000000 / (390 * height)));
    if (!Number.isFinite(pixelRatio) || pixelRatio < 1) {
      throw new Error('La tarjeta excede el tamaño de imagen admitido por este navegador.');
    }
    const image = await toPng(clone, { pixelRatio, skipAutoScale: true, width: 390, height, backgroundColor: '#fffaf0' });
    if (!image.startsWith('data:image/png;base64,')) throw new Error('No se pudo generar la imagen completa.');
    return image;
  } finally {
    host.remove();
  }
}
