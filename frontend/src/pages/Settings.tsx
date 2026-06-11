import { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, App, Popconfirm, Row, Col, Timeline, Form, Input, Select, InputNumber, Divider, Layout, Menu } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Download,
  Trash2,
  RefreshCw,
  User,
  FileText,
  Activity,
  HardDrive,
  Plus,
  Lock,
  Settings as SettingsIcon,
  Building,
  Save,
  Shield,
  Cpu,
  Eye
} from 'lucide-react';
import { backupAPI, activityAPI, settingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AdminManagement from '../components/AdminManagement';

const { Sider, Content } = Layout;

// --- مكون حالة النظام (System Health) ---
const SystemHealth = ({ backups, emailStatus }: { backups: any[], emailStatus: any }) => {
  const totalStorage = backups.reduce((sum, b) => sum + b.fileSize, 0);
  
  return (
    <div className="health-card">
      <Row gutter={[24, 24]} align="middle">
        <Col xs={24} md={6}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="health-status-dot" style={{ color: '#10b981' }} />
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>قاعدة البيانات</div>
              <div style={{ fontWeight: 600 }}>متصلة (SQLite)</div>
            </div>
          </div>
        </Col>
        <Col xs={24} md={6}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="health-status-dot" style={{ color: emailStatus.configured ? '#10b981' : '#f59e0b' }} />
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>خدمة البريد</div>
              <div style={{ fontWeight: 600 }}>{emailStatus.configured ? 'جاهزة' : 'غير مُعدة'}</div>
            </div>
          </div>
        </Col>
        <Col xs={24} md={6}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Cpu size={18} style={{ color: '#3b82f6' }} />
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>إصدار النظام</div>
              <div style={{ fontWeight: 600 }}>v2.1.0-Stable</div>
            </div>
          </div>
        </Col>
        <Col xs={24} md={6}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <HardDrive size={18} style={{ color: '#8b5cf6' }} />
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>مساحة النسخ</div>
              <div style={{ fontWeight: 600 }}>{(totalStorage / 1024).toFixed(1)} KB</div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

// --- مكون المعاينة الفورية (Live Preview) ---
const LivePreview = ({ values }: { values: any }) => {
  return (
    <div className="preview-card">
      <div className="preview-badge"><Eye size={12} style={{ marginLeft: 6 }} /> معاينة الهوية</div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>اسم المؤسسة في التقارير:</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#1e3a5f' }}>{values?.organizationName || 'اسم المؤسسة'}</div>
      </div>
      <Divider style={{ borderColor: '#e2e8f0', margin: '16px 0' }} />
      <Row gutter={16}>
        <Col span={24}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>تنسيق المبالغ:</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1e3a5f' }}>
            {values?.currencyPosition === 'before' ? `${values?.currencySymbol || '$'} 1,250` : `1,250 ${values?.currencySymbol || 'ريال'}`}
          </div>
        </Col>
      </Row>
    </div>
  );
};

interface Backup {
  _id: string;
  filename: string;
  fileSize: number;
  type: string;
  createdAt: string;
}

interface ActivityLog {
  _id: string;
  adminName: string;
  action: string;
  entityType: string;
  entityName: string;
  createdAt: string;
}

interface SystemSettings {
  currency: string;
  currencySymbol: string;
  currencyPosition: 'before' | 'after';
  dateFormat: string;
  renewalReminderDays: number;
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
  organizationName: string;
  language: string;
}

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [backups, setBackups] = useState<Backup[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [creating, setCreating] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [emailStatus, setEmailStatus] = useState<{ configured: boolean; email: string | null }>({ configured: false, email: null });
  
  const [settingsForm] = Form.useForm();
  const { admin } = useAuth();
  const { message } = App.useApp();

  const watchedSettings = Form.useWatch([], settingsForm);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchBackups = async () => {
    try {
      const { data } = await backupAPI.getAll();
      setBackups(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      const logsRes = await activityAPI.getAll(1, 50);
      setActivities(logsRes.data.logs);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchEmailStatus = async () => {
    try {
      const { data } = await settingsAPI.getEmailStatus();
      setEmailStatus(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data } = await settingsAPI.get();
      settingsForm.setFieldsValue(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    Promise.all([fetchBackups(), fetchActivities(), fetchSettings(), fetchEmailStatus()]);
  }, []);

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      await backupAPI.create();
      message.success('تم إنشاء النسخة الاحتياطية بنجاح');
      fetchBackups();
    } catch (error) {
      message.error('حدث خطأ في إنشاء النسخة');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBackup = async (id: string) => {
    try {
      await backupAPI.delete(id);
      message.success('تم حذف النسخة');
      fetchBackups();
    } catch (error) {
      message.error('حدث خطأ في الحذف');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await backupAPI.restore(id);
      message.success('تم استعادة النسخة. يرجى تحديث الصفحة.');
    } catch (error) {
      message.error('حدث خطأ في الاستعادة');
    }
  };

  const handleExport = async () => {
    try {
      const { data } = await backupAPI.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      message.success('تم تصدير البيانات');
    } catch (error) {
      message.error('حدث خطأ في التصدير');
    }
  };

  const handleSaveSettings = async (values: SystemSettings) => {
    setSavingSettings(true);
    try {
      await settingsAPI.update(values);
      message.success('تم حفظ الإعدادات بنجاح');
      fetchSettings();
    } catch (error) {
      message.error('حدث خطأ في حفظ الإعدادات');
    } finally {
      setSavingSettings(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (date: string) => new Date(date).toLocaleString('ar-SA');

  const getActionColor = (action: string) => {
    if (action.includes('إضافة') || action.includes('إنشاء')) return 'green';
    if (action.includes('حذف')) return 'red';
    if (action.includes('تعديل') || action.includes('تحديث') || action.includes('تغيير')) return 'blue';
    return 'default';
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'sponsored': return <User size={14} />;
      case 'payment': return <FileText size={14} />;
      case 'backup': return <Database size={14} />;
      case 'settings': return <SettingsIcon size={14} />;
      case 'admin': return <Lock size={14} />;
      default: return <Activity size={14} />;
    }
  };

  const currencies = [
    { value: 'SAR', label: 'ريال سعودي', symbol: 'ريال' },
    { value: 'AED', label: 'درهم إماراتي', symbol: 'درهم' },
    { value: 'KWD', label: 'دينار كويتي', symbol: 'د.ك' },
    { value: 'QAR', label: 'ريال قطري', symbol: 'ر.ق' },
    { value: 'BHD', label: 'دينار بحريني', symbol: 'د.ب' },
    { value: 'OMR', label: 'ريال عماني', symbol: 'ر.ع' },
    { value: 'EGP', label: 'جنيه مصري', symbol: 'ج.م' },
    { value: 'JOD', label: 'دينار أردني', symbol: 'د.أ' },
    { value: 'USD', label: 'دولار أمريكي', symbol: '$' },
    { value: 'EUR', label: 'يورو', symbol: '€' },
  ];

  const menuItems = [
    { key: 'general', icon: <SettingsIcon size={18} />, label: 'الإعدادات العامة' },
    { key: 'backup', icon: <Database size={18} />, label: 'النسخ الاحتياطي' },
    { key: 'activity', icon: <Activity size={18} />, label: 'سجل النشاطات' },
    ...(admin?.role === 'superadmin' ? [{ key: 'admins', icon: <Shield size={18} />, label: 'إدارة المستخدمين' }] : []),
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={15}>
                <Card title={<span><Building size={18} style={{ marginLeft: 8 }} /> معلومات المؤسسة</span>} className="modern-card">
                  <Form form={settingsForm} layout="vertical" onFinish={handleSaveSettings}>
                    <Form.Item name="organizationName" label="اسم المؤسسة">
                      <Input prefix={<Building size={16} />} placeholder="اسم المؤسسة" />
                    </Form.Item>
                    <Divider>العملة والتنسيق</Divider>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item name="currency" label="العملة">
                          <Select
                            options={currencies.map(c => ({ value: c.value, label: `${c.label} (${c.symbol})` }))}
                            onChange={(value) => {
                              const currency = currencies.find(c => c.value === value);
                              if (currency) settingsForm.setFieldValue('currencySymbol', currency.symbol);
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="currencySymbol" label="رمز العملة">
                          <Input placeholder="ريال" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item name="currencyPosition" label="موضع العملة">
                      <Select
                        options={[
                          { value: 'before', label: 'قبل المبلغ ($ 100)' },
                          { value: 'after', label: 'بعد المبلغ (100 ريال)' }
                        ]}
                      />
                    </Form.Item>
                    <Divider>التنبيهات</Divider>
                    <Form.Item name="renewalReminderDays" label="التذكير قبل التجديد (أيام)">
                      <InputNumber min={1} max={90} style={{ width: '100%' }} />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" icon={<Save size={16} />} loading={savingSettings} block size="large">
                      حفظ التغييرات
                    </Button>
                  </Form>
                </Card>
              </Col>
              <Col xs={24} lg={9}>
                <LivePreview values={watchedSettings} />
              </Col>
            </Row>
          </motion.div>
        );
      case 'backup':
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card 
              title={<span><Database size={18} style={{ marginLeft: 8 }} /> النسخ الاحتياطي</span>}
              extra={
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button icon={<Download size={16} />} onClick={handleExport}>تصدير JSON</Button>
                  <Button type="primary" icon={<Plus size={16} />} onClick={handleCreateBackup} loading={creating}>نسخة جديدة</Button>
                </div>
              }
            >
              <Table 
                dataSource={backups} 
                rowKey="_id" 
                pagination={{ pageSize: 8 }}
                columns={[
                  { title: 'الملف', dataIndex: 'filename' },
                  { title: 'الحجم', dataIndex: 'fileSize', render: formatFileSize },
                  { title: 'التاريخ', dataIndex: 'createdAt', render: formatDate },
                  { title: 'إجراءات', render: (_, r) => (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button size="small" icon={<Download size={14} />} onClick={() => window.open(backupAPI.download(r._id), '_blank')} />
                      <Popconfirm title="استعادة؟" onConfirm={() => handleRestore(r._id)}><Button size="small" icon={<RefreshCw size={14} />} /></Popconfirm>
                      <Popconfirm title="حذف؟" onConfirm={() => handleDeleteBackup(r._id)}><Button size="small" danger icon={<Trash2 size={14} />} /></Popconfirm>
                    </div>
                  )}
                ]}
              />
            </Card>
          </motion.div>
        );
      case 'activity':
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card title={<span><Activity size={18} style={{ marginLeft: 8 }} /> سجل النشاطات</span>}>
              <Timeline
                items={activities.slice(0, 30).map((log) => ({
                  color: getActionColor(log.action),
                  children: (
                    <div style={{ padding: '4px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        {getEntityIcon(log.entityType)}
                        <Tag color={getActionColor(log.action)} style={{ borderRadius: 6 }}>{log.action}</Tag>
                        <span style={{ fontWeight: 600 }}>{log.entityName}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{log.adminName} • {formatDate(log.createdAt)}</div>
                    </div>
                  )
                }))}
              />
            </Card>
          </motion.div>
        );
      case 'admins':
        return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><AdminManagement /></motion.div>;
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: isMobile ? '12px' : '24px' }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <SettingsIcon size={28} style={{ color: '#3b82f6' }} />
          إعدادات النظام
        </h2>
        <p style={{ color: '#94a3b8' }}>إدارة تفضيلات النظام، النسخ الاحتياطي، وحماية الحساب</p>
      </div>

      <SystemHealth backups={backups} emailStatus={emailStatus} />

      <Layout className="settings-layout">
        <Sider 
          width={260} 
          breakpoint="lg" 
          collapsedWidth="0" 
          className="settings-sider"
          trigger={null}
        >
          <Menu
            mode="vertical"
            selectedKeys={[activeTab]}
            items={menuItems}
            onClick={({ key }) => setActiveTab(key)}
            className="settings-menu"
          />
        </Sider>
        <Content style={{ padding: isMobile ? '0' : '0 24px' }}>
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </Content>
      </Layout>
    </div>
  );
};

export default Settings;
