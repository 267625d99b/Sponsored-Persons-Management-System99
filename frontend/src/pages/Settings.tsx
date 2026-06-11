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

// --- ظ…ظƒظˆظ† ط­ط§ظ„ط© ط§ظ„ظ†ط¸ط§ظ… (System Health) ---
const SystemHealth = ({ backups, emailStatus }: { backups: any[], emailStatus: any }) => {
  const totalStorage = backups.reduce((sum, b) => sum + b.fileSize, 0);
  
  return (
    <div className="health-card">
      <Row gutter={[24, 24]} align="middle">
        <Col xs={24} md={6}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="health-status-dot" style={{ color: '#10b981' }} />
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ</div>
              <div style={{ fontWeight: 600 }}>ظ…طھطµظ„ط© (SQLite)</div>
            </div>
          </div>
        </Col>
        <Col xs={24} md={6}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="health-status-dot" style={{ color: emailStatus.configured ? '#10b981' : '#f59e0b' }} />
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>ط®ط¯ظ…ط© ط§ظ„ط¨ط±ظٹط¯</div>
              <div style={{ fontWeight: 600 }}>{emailStatus.configured ? 'ط¬ط§ظ‡ط²ط©' : 'ط؛ظٹط± ظ…ظڈط¹ط¯ط©'}</div>
            </div>
          </div>
        </Col>
        <Col xs={24} md={6}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Cpu size={18} style={{ color: '#3b82f6' }} />
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>ط¥طµط¯ط§ط± ط§ظ„ظ†ط¸ط§ظ…</div>
              <div style={{ fontWeight: 600 }}>v2.1.0-Stable</div>
            </div>
          </div>
        </Col>
        <Col xs={24} md={6}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <HardDrive size={18} style={{ color: '#8b5cf6' }} />
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>ظ…ط³ط§ط­ط© ط§ظ„ظ†ط³ط®</div>
              <div style={{ fontWeight: 600 }}>{(totalStorage / 1024).toFixed(1)} KB</div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

// --- ظ…ظƒظˆظ† ط§ظ„ظ…ط¹ط§ظٹظ†ط© ط§ظ„ظپظˆط±ظٹط© (Live Preview) ---
const LivePreview = ({ values }: { values: any }) => {
  return (
    <div className="preview-card">
      <div className="preview-badge"><Eye size={12} style={{ marginLeft: 6 }} /> ظ…ط¹ط§ظٹظ†ط© ط§ظ„ظ‡ظˆظٹط©</div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>ط§ط³ظ… ط§ظ„ظ…ط¤ط³ط³ط© ظپظٹ ط§ظ„طھظ‚ط§ط±ظٹط±:</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#1e3a5f' }}>{values?.organizationName || 'ط§ط³ظ… ط§ظ„ظ…ط¤ط³ط³ط©'}</div>
      </div>
      <Divider style={{ borderColor: '#e2e8f0', margin: '16px 0' }} />
      <Row gutter={16}>
        <Col span={24}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>طھظ†ط³ظٹظ‚ ط§ظ„ظ…ط¨ط§ظ„ط؛:</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1e3a5f' }}>
            {values?.currencyPosition === 'before' ? `${values?.currencySymbol || '$'} 1,250` : `1,250 ${values?.currencySymbol || 'ط±ظٹط§ظ„'}`}
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

  // ظ…طھط§ط¨ط¹ط© ط§ظ„طھط؛ظٹظٹط±ط§طھ ظ„ظ„ظ…ط¹ط§ظٹظ†ط© ط§ظ„ط­ظٹط©
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
      message.success('طھظ… ط¥ظ†ط´ط§ط، ط§ظ„ظ†ط³ط®ط© ط§ظ„ط§ط­طھظٹط§ط·ظٹط© ط¨ظ†ط¬ط§ط­');
      fetchBackups();
    } catch (error) {
      message.error('ط­ط¯ط« ط®ط·ط£ ظپظٹ ط¥ظ†ط´ط§ط، ط§ظ„ظ†ط³ط®ط©');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBackup = async (id: string) => {
    try {
      await backupAPI.delete(id);
      message.success('طھظ… ط­ط°ظپ ط§ظ„ظ†ط³ط®ط©');
      fetchBackups();
    } catch (error) {
      message.error('ط­ط¯ط« ط®ط·ط£ ظپظٹ ط§ظ„ط­ط°ظپ');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await backupAPI.restore(id);
      message.success('طھظ… ط§ط³طھط¹ط§ط¯ط© ط§ظ„ظ†ط³ط®ط©. ظٹط±ط¬ظ‰ طھط­ط¯ظٹط« ط§ظ„طµظپط­ط©.');
    } catch (error) {
      message.error('ط­ط¯ط« ط®ط·ط£ ظپظٹ ط§ظ„ط§ط³طھط¹ط§ط¯ط©');
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
      message.success('طھظ… طھطµط¯ظٹط± ط§ظ„ط¨ظٹط§ظ†ط§طھ');
    } catch (error) {
      message.error('ط­ط¯ط« ط®ط·ط£ ظپظٹ ط§ظ„طھطµط¯ظٹط±');
    }
  };

  const handleSaveSettings = async (values: SystemSettings) => {
    setSavingSettings(true);
    try {
      await settingsAPI.update(values);
      message.success('طھظ… ط­ظپط¸ ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ ط¨ظ†ط¬ط§ط­');
      fetchSettings();
    } catch (error) {
      message.error('ط­ط¯ط« ط®ط·ط£ ظپظٹ ط­ظپط¸ ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ');
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
    if (action.includes('ط¥ط¶ط§ظپط©') || action.includes('ط¥ظ†ط´ط§ط،')) return 'green';
    if (action.includes('ط­ط°ظپ')) return 'red';
    if (action.includes('طھط¹ط¯ظٹظ„') || action.includes('طھط­ط¯ظٹط«') || action.includes('طھط؛ظٹظٹط±')) return 'blue';
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
    { value: 'SAR', label: 'ط±ظٹط§ظ„ ط³ط¹ظˆط¯ظٹ', symbol: 'ط±ظٹط§ظ„' },
    { value: 'AED', label: 'ط¯ط±ظ‡ظ… ط¥ظ…ط§ط±ط§طھظٹ', symbol: 'ط¯ط±ظ‡ظ…' },
    { value: 'KWD', label: 'ط¯ظٹظ†ط§ط± ظƒظˆظٹطھظٹ', symbol: 'ط¯.ظƒ' },
    { value: 'QAR', label: 'ط±ظٹط§ظ„ ظ‚ط·ط±ظٹ', symbol: 'ط±.ظ‚' },
    { value: 'BHD', label: 'ط¯ظٹظ†ط§ط± ط¨ط­ط±ظٹظ†ظٹ', symbol: 'ط¯.ط¨' },
    { value: 'OMR', label: 'ط±ظٹط§ظ„ ط¹ظ…ط§ظ†ظٹ', symbol: 'ط±.ط¹' },
    { value: 'EGP', label: 'ط¬ظ†ظٹظ‡ ظ…طµط±ظٹ', symbol: 'ط¬.ظ…' },
    { value: 'JOD', label: 'ط¯ظٹظ†ط§ط± ط£ط±ط¯ظ†ظٹ', symbol: 'ط¯.ط£' },
    { value: 'USD', label: 'ط¯ظˆظ„ط§ط± ط£ظ…ط±ظٹظƒظٹ', symbol: '$' },
    { value: 'EUR', label: 'ظٹظˆط±ظˆ', symbol: 'â‚¬' },
  ];

  const menuItems = [
    { key: 'general', icon: <SettingsIcon size={18} />, label: 'ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط¹ط§ظ…ط©' },
    { key: 'backup', icon: <Database size={18} />, label: 'ط§ظ„ظ†ط³ط® ط§ظ„ط§ط­طھظٹط§ط·ظٹ' },
    { key: 'activity', icon: <Activity size={18} />, label: 'ط³ط¬ظ„ ط§ظ„ظ†ط´ط§ط·ط§طھ' },
    ...(admin?.role === 'superadmin' ? [{ key: 'admins', icon: <Shield size={18} />, label: 'ط¥ط¯ط§ط±ط© ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†' }] : []),
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={15}>
                <Card title={<span><Building size={18} style={{ marginLeft: 8 }} /> ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ظ…ط¤ط³ط³ط©</span>} className="modern-card">
                  <Form form={settingsForm} layout="vertical" onFinish={handleSaveSettings}>
                    <Form.Item name="organizationName" label="ط§ط³ظ… ط§ظ„ظ…ط¤ط³ط³ط©">
                      <Input prefix={<Building size={16} />} placeholder="ط§ط³ظ… ط§ظ„ظ…ط¤ط³ط³ط©" />
                    </Form.Item>
                    <Divider>ط§ظ„ط¹ظ…ظ„ط© ظˆط§ظ„طھظ†ط³ظٹظ‚</Divider>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item name="currency" label="ط§ظ„ط¹ظ…ظ„ط©">
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
                        <Form.Item name="currencySymbol" label="ط±ظ…ط² ط§ظ„ط¹ظ…ظ„ط©">
                          <Input placeholder="ط±ظٹط§ظ„" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item name="currencyPosition" label="ظ…ظˆط¶ط¹ ط§ظ„ط¹ظ…ظ„ط©">
                      <Select
                        options={[
                          { value: 'before', label: 'ظ‚ط¨ظ„ ط§ظ„ظ…ط¨ظ„ط؛ ($ 100)' },
                          { value: 'after', label: 'ط¨ط¹ط¯ ط§ظ„ظ…ط¨ظ„ط؛ (100 ط±ظٹط§ظ„)' }
                        ]}
                      />
                    </Form.Item>
                    <Divider>ط§ظ„طھظ†ط¨ظٹظ‡ط§طھ</Divider>
                    <Form.Item name="renewalReminderDays" label="ط§ظ„طھط°ظƒظٹط± ظ‚ط¨ظ„ ط§ظ„طھط¬ط¯ظٹط¯ (ط£ظٹط§ظ…)">
                      <InputNumber min={1} max={90} style={{ width: '100%' }} />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" icon={<Save size={16} />} loading={savingSettings} block size="large">
                      ط­ظپط¸ ط§ظ„طھط؛ظٹظٹط±ط§طھ
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
              title={<span><Database size={18} style={{ marginLeft: 8 }} /> ط§ظ„ظ†ط³ط® ط§ظ„ط§ط­طھظٹط§ط·ظٹ</span>}
              extra={
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button icon={<Download size={16} />} onClick={handleExport}>طھطµط¯ظٹط± JSON</Button>
                  <Button type="primary" icon={<Plus size={16} />} onClick={handleCreateBackup} loading={creating}>ظ†ط³ط®ط© ط¬ط¯ظٹط¯ط©</Button>
                </div>
              }
            >
              <Table 
                dataSource={backups} 
                rowKey="_id" 
                pagination={{ pageSize: 8 }}
                columns={[
                  { title: 'ط§ظ„ظ…ظ„ظپ', dataIndex: 'filename' },
                  { title: 'ط§ظ„ط­ط¬ظ…', dataIndex: 'fileSize', render: formatFileSize },
                  { title: 'ط§ظ„طھط§ط±ظٹط®', dataIndex: 'createdAt', render: formatDate },
                  { title: 'ط¥ط¬ط±ط§ط،ط§طھ', render: (_, r) => (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button size="small" icon={<Download size={14} />} onClick={() => window.open(backupAPI.download(r._id), '_blank')} />
                      <Popconfirm title="ط§ط³طھط¹ط§ط¯ط©طں" onConfirm={() => handleRestore(r._id)}><Button size="small" icon={<RefreshCw size={14} />} /></Popconfirm>
                      <Popconfirm title="ط­ط°ظپطں" onConfirm={() => handleDeleteBackup(r._id)}><Button size="small" danger icon={<Trash2 size={14} />} /></Popconfirm>
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
            <Card title={<span><Activity size={18} style={{ marginLeft: 8 }} /> ط³ط¬ظ„ ط§ظ„ظ†ط´ط§ط·ط§طھ</span>}>
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
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{log.adminName} â€¢ {formatDate(log.createdAt)}</div>
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
          ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ†ط¸ط§ظ…
        </h2>
        <p style={{ color: '#94a3b8' }}>ط¥ط¯ط§ط±ط© طھظپط¶ظٹظ„ط§طھ ط§ظ„ظ†ط¸ط§ظ…طŒ ط§ظ„ظ†ط³ط® ط§ظ„ط§ط­طھظٹط§ط·ظٹطŒ ظˆط­ظ…ط§ظٹط© ط§ظ„ط­ط³ط§ط¨</p>
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
