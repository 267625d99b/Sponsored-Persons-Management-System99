const Sponsored = require('../models/Sponsored');
const Payment = require('../models/Payment');
const ActivityLog = require('../models/ActivityLog');

const formatSponsored = (s) => ({
  _id: s.id,
  fullName: s.full_name,
  idNumber: s.id_number,
  phone: s.phone,
  sponsorshipStartDate: s.sponsorship_start_date,
  annualAmount: s.annual_amount,
  status: s.status,
  notes: s.notes,
  createdAt: s.created_at,
  updatedAt: s.updated_at
});

const getNextRenewalDate = (startDate) => {
  if (!startDate) return null;
  const normalized = String(startDate)
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[^\d\-\/\.]/g, ' ')
    .trim();
  const start = new Date(normalized);
  if (isNaN(start.getTime())) return null;
  const now = new Date();
  let renewalDate = new Date(start);
  while (renewalDate <= now) {
    renewalDate.setFullYear(renewalDate.getFullYear() + 1);
  }
  return renewalDate.toISOString();
};

exports.getAllSponsored = async (req, res) => {
  try {
    // superadmin يستخدم id الخاص به كـ tenant_id
    const tenantId = req.tenantId || (req.isSuperAdmin ? req.admin.id : null);
    if (!tenantId) return res.status(403).json({ message: 'لا يوجد tenant محدد' });

    const { page = 1, limit = 50, search, status, paymentStatus } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let sponsored = await Sponsored.findAll(tenantId);
    const currentYear = new Date().getFullYear();

    let result = await Promise.all(sponsored.map(async (s) => {
      const totalPaidThisYear = await Payment.getTotalBySponsoredAndYear(s.id, currentYear, tenantId);
      const remaining = Math.max(0, s.annual_amount - totalPaidThisYear);
      const isPaidThisYear = totalPaidThisYear >= s.annual_amount;
      const nextRenewalDate = getNextRenewalDate(s.sponsorship_start_date);

      return {
        ...formatSponsored(s),
        totalPaidThisYear,
        remaining,
        isPaidThisYear,
        nextRenewalDate
      };
    }));

    // فلترة
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.fullName.toLowerCase().includes(q) ||
        s.idNumber.includes(q) ||
        (s.phone && s.phone.includes(q))
      );
    }
    if (status) {
      result = result.filter(s => s.status === status);
    }
    if (paymentStatus === 'paid') {
      result = result.filter(s => s.isPaidThisYear);
    } else if (paymentStatus === 'unpaid') {
      result = result.filter(s => !s.isPaidThisYear);
    }

    const total = result.length;
    const paginatedResult = result.slice(offset, offset + limitNum);

    res.json({
      sponsored: paginatedResult,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};

exports.getSponsored = async (req, res) => {
  try {
    const tenantId = req.tenantId || (req.isSuperAdmin ? req.admin.id : null);
    const s = await Sponsored.findById(req.params.id, tenantId);
    if (!s) return res.status(404).json({ message: 'المكفول غير موجود' });

    const currentYear = new Date().getFullYear();
    const totalPaidThisYear = await Payment.getTotalBySponsoredAndYear(s.id, currentYear, tenantId);
    const payments = await Payment.findBySponsored(s.id, tenantId);

    res.json({
      ...formatSponsored(s),
      totalPaidThisYear,
      remaining: Math.max(0, s.annual_amount - totalPaidThisYear),
      isPaidThisYear: totalPaidThisYear >= s.annual_amount,
      nextRenewalDate: getNextRenewalDate(s.sponsorship_start_date),
      payments: payments.map(p => ({
        _id: p.id,
        amount: p.amount,
        paymentDate: p.payment_date,
        year: p.year,
        notes: p.notes,
        createdAt: p.created_at
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};

exports.createSponsored = async (req, res) => {
  try {
    // superadmin يستخدم id الخاص به كـ tenant_id (أو يمكن قبول tenantId من الـ body)
    const tenantId = req.tenantId || (req.isSuperAdmin ? req.admin.id : null);
    if (!tenantId) return res.status(403).json({ message: 'لا يوجد tenant محدد' });

    const existing = await Sponsored.findByIdNumber(req.body.idNumber, tenantId);
    if (existing) return res.status(400).json({ message: 'رقم الهوية مستخدم بالفعل' });

    const sponsored = await Sponsored.create(req.body, tenantId);

    await ActivityLog.create({
      tenantId,
      adminId: req.admin?.id,
      adminName: req.admin?.name,
      action: 'إضافة مكفول',
      entityType: 'sponsored',
      entityId: sponsored.id,
      entityName: sponsored.full_name,
      ipAddress: req.ip
    });

    res.status(201).json(formatSponsored(sponsored));
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};

exports.updateSponsored = async (req, res) => {
  try {
    const tenantId = req.tenantId || (req.isSuperAdmin ? req.admin.id : null);
    const existing = await Sponsored.findById(req.params.id, tenantId);
    if (!existing) return res.status(404).json({ message: 'المكفول غير موجود' });

    if (req.body.idNumber && req.body.idNumber !== existing.id_number) {
      const duplicate = await Sponsored.findByIdNumber(req.body.idNumber, tenantId);
      if (duplicate) return res.status(400).json({ message: 'رقم الهوية مستخدم بالفعل' });
    }

    const updated = await Sponsored.update(req.params.id, req.body, tenantId);

    await ActivityLog.create({
      tenantId,
      adminId: req.admin?.id,
      adminName: req.admin?.name,
      action: 'تعديل مكفول',
      entityType: 'sponsored',
      entityId: updated.id,
      entityName: updated.full_name,
      ipAddress: req.ip
    });

    res.json(formatSponsored(updated));
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};

exports.deleteSponsored = async (req, res) => {
  try {
    const tenantId = req.tenantId || (req.isSuperAdmin ? req.admin.id : null);
    const existing = await Sponsored.findById(req.params.id, tenantId);
    if (!existing) return res.status(404).json({ message: 'المكفول غير موجود' });

    await Sponsored.delete(req.params.id, tenantId);

    await ActivityLog.create({
      tenantId,
      adminId: req.admin?.id,
      adminName: req.admin?.name,
      action: 'حذف مكفول',
      entityType: 'sponsored',
      entityId: parseInt(req.params.id),
      entityName: existing.full_name,
      ipAddress: req.ip
    });

    res.json({ message: 'تم الحذف بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};
