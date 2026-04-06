const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Initialize the S3 client to point to Cloudflare R2
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY,
  },
});

// Setup multer memory storage to pass buffer directly to R2
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // limit to 10MB
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Error: Images Only (jpeg, jpg, png, webp)"));
  }
});

/**
 * Upload buffer to Cloudflare R2
 */
const uploadToR2 = async (fileBuffer, fileName, mimeType, contentDisposition = null) => {
  const fileKey = `repairs/${crypto.randomBytes(16).toString('hex')}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.CLOUDFLARE_R2_BUCKET,
    Key: fileKey,
    Body: fileBuffer,
    ContentType: mimeType,
    ...(contentDisposition && { ContentDisposition: contentDisposition })
  });

  await s3.send(command);

  // Return the public URL
  return `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${fileKey}`;
};

/**
 * Upload base64 string to Cloudflare R2
 */
const uploadBase64ToR2 = async (base64String, filePrefix = 'uploads') => {
  if (!base64String || !base64String.startsWith('data:image')) return null;
  
  const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return null;
  
  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');
  
  const extension = mimeType.split('/')[1] || 'jpg';
  const fileName = `${filePrefix}-${Date.now()}.${extension}`;
  
  return await uploadToR2(buffer, fileName, mimeType);
};

/**
 * Delete object from Cloudflare R2
 */
const deleteFromR2 = async (fileUrl) => {
  if (!fileUrl) return;
  try {
    const fileKey = fileUrl.replace(`${process.env.CLOUDFLARE_R2_PUBLIC_URL}/`, '');
    const command = new DeleteObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET,
      Key: fileKey,
    });
    await s3.send(command);
  } catch (error) {
    console.error("Failed to delete from R2:", error);
  }
}

module.exports = {
  upload,
  uploadToR2,
  uploadBase64ToR2,
  deleteFromR2
};
