const TARGET_DIMENSION = 4096;

export const resizeLargeImage = async (file) => {
  if (!['image/jpeg', 'image/png'].includes(file.type)) return file;

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);

    if (bitmap.width <= TARGET_DIMENSION && bitmap.height <= TARGET_DIMENSION) {
      return file;
    }

    const scale = Math.min(
      1,
      TARGET_DIMENSION / bitmap.width,
      TARGET_DIMENSION / bitmap.height
    );

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, file.type, file.type === 'image/jpeg' ? 1.0 : undefined);
    });

    if (!blob) return file;

    return new File([blob], file.name, {
      type: file.type,
      lastModified: file.lastModified
    });
  } catch (e) {
    console.warn(e)
    return file;
  } finally {
    bitmap?.close();
  }
};