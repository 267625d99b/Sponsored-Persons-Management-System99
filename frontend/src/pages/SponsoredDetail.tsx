import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Descriptions, Table, Button, Tag, Statistic, App, List, Tabs } from 'antd';
import { motion } from 'framer-motion';
import { ArrowRight, Plus, Trash2, Calendar, User, Phone, CreditCard, FileText, DollarSign, Files } from 'lucide-react';
import { sponsoredAPI, paymentAPI } from '../services/api';
import { Sponsored, Payment } from '../types';
import PaymentForm from '../components/PaymentForm';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import DocumentManager from '../components/DocumentManager';
import { DetailSkeleton } from '../components/SkeletonCard';
import { useSettings } from '../context/SettingsContext';

const SponsoredDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { formatCurrency, formatDate } = useSettings();
  const [sponsored, setSponsored] = useState<Sponsored | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [deletePayment, setDeletePayment] = useState<Payment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await sponsoredAPI.getOne(id!);
      setSponsored(data);
    } catch (error: unknown) {
      console.error('Error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || 'حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleDeletePayment = async () => {
    if (!deletePayment) return;
    setDeleteLoading(true);
    try {
      await paymentAPI.delete(deletePayment._id);
      message.success('تم حذف الدفعة بنجاح');
      setDeletePayment(null);
      fetchData();
    } catch (error: unknown) {
      console.error('Error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || 'حدث خطأ في حذف الدفعة');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <DetailSkeleton />;
  if (!sponsored) return <div>المكفول غير موجود</div>;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const paymentColumns = [
    { title: 'التاريخ', dataIndex: 'paymentDate', key: 'date', render: formatDate },
    { title: 'المبلغ', dataIndex: 'amount', key: 'amount', render: (v: number) => formatCurrency(v) },
    { title: 'السنة', dataIndex: 'year', key: 'year' },
    { title: 'ملاحظات', dataIndex: 'notes', key: 'notes', render: (v: string) => v || '-' },
    {
      title: '',
      key: 'action',
      render: (_: unknown, record: Payment) => (
        <Button type="text" danger size="small" icon={<Trash2 size={14} />} onClick={() => setDeletePayment(record)} />
      )
    }
  ];

  // Tab items
  const tabItems = [
    {
      key: 'info',
      label: <span><User size={16} /> البيانات</span>,
      children: (
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          {/* Info Card */}
          <motion.div variants={itemVariants}>
            <Card size="small" style={{ marginBottom: 16 }}>
              {isMobile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CreditCard size={16} color="#666" />
                    <span style={{ color: '#666', fontSize: 12 }}>رقم الهوية:</span>
                    <span style={{ fontWeight: 500 }}>{sponsored.idNumber}</span>
                  </div>
                  {sponsored.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Phone size={16} color="#666" />
                      <span style={{ color: '#666', fontSize: 12 }}>الهاتف:</span>
                      <a href={`tel:${sponsored.phone}`} style={{ fontWeight: 500 }}>{sponsored.phone}</a>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Calendar size={16} color="#666" />
                    <span style={{ color: '#666', fontSize: 12 }}>بداية الكفالة:</span>
                    <span style={{ fontWeight: 500 }}>{formatDate(sponsored.sponsorshipStartDate)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Calendar size={16} color="#faad14" />
                    <span style={{ color: '#666', fontSize: 12 }}>التجديد القادم:</span>
                    <span style={{ fontWeight: 500, color: '#faad14' }}>
                      {sponsored.nextRenewalDate ? formatDate(sponsored.nextRenewalDate) : '-'}
                    </span>
                  </div>
                  {sponsored.notes && (
                    <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 8, marginTop: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                        <FileText size={14} color="#666" />
                        <span style={{ fontSize: 12, color: '#666' }}>ملاحظات</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 14 }}>{sponsored.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <Descriptions bordered column={3} size="small">
                  <Descriptions.Item label="رقم الهوية">{sponsored.idNumber}</Descriptions.Item>
                  <Descriptions.Item label="الهاتف">{sponsored.phone || '-'}</Descriptions.Item>
                  <Descriptions.Item label="بداية الكفالة">{formatDate(sponsored.sponsorshipStartDate)}</Descriptions.Item>
                  <Descriptions.Item label="الكفالة السنوية">{formatCurrency(sponsored.annualAmount)}</Descriptions.Item>
                  <Descriptions.Item label="التجديد القادم">{sponsored.nextRenewalDate ? formatDate(sponsored.nextRenewalDate) : '-'}</Descriptions.Item>
                  <Descriptions.Item label="الحالة">
                    <Tag color={sponsored.status === 'active' ? 'green' : 'default'}>
                      {sponsored.status === 'active' ? 'نشط' : 'منتهي'}
                    </Tag>
                  </Descriptions.Item>
                  {sponsored.notes && <Descriptions.Item label="ملاحظات" span={3}>{sponsored.notes}</Descriptions.Item>}
                </Descriptions>
              )}
            </Card>
          </motion.div>

          {/* Payment Status */}
          <motion.div variants={itemVariants}>
            <Card size="small" title="💰 حالة الدفع لهذا العام">
              <Row gutter={[8, 8]}>
                <Col xs={8}>
                  <Card size="small" className="stat-card">
                    <Statistic 
                      title={<span style={{ fontSize: 11 }}>المطلوب</span>}
                      value={sponsored.annualAmount} 
                      suffix="ر"
                      styles={{ content: { fontSize: isMobile ? 16 : 24 } }}
                    />
                  </Card>
                </Col>
                <Col xs={8}>
                  <Card size="small" className="stat-card success">
                    <Statistic 
                      title={<span style={{ fontSize: 11 }}>المدفوع</span>}
                      value={sponsored.totalPaidThisYear || 0} 
                      suffix="ر"
                      styles={{ content: { color: '#52c41a', fontSize: isMobile ? 16 : 24 } }}
                    />
                  </Card>
                </Col>
                <Col xs={8}>
                  <Card size="small" className={`stat-card ${sponsored.isPaidThisYear ? 'success' : 'danger'}`}>
                    <Statistic 
                      title={<span style={{ fontSize: 11 }}>المتبقي</span>}
                      value={sponsored.remaining || 0} 
                      suffix="ر"
                      styles={{ content: { color: sponsored.isPaidThisYear ? '#52c41a' : '#ff4d4f', fontSize: isMobile ? 16 : 24 } }}
                    />
                  </Card>
                </Col>
              </Row>
            </Card>
          </motion.div>
        </motion.div>
      )
    },
    {
      key: 'payments',
      label: <span><DollarSign size={16} /> الدفعات ({sponsored.payments?.length || 0})</span>,
      children: (
        <Card 
          size="small"
          extra={
            <Button type="primary" size="small" icon={<Plus size={14} />} onClick={() => setShowPaymentForm(true)}>
              {!isMobile && 'تسجيل دفعة'}
            </Button>
          }
        >
          {(!sponsored.payments || sponsored.payments.length === 0) ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#999' }}>
              لا توجد دفعات مسجلة
            </div>
          ) : isMobile ? (
            <List
              dataSource={sponsored.payments}
              renderItem={(p: Payment) => (
                <List.Item
                  actions={[
                    <Button type="text" danger size="small" icon={<Trash2 size={14} />} onClick={() => setDeletePayment(p)} />
                  ]}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: '#52c41a' }}>{formatCurrency(p.amount)}</span>
                      <Tag>{p.year}</Tag>
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {formatDate(p.paymentDate)}
                      {p.notes && <span> • {p.notes}</span>}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <Table
              dataSource={sponsored.payments}
              columns={paymentColumns}
              rowKey="_id"
              pagination={{ pageSize: 5 }}
              size="middle"
            />
          )}
        </Card>
      )
    },
    {
      key: 'documents',
      label: <span><Files size={16} /> المستندات</span>,
      children: <DocumentManager sponsoredId={sponsored._id} sponsoredName={sponsored.fullName} />
    }
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Button 
            icon={<ArrowRight size={16} />} 
            onClick={() => navigate('/sponsored')}
          >
            العودة
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 24 }}>{sponsored.fullName}</h2>
            <Tag color={sponsored.status === 'active' ? 'green' : 'default'} style={{ fontSize: 14 }}>
              {sponsored.status === 'active' ? 'نشط' : 'منتهي'}
            </Tag>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={tabItems}
        size={isMobile ? 'small' : 'large'}
      />

      {/* FAB */}
      <motion.button
        className="fab"
        onClick={() => setShowPaymentForm(true)}
        whileTap={{ scale: 0.9 }}
      >
        <Plus size={isMobile ? 24 : 28} />
      </motion.button>

      <PaymentForm
        open={showPaymentForm}
        sponsoredId={sponsored._id}
        onClose={() => setShowPaymentForm(false)}
        onSave={() => { setShowPaymentForm(false); fetchData(); }}
      />

      <DeleteConfirmModal
        open={!!deletePayment}
        title="حذف دفعة"
        description={`هل أنت متأكد من حذف دفعة ${deletePayment ? formatCurrency(deletePayment.amount) : ''}؟`}
        onConfirm={handleDeletePayment}
        onCancel={() => setDeletePayment(null)}
        loading={deleteLoading}
      />
    </motion.div>
  );
};

export default SponsoredDetail;
