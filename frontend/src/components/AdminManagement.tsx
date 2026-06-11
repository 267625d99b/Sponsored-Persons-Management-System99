import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, App, Popconfirm, Tag, Alert, Tabs, Divider, Spin } from 'antd';
import { UserPlus, Trash2, Edit, Users, Lock, Mail, TestTube } from 'lucide-react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface TenantUser {
  id: number;
  email: string;
  name: string;
  role: string;
  tenant_id: number;
  created_at: string;
}

const AdminManagement = () => {
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [createVisible, setCreateVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null);
  const [creating, setCreating] = useState(false);
  const [emailConfigLoading, setEmailConfigLoading] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [emailForm] = Form.useForm();
  const { message } = App.useApp();
  const { admin: currentAdmin } = useAuth();

  const isSuperAdmin = currentAdmin?.role === 'superadmin';

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await authAPI.getAllAdmins();
      setUsers(data.admins);
    } catch {
      message.error('فشل تحميل قائمة المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const loadEmailConfig = async (userId: string) => {
    setEmailConfigLoading(true);
    try {
      const { data } = await authAPI.getAdminEmailConfig(userId);
      emailForm.setFieldsValue({ emailUser: data.emailUser, emailService: data.emailService || 'gmail' });
      setEmailConfigured(data.emailConfigured);
    } catch {
      // لا توجد إعدادات بعد
    } finally {
      setEmailConfigLoading(false);
    }
  };

  const handleEmailConfigSave = async (values: { emailUser: string; emailPass?: string; emailService?: string }) => {
    if (!selectedUser) return;
    try {
      await authAPI.updateAdminEmailConfig(selectedUser.id.toString(), values);
      message.success('تم حفظ إعدادات البريد بنجاح');
      setEmailConfigured(!!(values.emailUser && values.emailPass));
      emailForm.setFieldValue('emailPass', '');
    } catch (err: any) {
      message.error(err.response?.data?.message || 'فشل الحفظ');
    }
  };

  const handleTestEmail = async () => {
    if (!selectedUser) return;
    setTestingEmail(true);
    try {
      const { data } = await authAPI.testAdminEmail(selectedUser.id.toString());
      message.success(data.message);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'فشل الاختبار');
    } finally {
      setTestingEmail(false);
    }
  };

  const handleCreate = async (values: { email: string; password: string; name: string }) => {
    setCreating(true);
    try {
      await authAPI.createAdmin(values);
      message.success('تم إنشاء المستخدم بنجاح — يمكنه الآن تسجيل الدخول');
      setCreateVisible(false);
      form.resetFields();
      fetchUsers();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'فشل إنشاء المستخدم');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (values: { name: string; email: string; newPassword?: string; confirmPassword?: string }) => {
    if (!selectedUser) return;
    try {
      // لا نرسل confirmPassword للبيكند
      const { confirmPassword, ...payload } = values;
      // إذا كانت كلمة المرور فارغة لا نرسلها
      if (!payload.newPassword) delete payload.newPassword;
      await authAPI.updateAdmin(selectedUser.id.toString(), payload);
      message.success('تم تحديث البيانات بنجاح');
      setEditVisible(false);
      editForm.resetFields();
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'فشل التحديث');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await authAPI.deleteAdmin(id.toString());
      message.success('تم حذف المستخدم');
      fetchUsers();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'فشل الحذف');
    }
  };

  // المستخدم العادي لا يرى هذا القسم
  if (!isSuperAdmin) {
    return (
      <Alert
        type="warning"
        message="صلاحية محدودة"
        description="إدارة المستخدمين متاحة للمدير العام فقط"
        showIcon
        icon={<Lock size={18} />}
      />
    );
  }

  const columns = [
    {
      title: 'المستخدم',
      key: 'user',
      render: (_: any, r: TenantUser) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.name}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{r.email}</div>
        </div>
      )
    },
    {
      title: 'رقم الحساب',
      dataIndex: 'tenant_id',
      key: 'tenant_id',
      render: (id: number) => <Tag color="blue">#{id}</Tag>
    },
    {
      title: 'تاريخ الإنشاء',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (d: string) => new Date(d).toLocaleDateString('ar-SA')
    },
    {
      title: 'الحالة',
      key: 'status',
      render: () => <Tag color="green">نشط</Tag>
    },
    {
      title: 'إجراءات',
      key: 'actions',
      render: (_: any, r: TenantUser) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            size="small"
            icon={<Edit size={14} />}
            onClick={() => {
              setSelectedUser(r);
              editForm.setFieldsValue({ name: r.name, email: r.email });
              emailForm.resetFields();
              setEmailConfigured(false);
              setEditVisible(true);
              loadEmailConfig(r.id.toString());
            }}
          >
            تعديل
          </Button>
          <Popconfirm
            title="حذف المستخدم وجميع بياناته؟"
            description="لا يمكن التراجع عن هذا الإجراء"
            onConfirm={() => handleDelete(r.id)}
            okText="حذف"
            cancelText="إلغاء"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<Trash2 size={14} />}>حذف</Button>
          </Popconfirm>
        </div>
      )
    }
  ];

  return (
    <>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={20} />
            <span>إدارة المستخدمين</span>
            <Tag color="gold" style={{ marginRight: 8 }}>المدير العام</Tag>
          </div>
        }
        extra={
          <Button type="primary" icon={<UserPlus size={16} />} onClick={() => setCreateVisible(true)}>
            مستخدم جديد
          </Button>
        }
      >
        <Alert
          type="info"
          message="كل مستخدم يملك نظامه المنفصل — مكفولين ومدفوعات وتقارير خاصة به"
          style={{ marginBottom: 16 }}
          showIcon
        />
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (t) => `إجمالي: ${t} مستخدم` }}
          locale={{ emptyText: 'لا يوجد مستخدمون بعد — أضف أول مستخدم' }}
        />
      </Card>

      {/* نافذة إنشاء مستخدم */}
      <Modal
        title="إنشاء مستخدم جديد"
        open={createVisible}
        onCancel={() => { setCreateVisible(false); form.resetFields(); }}
        footer={null}
        width={480}
      >
        <Alert
          type="info"
          message="سيُنشأ للمستخدم نظام مستقل تماماً بياناته خاصة به فقط"
          style={{ marginBottom: 20 }}
          showIcon
        />
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="name"
            label="الاسم الكامل"
            rules={[{ required: true, message: 'مطلوب' }]}
          >
            <Input placeholder="مثال: جمعية الخير" size="large" />
          </Form.Item>
          <Form.Item
            name="email"
            label="البريد الإلكتروني (للدخول)"
            rules={[{ required: true }, { type: 'email', message: 'بريد غير صالح' }]}
          >
            <Input placeholder="user@example.com" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            label="كلمة المرور"
            rules={[{ required: true }, { min: 6, message: '6 أحرف على الأقل' }]}
          >
            <Input.Password placeholder="كلمة مرور قوية" size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={creating}>
            إنشاء المستخدم
          </Button>
        </Form>
      </Modal>

      {/* نافذة تعديل */}
      <Modal
        title={`تعديل بيانات المستخدم — ${selectedUser?.name}`}
        open={editVisible}
        onCancel={() => { setEditVisible(false); editForm.resetFields(); emailForm.resetFields(); setSelectedUser(null); }}
        footer={null}
        width={520}
      >
        <Tabs
          defaultActiveKey="info"
          items={[
            {
              key: 'info',
              label: <span><Edit size={14} style={{ marginLeft: 6 }} />البيانات الأساسية</span>,
              children: (
                <Form form={editForm} layout="vertical" onFinish={handleUpdate} style={{ marginTop: 16 }}>
                  <Form.Item name="name" label="الاسم الكامل" rules={[{ required: true, message: 'مطلوب' }]}>
                    <Input size="large" />
                  </Form.Item>
                  <Form.Item name="email" label="البريد الإلكتروني" rules={[{ required: true }, { type: 'email', message: 'بريد غير صالح' }]}>
                    <Input size="large" />
                  </Form.Item>
                  <Divider style={{ margin: '12px 0' }} />
                  <Form.Item
                    name="newPassword"
                    label="كلمة المرور الجديدة"
                    extra="اتركه فارغاً إذا لم تريد تغيير كلمة المرور"
                    rules={[{ min: 6, message: '6 أحرف على الأقل' }]}
                  >
                    <Input.Password placeholder="أدخل كلمة مرور جديدة (اختياري)" size="large" />
                  </Form.Item>
                  <Form.Item
                    name="confirmPassword"
                    label="تأكيد كلمة المرور"
                    dependencies={['newPassword']}
                    rules={[
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          const newPass = getFieldValue('newPassword');
                          if (!newPass || !value || newPass === value) return Promise.resolve();
                          return Promise.reject(new Error('كلمتا المرور غير متطابقتين'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password placeholder="أعد إدخال كلمة المرور الجديدة" size="large" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block size="large">
                    حفظ التغييرات
                  </Button>
                </Form>
              )
            },
            {
              key: 'email',
              label: (
                <span>
                  <Mail size={14} style={{ marginLeft: 6 }} />
                  إعدادات Gmail
                  {emailConfigured && <Tag color="green" style={{ marginRight: 8, fontSize: 11 }}>مُفعّل</Tag>}
                </span>
              ),
              children: (
                <Spin spinning={emailConfigLoading}>
                  <div style={{ marginTop: 16 }}>
                    <Alert
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                      message="إعدادات بريد Gmail للمستخدم"
                      description={
                        <div>
                          <p style={{ margin: '4px 0' }}>عند تفعيل هذه الإعدادات، سيصل رمز التحقق (2FA) إلى بريد المستخدم عند كل تسجيل دخول.</p>
                          <p style={{ margin: '4px 0', fontSize: 12, color: '#666' }}>
                            📌 تحتاج إلى <strong>App Password</strong> من Google وليس كلمة المرور العادية.{' '}
                            <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer">إنشاء App Password</a>
                          </p>
                        </div>
                      }
                    />
                    <Form form={emailForm} layout="vertical" onFinish={handleEmailConfigSave}>
                      <Form.Item name="emailService" label="خدمة البريد" initialValue="gmail">
                        <Input disabled size="large" />
                      </Form.Item>
                      <Form.Item
                        name="emailUser"
                        label="بريد Gmail"
                        rules={[{ type: 'email', message: 'بريد غير صالح' }]}
                      >
                        <Input placeholder="example@gmail.com" size="large" />
                      </Form.Item>
                      <Form.Item
                        name="emailPass"
                        label="App Password"
                        extra={emailConfigured ? '✅ كلمة المرور محفوظة — اتركه فارغاً للإبقاء عليها' : 'أدخل App Password من إعدادات Google'}
                      >
                        <Input.Password placeholder="xxxx xxxx xxxx xxxx" size="large" />
                      </Form.Item>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button type="primary" htmlType="submit" style={{ flex: 1 }} size="large">
                          حفظ الإعدادات
                        </Button>
                        <Button
                          icon={<TestTube size={14} />}
                          onClick={handleTestEmail}
                          loading={testingEmail}
                          disabled={!emailConfigured}
                          size="large"
                          title="إرسال رسالة اختبار إلى بريد المستخدم"
                        >
                          اختبار
                        </Button>
                      </div>
                    </Form>
                  </div>
                </Spin>
              )
            }
          ]}
        />
      </Modal>
    </>
  );
};

export default AdminManagement;
