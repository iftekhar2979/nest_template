// src/common/multer.config.ts
import { Worker } from 'worker_threads';
import { diskStorage } from 'multer';
import { extname } from 'path';
const path = require('path');
import { FileType } from 'src/gallery/interface/gallery.interface';
// import fs from 'fs';
const fs = require('fs');

// Function to handle resizing image in a worker thread
export const resizeImage = (
  fileBuffer: Buffer,
  width: number,
  height: number,
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    // console.log(path);
    const worker = new Worker(path.join(__dirname, 'resizeImageWorker.js'));
    worker.postMessage({ fileBuffer, width, height });

    worker.on('message', (result) => {
      console.log('result', result);
      if (result.error) {
        reject(new Error(result.error));
      } else {
        resolve(result);
      }
      worker.terminate();
    });

    worker.on('error', (error) => {
      console.log('error', error);
      reject(error);
      worker.terminate();
    });

    worker.on('exit', (code) => {
      console.log('EXit', code);
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
};

// export async function onFileUpload(req: Request, file: any, callback: Function) {

//     try {

//       // Resize the image (you can modify the width and height)
   
//     } catch (error) {
//       callback(error, null);
//     }
  
// }
// Multer configuration for handling file uploads
export const multerConfig = {
  storage: diskStorage({
    // Define the destination folder where files will be saved
    destination: 'public/uploads', // You can change this to any other folder you want
    // Define the naming convention for the uploaded files
    filename: (req, file, callback) => {
      // Create a unique file name based on the timestamp and random number
      // Read the file as a buffer
      // console.log(fil)
      

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      callback(
        null,
        file.fieldname + '-' + uniqueSuffix + extname(file.originalname),
      );
    },
  }),
  limits: {
    // Set file size limit (in bytes). 10 MB here.
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (req, file, callback) => {
    // Allow only image, audio, and video files
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'audio/mpeg',
      'audio/wav',
      'video/mp4',
      'video/webm',
      'video/ogg',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      // onFileUpload(req, file, callback);
      callback(null, true);
    } else {
      callback(
        new Error(
          'Invalid file type. Only image, audio, and video files are allowed',
        ),
        false,
      );
    }
  },
};
