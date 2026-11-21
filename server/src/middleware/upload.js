const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const env = require('../config/env');
const { SUPPORTED_FILE_TYPES } = require('../config/constants');

const uploadDir = path.resolve(process.cwd(), env.upload.dir);
fs.mkdirSync(uploadDir, { recursive: true });

// Files are stored under random names in a private directory - never trusted names.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const random = crypto.randomBytes(12).toString('hex');
    cb(null, `${Date.now()}-${random}${path.extname(file.originalname).toLowerCase()}`);
  },
});

// Magic byte signatures - never trust the filename or MIME type alone.
function detectRealType(buffer) {
  const sig = buffer.subarray(0, 8);
  const hex = Buffer.from(sig).toString('hex');
  const ascii = buffer.subarray(0, 5).toString('utf8');

  if (hex.startsWith('25504446')) return 'application/pdf'; // %PDF
  if (hex.startsWith('504b0304')) {
    // ZIP container: distinguish DOCX vs PPTX by internal paths
    const head = buffer.subarray(0, Math.min(buffer.length, 4096)).toString('latin1');
    if (head.includes('word/')) {
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
    if (head.includes('ppt/')) {
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    }
    return 'application/zip';
  }
  if (!buffer.some((b) => b === 0) && ascii.replace(/[^\x20-\x7E\r\n\t]/g, '').length > 0) {
    return 'text/plain';
  }
  return 'unknown';
}

const upload = multer({
  storage,
  limits: { fileSize: env.upload.maxFileSize, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!Object.keys(SUPPORTED_FILE_TYPES).includes(file.mimetype.toLowerCase())) {
      cb(new Error('Unsupported file type. Upload PDF, DOCX, PPTX or TXT.'));
      return;
    }
    cb(null, true);
  },
});

const validateFileContent = (req, _res, next) => {
  if (!req.file) {
    return next(new Error('No file was uploaded'));
  }
  const buffer = fs.readFileSync(req.file.path);
  const detected = detectRealType(buffer);
  const isZip = detected === 'application/zip';
  const declared = req.file.mimetype.toLowerCase();

  if (detected === 'unknown') {
    return next(
      multer.MulterError ? new Error('File content does not match an allowed format') : null
    );
  }

  // Allow zip-based containers to match either office type (content sniffing window is small).
  const compatible =
    detected === declared ||
    (isZip && (declared.includes('wordprocessingml') || declared.includes('presentationml')));

  if (!compatible) {
    return next(new Error('File content does not match an allowed format'));
  }

  req.file.detectedType = detected;
  next();
};

module.exports = { upload, validateFileContent, uploadDir };
