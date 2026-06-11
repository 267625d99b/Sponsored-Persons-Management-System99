const Payment = require('../models/Payment');
const Sponsored = require('../models/Sponsored');
const ActivityLog = require('../models/ActivityLog');

exports.createPayment = async (req, res) => {
  try {
    const tenantId = req.tenantId || (req.isSuperAdmin ? req.admin.id : null);
    if (!tenantId) return res.status(403).json({ message: 'لا يوجد tenant محدد' });
    const { sponsored, amount, paymentDate, notes } = req.body;

    if (!sponsored) return res.status(400).json({ message: 'يرجى تحديد المكفول' });
    if (!amount || amount <= 0) return res.status(400).json({ message: 'المبلغ يجب أن يكون أكبر من صفر' });
    if (!paymentDate) return res.status(400).json({ message: 'تاريخ الدفع مطلوب' });

    const sponsoredData = await Sponsored.findById(sponsored, tenantId);
    if (!sponsoredData) return res.status(404).json({ message: 'المكفول غير موجود' });

    const payment = await Payment.create({ sponsored, amount, paymentDate, notes }, tenantId);

    await ActivityLog.create({
      tenantId,
      adminId: req.admin?.id,
      adminName: req.admin?.name,
      action: 'تسجيل دفعة',
      entityType: 'payment',
      entityId: payment.id,
      entityName: sponsoredData.full_name,
      details: { amount: payment.amount, year: payment.year }
    });

    res.status(201).json({
      _id: payment.id,
      sponsored: payment.sponsored_id,
      amount: payment.amount,
      paymentDate: payment.payment_date,
      year: payment.year,
      notes: payment.notes,
      createdAt: payment.created_at
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تسجيل الدفعة', error: error.message });
  }
};

exports.getPaymentsBySponsored = async (req, res) => {
  try {
    const tenantId = req.tenantId || (req.isSuperAdmin ? req.admin.id : null);
    if (!tenantId) return res.status(403).json({ message: 'لا يوجد tenant محدد' });
    const payments = await Payment.findBySponsored(req.params.sponsoredId, tenantId);
    res.json(payments.map(p => ({
      _id: p.id,
      sponsored: p.sponsored_id,
      amount: p.amount,
      paymentDate: p.payment_date,
      year: p.year,
      notes: p.notes,
      createdAt: p.created_at
    })));
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تحميل الدفعات', error: error.message });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const tenantId = req.tenantId || (req.isSuperAdmin ? req.admin.id : null);
    if (!tenantId) return res.status(403).json({ message: 'لا يوجد tenant محدد' });
    const payment = await Payment.findById(req.params.id, tenantId);
    if (!payment) return res.status(404).json({ message: 'الدفعة غير موجودة' });

    const sponsored = await Sponsored.findById(payment.sponsored_id, tenantId);
    await Payment.delete(req.params.id, tenantId);

    await ActivityLog.create({
      tenantId,
      adminId: req.admin?.id,
      adminName: req.admin?.name,
      action: 'حذف دفعة',
      entityType: 'payment',
      entityId: payment.id,
      entityName: sponsored?.full_name,
      details: { amount: payment.amount, year: payment.year }
    });

    res.json({ message: 'تم حذف الدفعة بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في حذف الدفعة', error: error.message });
  }
};
