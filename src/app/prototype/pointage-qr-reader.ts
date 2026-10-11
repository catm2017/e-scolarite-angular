import jsQR from 'jsqr';

/** Décode une image de la caméra sans dépendre de BarcodeDetector. */
export function lireQrPointage(video: HTMLVideoElement, canvas: HTMLCanvasElement): string | null {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth || !video.videoHeight) return null;

  const ratio = Math.min(1, 720 / Math.max(video.videoWidth, video.videoHeight));
  const largeur = Math.round(video.videoWidth * ratio);
  const hauteur = Math.round(video.videoHeight * ratio);
  if (canvas.width !== largeur) canvas.width = largeur;
  if (canvas.height !== hauteur) canvas.height = hauteur;

  const contexte = canvas.getContext('2d', { willReadFrequently: true });
  if (!contexte) return null;
  contexte.drawImage(video, 0, 0, largeur, hauteur);
  const image = contexte.getImageData(0, 0, largeur, hauteur);
  return jsQR(image.data, largeur, hauteur, { inversionAttempts: 'attemptBoth' })?.data?.trim() || null;
}
