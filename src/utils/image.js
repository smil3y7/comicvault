// Phone camera photos routinely land at 4–7 MB each. Stored raw across a few
// hundred comics (cover + back image) that would balloon the database into
// gigabytes — sql.js keeps the whole file in memory and rewrites it whole on
// every save, so this matters a lot for both performance and reliability.
//
// Fix: downscale + re-encode to JPEG client-side, before the image ever
// reaches the storage adapter. 1400px on the long edge is comfortably more
// detail than a screen or a printed PDF catalog needs, and quality 0.82 is
// visually close to lossless for photos while cutting file size drastically.
const DEFAULT_MAX_DIMENSION = 1400;
const DEFAULT_QUALITY = 0.82;

export function compressImage(file, { maxDimension = DEFAULT_MAX_DIMENSION, quality = DEFAULT_QUALITY } = {}) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
}
