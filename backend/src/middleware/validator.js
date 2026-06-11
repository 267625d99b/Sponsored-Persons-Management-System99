const Joi = require('joi');

// Schema للمكفولين
const sponsoredSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required().messages({
    'string.min': 'الاسم يجب أن يكون حرفين على الأقل',
    'string.max': 'الاسم طويل جداً',
    'any.required': 'الاسم مطلوب'
  }),
  idNumber: Joi.string().min(5).max(20).required().messages({
    'string.min': 'رقم الهوية يجب أن يكون 5 أرقام على الأقل',
    'string.max': 'رقم الهوية طويل جداً',
    'any.required': 'رقم الهوية مطلوب'
  }),
  phone: Joi.string().pattern(/^[0-9+\-\s]*$/).max(20).allow('', null).messages({
    'string.pattern.base': 'رقم الهاتف غير صحيح'
  }),
  sponsorshipStartDate: Joi.string().required().messages({
    'any.required': 'تاريخ بداية الكفالة مطلوب'
  }),
  annualAmount: Joi.number().positive().required().messages({
    'number.positive': 'قيمة الكفالة يجب أن تكون أكبر من صفر',
    'any.required': 'قيمة الكفالة مطلوبة'
  }),
  status: Joi.string().valid('active', 'inactive').default('active'),
  notes: Joi.string().max(500).allow('', null)
});

// Schema للدفعات
const paymentSchema = Joi.object({
  sponsored: Joi.alternatives().try(Joi.string(), Joi.number()).required().messages({
    'any.required': 'يرجى تحديد المكفول'
  }),
  amount: Joi.number().positive().required().messages({
    'number.positive': 'المبلغ يجب أن يكون أكبر من صفر',
    'any.required': 'المبلغ مطلوب'
  }),
  paymentDate: Joi.string().required().messages({
    'any.required': 'تاريخ الدفع مطلوب'
  }),
  notes: Joi.string().max(500).allow('', null)
});

// Schema لتسجيل الدخول
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'بريد إلكتروني غير صالح',
    'any.required': 'البريد الإلكتروني مطلوب'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
    'any.required': 'كلمة المرور مطلوبة'
  })
});

// Schema لتغيير كلمة المرور - محسّن
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'كلمة المرور الحالية مطلوبة'
  }),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
      'string.pattern.base': 'كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم',
      'any.required': 'كلمة المرور الجديدة مطلوبة'
    })
});

// Middleware للتحقق
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const messages = error.details.map(d => d.message);
      return res.status(400).json({ 
        message: messages[0],
        errors: messages 
      });
    }
    
    req.body = value;
    next();
  };
};

module.exports = {
  validate,
  sponsoredSchema,
  paymentSchema,
  loginSchema,
  changePasswordSchema
};
