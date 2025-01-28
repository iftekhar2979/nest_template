// src/common/resizeWorker.ts

const { parentPort } = require('worker_threads');
// import sharp from 'sharp';
const sharp = require('sharp');

// message from main thread
parentPort?.on('message', async (data) => {
  const { fileBuffer, width, height } = data;

  try {
    // Resize the image using sharp
    const resizedImageBuffer = await sharp(fileBuffer)
      .resize(width, height)
      .toBuffer();

    parentPort?.postMessage(resizedImageBuffer);
  } catch (error) {
    console.log('Error in resizing image', error);
    parentPort?.postMessage({ error: error.message });
  }
});
