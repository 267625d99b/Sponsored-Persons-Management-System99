const Document = require('../models/Document');
const Sponsored = require('../models/Sponsored');
const ActivityLog = require('../models/ActivityLog');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../../uploads');

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'لم يتم اختيار ملف' });

    const tenantId = req.tenantId;
    const { sponsoredId, category, description } = req.body;

    if (!sponsoredId) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'يرجى تحديد المكفول' });
    }

    const sponsored = await Sponsored.findById(sponsoredId, tenantId);
    if (!sponsored) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'المكفول غير موجود' });
    }

    const document = await Document.create({
      sponsoredId: parseInt(sponsoredId),
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      category: category || 'other',
      description
    }, tenantId);

    await ActivityLog.create({
      tenantId,
      adminId: req.admin?.id,
      adminName: req.admin?.name,
      action: 'رفع مستند',
      entityType: 'document',
      entityId: document.id,
      entityName: sponsored.full_name,
      details: { filename: document.original_name, category: document.category }
    });

    res.status(201).json({
      _id: document.id,
      sponsoredId: document.sponsored_id,
      filename: document.filename,
      originalName: document.original_name,
      fileType: document.file_type,
      fileSize: document.file_size,
      category: document.category,
      description: document.description,
      createdAt: document.created_at,
      url: `/api/documents/file/${document.filename}`
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في رفع الملف', error: error.message });
  }
};

exports.getDocumentsBySponsored = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const documents = await Document.findBySponsored(req.params.sponsoredId, tenantId);
    res.json(documents.map(doc => ({
      _id: doc.id,
      sponsoredId: doc.sponsored_id,
      filename: doc.filename,
      originalName: doc.original_name,
      fileType: doc.file_type,
      fileSize: doc.file_size,
      category: doc.category,
      description: doc.description,
      createdAt: doc.created_at,
      url: `/api/documents/file/${doc.filename}`
    })));
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تحميل المستندات', error: error.message });
  }
};

exports.getFile = async (req, res) => {
  try {
    const filePath = path.join(uploadsDir, req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'الملف غير موجود' });
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تحميل الملف', error: error.message });
  }
};

exports.updateDocument = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { category, description } = req.body;
    const existing = await Document.findById(req.params.id, tenantId);
    if (!existing) return res.status(404).json({ message: 'المستند غير موجود' });

    await Document.update(req.params.id, { category, description }, tenantId);
    const document = await Document.findById(req.params.id);

    res.json({
      _id: document.id,
      sponsoredId: document.sponsored_id,
      filename: document.filename,
      originalName: document.original_name,
      fileType: document.file_type,
      fileSize: document.file_size,
      category: document.category,
      description: document.description,
      createdAt: document.created_at,
      url: `/api/documents/file/${document.filename}`
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تحديث المستند', error: error.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const document = await Document.findById(req.params.id, tenantId);
    if (!document) return res.status(404).json({ message: 'المستند غير موجود' });

    await Document.delete(req.params.id, tenantId);

    const filePath = path.join(uploadsDir, document.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await ActivityLog.create({
      tenantId,
      adminId: req.admin?.id,
      adminName: req.admin?.name,
      action: 'حذف مستند',
      entityType: 'document',
      entityId: document.id,
      entityName: document.original_name
    });

    res.json({ message: 'تم حذف المستند بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في حذف المستند', error: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const totalSize = await Document.getTotalSize(tenantId);
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = totalSize === 0 ? 0 : Math.floor(Math.log(totalSize) / Math.log(k));
    res.json({ totalSize, totalSizeFormatted: totalSize === 0 ? '0 Bytes' : parseFloat((totalSize / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i] });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};
