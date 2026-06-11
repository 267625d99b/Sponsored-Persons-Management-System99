const Sponsored = require('../models/Sponsored');
const Payment = require('../models/Payment');

exports.getDashboard = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(403).json({ message: 'لا يوجد tenant محدد' });

    const currentYear = new Date().getFullYear();
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const totalSponsored = await Sponsored.count(tenantId);
    const activeSponsored = await Sponsored.countActive(tenantId);
    const totalCollectedThisYear = await Payment.getTotalByYear(currentYear, tenantId);
    const allSponsored = await Sponsored.findActive(tenantId);

    let overdueList = [];
    let upcomingRenewalList = [];
    let totalExpected = 0;

    for (const s of allSponsored) {
      totalExpected += s.annual_amount;

      const totalPaid = await Payment.getTotalBySponsoredAndYear(s.id, currentYear, tenantId);
      const isPaid = totalPaid >= s.annual_amount;

      const start = new Date(s.sponsorship_start_date);
      let renewalDate = new Date(start);
      while (renewalDate <= now) {
        renewalDate.setFullYear(renewalDate.getFullYear() + 1);
      }
      const lastRenewal = new Date(renewalDate);
      lastRenewal.setFullYear(lastRenewal.getFullYear() - 1);

      if (!isPaid && now > lastRenewal) {
        overdueList.push({
          _id: s.id,
          fullName: s.full_name,
          idNumber: s.id_number,
          annualAmount: s.annual_amount,
          totalPaid,
          remaining: s.annual_amount - totalPaid,
          renewalDate: lastRenewal.toISOString()
        });
      }

      if (renewalDate <= thirtyDaysLater && renewalDate > now) {
        upcomingRenewalList.push({
          _id: s.id,
          fullName: s.full_name,
          idNumber: s.id_number,
          annualAmount: s.annual_amount,
          renewalDate: renewalDate.toISOString(),
          daysUntilRenewal: Math.ceil((renewalDate - now) / (1000 * 60 * 60 * 24))
        });
      }
    }

    res.json({
      stats: { totalSponsored, activeSponsored, totalCollectedThisYear, totalExpected, overdueCount: overdueList.length, upcomingRenewalCount: upcomingRenewalList.length },
      overdueList,
      upcomingRenewalList
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};

exports.getYearlyReport = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const year = parseInt(req.params.year) || new Date().getFullYear();

    const totalCollected = await Payment.getTotalByYear(year, tenantId);
    const totalPayments = await Payment.countByYear(year, tenantId);
    const sponsored = await Sponsored.findActive(tenantId);
    const totalExpected = sponsored.reduce((sum, s) => sum + s.annual_amount, 0);

    res.json({
      year,
      totalCollected,
      totalExpected,
      collectionRate: totalExpected > 0 ? ((totalCollected / totalExpected) * 100).toFixed(2) : 0,
      totalPayments
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};
