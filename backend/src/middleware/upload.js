const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY,
  },
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.CLOUDFLARE_R2_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      const ext = file.originalname.split('.').pop() || 'jpg';
      const folder = req.originalUrl.includes('/repairs') ? 'repairs'
                   : req.originalUrl.includes('/vehicles') ? 'vehicles'
                   : req.originalUrl.includes('/users') ? 'users'
                   : req.originalUrl.includes('/shops') ? 'shops'
                   : 'uploads';
      cb(null, `workshop/${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|heic|heif/;
    const ext = allowed.test((file.originalname.split('.').pop() || '').toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (mime || ext || file.mimetype === 'image/heic' || file.mimetype === 'image/heif') {
      return cb(null, true);
    }
    cb(new Error('Images only (jpeg, jpg, png, webp, heic)'));
  }
});

const R2_PUBLIC_URL = (process.env.CLOUDFLARE_R2_PUBLIC_URL || '').replace(/\/$/, '');

function getFileKey(file) {
  return file?.key || null;
}

function getFileUrl(file) {
  if (!file || !file.key) return null;
  return `${R2_PUBLIC_URL}/${file.key}`;
}

/**
 * Upload buffer to Cloudflare R2 (for non-multer use, e.g. PDF generation)
 */
const uploadToR2 = async (fileBuffer, fileName, mimeType, contentDisposition = null) => {
  const fileKey = `workshop/uploads/${Date.now()}_${Math.random().toString(36).substring(7)}-${fileName}`;
  const command = new PutObjectCommand({
    Bucket: process.env.CLOUDFLARE_R2_BUCKET,
    Key: fileKey,
    Body: fileBuffer,
    ContentType: mimeType,
    ...(contentDisposition && { ContentDisposition: contentDisposition })
  });
  await s3.send(command);
  return `${R2_PUBLIC_URL}/${fileKey}`;
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
    const fileKey = fileUrl.replace(`${R2_PUBLIC_URL}/`, '');
    const command = new DeleteObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET,
      Key: fileKey,
    });
    await s3.send(command);
  } catch (error) {
    console.error("Failed to delete from R2:", error);
  }
};

module.exports = {
  upload,
  getFileUrl,
  getFileKey,
  uploadToR2,
  uploadBase64ToR2,
  deleteFromR2,
  s3,
};
