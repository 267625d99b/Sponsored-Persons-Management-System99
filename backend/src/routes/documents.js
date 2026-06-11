const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const {
  uploadDocument,
  getDocumentsBySponsored,
  getFile,
  updateDocument,
  deleteDocument,
  getStats
} = require('../controllers/documentController');
const { protect } = require('../middleware/auth');

// إعداد multer للرفع
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // السماح بالصور والـ PDF
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('نوع الملف غير مدعوم'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// الملفات متاحة بدون حماية للعرض
router.get('/file/:filename', getFile);

// باقي الـ routes محمية
router.use(protect);

router.post('/upload', upload.single('file'), uploadDocument);
router.get('/sponsored/:sponsoredId', getDocumentsBySponsored);
router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);
router.get('/stats', getStats);

module.exports = router;
