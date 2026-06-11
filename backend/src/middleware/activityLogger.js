const ActivityLog = require('../models/ActivityLog');

const logActivity = (action, entityType) => {
  return (req, res, next) => {
    // حفظ الـ response الأصلي
    const originalJson = res.json.bind(res);
    
    res.json = async (data) => {
      // تسجيل النشاط بعد نجاح العملية
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const admin = req.admin;
          const entityId = req.params.id || data?._id || data?.id;
          const entityName = data?.fullName || data?.full_name || data?.originalName || null;
          
          await ActivityLog.create({
            adminId: admin?.id,
            adminName: admin?.name,
            action,
            entityType,
            entityId,
            entityName,
            details: {
              method: req.method,
              path: req.path,
              body: req.body
            },
            ipAddress: req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress
          });
        } catch (error) {
          console.error('Error logging activity:', error);
        }
      }
      
      return originalJson(data);
    };
    
    next();
  };
};

module.exports = { logActivity };
