import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, App } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Shield, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const LoginContent = () => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'login' | 'verify'>('login');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const onLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const { data } = await authAPI.login(values.email, values.password);
      
      if (data.requiresVerification) {
        setEmail(values.email);
        setStep('verify');
        message.info('تم إرسال رمز التحقق إلى بريدك الإلكتروني');
      } else {
        localStorage.setItem('token', data.token);
        await login(values.email, values.password);
        message.success('تم تسجيل الدخول بنجاح');
        // السوبر أدمن يذهب للإعدادات، غيره للرئيسية
        if (data.admin?.role === 'superadmin') {
          navigate('/settings');
        } else {
          navigate('/');
        }
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'حدث خطأ في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async (values: { code: string }) => {
    setLoading(true);
    try {
      const { data } = await authAPI.verifyCode(email, values.code);
      localStorage.setItem('token', data.token);
      message.success('تم التحقق بنجاح');
      if (data.admin?.role === 'superadmin') {
        window.location.href = '/settings';
      } else {
        window.location.href = '/';
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'رمز التحقق غير صحيح');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setResending(true);
    try {
      await authAPI.resendCode(email);
      message.success('تم إرسال رمز جديد');
    } catch (err: any) {
      message.error(err.response?.data?.message || 'فشل إرسال الرمز');
    } finally {
      setResending(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className="login-page">
      <div className="login-bg-mesh" />
      
      <motion.div
        className="login-card-glass"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="login-logo-container" style={{ background: 'white', padding: '10px' }}>
          <img 
            src="/الشعار.png" 
            alt="الشعار" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
          />
        </div>

        <div className="login-header-text">
          <motion.h1 variants={itemVariants}>
            {step === 'login' ? 'مرحباً بك مجدداً' : 'تحقق من الهوية'}
          </motion.h1>
          <motion.p variants={itemVariants}>
            {step === 'login' 
              ? 'يرجى تسجيل الدخول للوصول إلى لوحة التحكم' 
              : `أدخل الرمز المكون من 6 أرقام المرسل إلى ${email}`}
          </motion.p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'login' ? (
            <motion.div
              key="login-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Form form={form} layout="vertical" onFinish={onLogin} requiredMark={false}>
                <motion.div variants={itemVariants}>
                  <Form.Item
                    name="email"
                    className="modern-input"
                    rules={[
                      { required: true, message: 'البريد الإلكتروني مطلوب' },
                      { type: 'email', message: 'بريد إلكتروني غير صالح' }
                    ]}
                  >
                    <Input 
                      prefix={<Mail size={18} />} 
                      placeholder="البريد الإلكتروني" 
                      autoComplete="email"
                    />
                  </Form.Item>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Form.Item
                    name="password"
                    className="modern-input"
                    rules={[{ required: true, message: 'كلمة المرور مطلوبة' }]}
                  >
                    <Input.Password 
                      prefix={<Lock size={18} />} 
                      placeholder="كلمة المرور" 
                    />
                  </Form.Item>
                </motion.div>

                <motion.div variants={itemVariants} className="forgot-password" style={{ textAlign: 'left', marginBottom: 24 }}>
                  <a href="#" style={{ fontSize: 13, color: '#94a3b8' }}>نسيت كلمة المرور؟</a>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading} 
                    block 
                    className="modern-button"
                    icon={<ArrowRight size={18} style={{ marginLeft: 8 }} />}
                  >
                    تسجيل الدخول
                  </Button>
                </motion.div>
              </Form>
            </motion.div>
          ) : (
            <motion.div
              key="verify-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Form layout="vertical" onFinish={onVerify}>
                <div>
                  <Form.Item
                    name="code"
                    className="modern-input"
                    rules={[
                      { required: true, message: 'رمز التحقق مطلوب' },
                      { len: 6, message: 'يجب أن يكون الرمز 6 أرقام' }
                    ]}
                  >
                    <Input 
                      prefix={<Shield size={18} />} 
                      placeholder="000000" 
                      maxLength={6}
                      autoFocus
                      style={{ textAlign: 'center', letterSpacing: 8, fontSize: 20, color: '#1e3a5f' }}
                    />
                  </Form.Item>
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                  <Button 
                    type="link" 
                    onClick={resendCode} 
                    loading={resending}
                    icon={<RefreshCw size={14} />}
                    style={{ color: '#3b82f6', padding: 0 }}
                  >
                    إعادة إرسال الرمز
                  </Button>
                  <Button 
                    type="link" 
                    onClick={() => setStep('login')}
                    style={{ color: '#64748b', padding: 0 }}
                  >
                    تغيير البريد
                  </Button>
                </div>

                <div>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading} 
                    block 
                    className="modern-button"
                  >
                    تحقق الآن
                  </Button>
                </div>
              </Form>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div variants={itemVariants} className="login-footer-text">
          <p>نظام إدارة المكفولين الذكي &copy; 2026</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

const Login = () => (
  <App>
    <LoginContent />
  </App>
);

export default Login;
