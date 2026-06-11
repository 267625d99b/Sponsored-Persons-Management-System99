import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Input,
  Select,
  App,
  Dropdown,
  Slider,
  InputNumber,
  Row,
  Col,
  Drawer,
  Pagination,
} from 'antd';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Users,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  X,
  Phone,
  CreditCard,
  Upload,
} from 'lucide-react';
import { sponsoredAPI } from '../services/api';
import { Sponsored } from '../types';
import SponsoredForm from '../components/SponsoredForm';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import ImportData from '../components/ImportData';
import { TableSkeleton } from '../components/SkeletonCard';
import { exportToExcel, exportToPDF } from '../utils/export';
import { useSettings } from '../context/SettingsContext';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

const SponsoredList = () => {
  const { formatCurrency } = useSettings();
  const { message } = App.useApp();
  const [sponsored, setSponsored] = useState<Sponsored[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editItem, setEditItem] = useState<Sponsored | null>(null);
  const [deleteItem, setDeleteItem] = useState<Sponsored | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });

  const pageLimitRef = useRef(20);
  const pageRef = useRef(1);

  const [filters, setFilters] = useState({
    search: '',
    status: 'all' as 'all' | 'active' | 'inactive',
    paymentStatus: 'all' as 'all' | 'paid' | 'unpaid',
    minAmount: 0,
    maxAmount: 100000,
  });

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = useCallback(async (page = 1, limitOverride?: number) => {
    setLoading(true);
    const currentLimit = limitOverride ?? pageLimitRef.current;
    try {
      const { data } = await sponsoredAPI.getAll({
        page,
        limit: currentLimit,
        search: debouncedSearch || undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        paymentStatus: filters.paymentStatus !== 'all' ? filters.paymentStatus : undefined,
      });

      // Handle both old format (array) and new format (with pagination)
      if (Array.isArray(data)) {
        setSponsored(data);
        setPagination((prev) => ({ ...prev, total: data.length, totalPages: 1 }));
      } else {
        // الـ backend يرجع { sponsored: [], pagination: {} }
        const list = data.sponsored ?? data.data ?? [];
        setSponsored(list);
        const pag = data.pagination ?? { page: 1, limit: pageLimitRef.current, total: list.length ?? 0, totalPages: 1, hasMore: false };
        pageRef.current = pag.page;
        setPagination(pag);
      }
    } catch (error: unknown) {
      console.error('Error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || 'حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters.status, filters.paymentStatus]);

  useEffect(() => {
    fetchData(1);
  }, [debouncedSearch, filters.status, filters.paymentStatus]);

  const handlePageChange = (page: number, pageSize?: number) => {
    if (pageSize && pageSize !== pageLimitRef.current) {
      pageLimitRef.current = pageSize;
      setPagination((prev) => ({ ...prev, limit: pageSize }));
      fetchData(page, pageSize);
    } else {
      fetchData(page);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleteLoading(true);
    try {
      await sponsoredAPI.delete(deleteItem._id);
      message.success(`تم حذف "${deleteItem.fullName}" بنجاح`);
      setDeleteItem(null);
      fetchData(pageRef.current);
    } catch (error: unknown) {
      console.error('Error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || 'حدث خطأ في حذف المكفول');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSave = () => {
    setShowForm(false);
    setEditItem(null);
    fetchData(pageRef.current);
  };

  // Local filtering for amount range only
  const filteredList = useMemo(() => {
    return sponsored.filter((s) => {
      if (s.annualAmount < filters.minAmount || s.annualAmount > filters.maxAmount)
        return false;
      return true;
    });
  }, [sponsored, filters.minAmount, filters.maxAmount]);

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      paymentStatus: 'all',
      minAmount: 0,
      maxAmount: 100000,
    });
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.paymentStatus !== 'all') count++;
    if (filters.minAmount > 0 || filters.maxAmount < 100000) count++;
    return count;
  }, [filters.status, filters.paymentStatus, filters.minAmount, filters.maxAmount]);

  const handleExportExcel = async () => {
    try {
      const { data } = await sponsoredAPI.getAll({ limit: 10000 });
      const allData = Array.isArray(data) ? data : (data.sponsored ?? data.data ?? []);
      exportToExcel(allData);
      message.success('تم التصدير');
    } catch {
      message.error('حدث خطأ في التصدير');
    }
  };

  const handleExportPDF = async () => {
    try {
      const { data } = await sponsoredAPI.getAll({ limit: 10000 });
      const allData = Array.isArray(data) ? data : (data.sponsored ?? data.data ?? []);
      exportToPDF(allData);
      message.success('تم التصدير');
    } catch {
      message.error('حدث خطأ في التصدير');
    }
  };

  const exportMenuItems = {
    items: [
      { key: 'excel', icon: <FileSpreadsheet size={18} />, label: 'تصدير Excel', onClick: handleExportExcel },
      { key: 'pdf', icon: <FileText size={18} />, label: 'تصدير PDF', onClick: handleExportPDF },
      { type: 'divider' as const },
      { key: 'import', icon: <Upload size={18} />, label: 'استيراد من Excel', onClick: () => setShowImport(true) }
    ]
  };

  const columns = [
    {
      title: 'الاسم',
      dataIndex: 'fullName',
      key: 'fullName',
      sorter: (a: Sponsored, b: Sponsored) => a.fullName.localeCompare(b.fullName),
      render: (text: string, record: Sponsored) => (
        <Link to={`/sponsored/${record._id}`} style={{ fontWeight: 600, fontSize: 15 }}>{text}</Link>
      )
    },
    { title: 'رقم الهوية', dataIndex: 'idNumber', key: 'idNumber' },
    { title: 'الهاتف', dataIndex: 'phone', key: 'phone', render: (v: string) => v || '-' },
    {
      title: 'الكفالة السنوية',
      dataIndex: 'annualAmount',
      key: 'annualAmount',
      sorter: (a: Sponsored, b: Sponsored) => a.annualAmount - b.annualAmount,
      render: (v: number) => <span style={{ fontWeight: 600 }}>{formatCurrency(v)}</span>
    },
    {
      title: 'حالة الدفع',
      key: 'payment',
      render: (_: unknown, record: Sponsored) => (
        record.isPaidThisYear 
          ? <Tag color="success" style={{ fontSize: 13 }}>مكتمل ✓</Tag>
          : <Tag color="error" style={{ fontSize: 13 }}>متبقي {formatCurrency(record.remaining || 0)}</Tag>
      )
    },
    {
      title: 'الحالة',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'default'} style={{ fontSize: 13 }}>
          {status === 'active' ? 'نشط' : 'منتهي'}
        </Tag>
      )
    },
    {
      title: 'إجراءات',
      key: 'actions',
      width: 150,
      render: (_: unknown, record: Sponsored) => (
        <Space size="middle">
          <Link to={`/sponsored/${record._id}`}>
            <Button type="primary" ghost icon={<Eye size={16} />}>عرض</Button>
          </Link>
          <Button icon={<Edit size={16} />} onClick={() => { setEditItem(record); setShowForm(true); }} />
          <Button danger icon={<Trash2 size={16} />} onClick={() => setDeleteItem(record)} />
        </Space>
      )
    }
  ];

  if (loading) return <TableSkeleton />;

  // Mobile Card View
  const MobileListItem = ({ item }: { item: Sponsored }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ marginBottom: 12 }}
    >
      <Card 
        size="small"
        onClick={() => window.location.href = `/sponsored/${item._id}`}
        style={{ cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{item.fullName}</div>
            <div style={{ display: 'flex', gap: 16, color: '#666', fontSize: 12, marginBottom: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <CreditCard size={12} /> {item.idNumber}
              </span>
              {item.phone && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Phone size={12} /> {item.phone}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Tag color={item.status === 'active' ? 'green' : 'default'}>
                {item.status === 'active' ? 'نشط' : 'منتهي'}
              </Tag>
              {item.isPaidThisYear 
                ? <Tag color="success">مدفوع ✓</Tag>
                : <Tag color="error">متبقي {formatCurrency(item.remaining || 0)}</Tag>
              }
            </div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1e3a5f' }}>
              {formatCurrency(item.annualAmount)}
            </div>
            <div style={{ fontSize: 11, color: '#999' }}>سنوياً</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
          <Button size="small" icon={<Edit size={14} />} onClick={(e) => { e.stopPropagation(); setEditItem(item); setShowForm(true); }}>
            تعديل
          </Button>
          <Button size="small" danger icon={<Trash2 size={14} />} onClick={(e) => { e.stopPropagation(); setDeleteItem(item); }}>
            حذف
          </Button>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Card
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={isMobile ? 18 : 24} />
            قائمة المكفولين ({filteredList.length})
          </span>
        }
        extra={
          <Space size="middle">
            <Dropdown menu={exportMenuItems}>
              <Button size="middle" icon={<Download size={isMobile ? 14 : 18} />}>
                {!isMobile && 'تصدير'}
              </Button>
            </Dropdown>
            <Button 
              type="primary" 
              size="middle"
              icon={<Plus size={isMobile ? 14 : 18} />} 
              onClick={() => setShowForm(true)}
            >
              {!isMobile && 'إضافة مكفول'}
            </Button>
          </Space>
        }
      >
        {/* Filters */}
        <Space style={{ marginBottom: 20, width: '100%' }} orientation={isMobile ? 'vertical' : 'horizontal'} size="middle" wrap>
          <Input
            placeholder="بحث بالاسم أو رقم الهوية أو الهاتف..."
            prefix={<Search size={18} />}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ width: isMobile ? '100%' : 300 }}
            size="middle"
            allowClear
          />
          <Select
            value={filters.status}
            onChange={(v) => setFilters({ ...filters, status: v })}
            style={{ width: isMobile ? '100%' : 150 }}
            size="middle"
            options={[
              { value: 'all', label: 'كل الحالات' },
              { value: 'active', label: 'نشط' },
              { value: 'inactive', label: 'منتهي' }
            ]}
          />
          <Select
            value={filters.paymentStatus}
            onChange={(v) => setFilters({ ...filters, paymentStatus: v })}
            style={{ width: isMobile ? '100%' : 150 }}
            size="middle"
            options={[
              { value: 'all', label: 'كل المدفوعات' },
              { value: 'paid', label: 'مدفوع' },
              { value: 'unpaid', label: 'غير مدفوع' }
            ]}
          />
          <Button 
            size="middle"
            icon={<Filter size={16} />} 
            onClick={() => setShowFilters(true)}
            type={activeFiltersCount > 0 ? 'primary' : 'default'}
          >
            فلاتر متقدمة {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>
          {activeFiltersCount > 0 && (
            <Button type="link" onClick={resetFilters} icon={<X size={14} />}>
              إعادة تعيين
            </Button>
          )}
        </Space>

        {/* Table or Cards */}
        {isMobile ? (
          <div>
            {filteredList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                لا يوجد مكفولين
              </div>
            ) : (
              <>
                {filteredList.map((item) => (
                  <MobileListItem key={item._id} item={item} />
                ))}
                {pagination?.total > (pagination?.limit ?? 20) && (
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <Pagination
                      current={pagination?.page ?? 1}
                      total={pagination?.total ?? 0}
                      pageSize={pagination?.limit ?? 20}
                      onChange={handlePageChange}
                      showSizeChanger={false}
                      size="small"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <Table
            dataSource={filteredList}
            columns={columns}
            rowKey="_id"
            loading={loading}
            pagination={{
              current: pagination?.page ?? 1,
              pageSize: pagination?.limit ?? 20,
              total: pagination?.total ?? 0,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total) => `إجمالي ${total} مكفول`,
              onChange: handlePageChange,
            }}
            locale={{ emptyText: 'لا يوجد مكفولين' }}
            size="large"
          />
        )}
      </Card>

      {/* FAB */}
      <motion.button
        className="fab"
        onClick={() => setShowForm(true)}
        whileTap={{ scale: 0.9 }}
      >
        <Plus size={isMobile ? 24 : 28} />
      </motion.button>

      {/* Filters Drawer */}
      <Drawer
        title="فلاتر متقدمة"
        placement={isMobile ? 'bottom' : 'left'}
        onClose={() => setShowFilters(false)}
        open={showFilters}
        size={isMobile ? 'default' : 'default'}
        styles={{ body: { paddingBottom: isMobile ? 80 : 24 } }}
      >
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 12, fontWeight: 600, fontSize: 15 }}>نطاق الكفالة السنوية</label>
          <Row gutter={16}>
            <Col span={12}>
              <InputNumber
                style={{ width: '100%' }}
                placeholder="من"
                value={filters.minAmount}
                onChange={(v) => setFilters({ ...filters, minAmount: v || 0 })}
                size="large"
              />
            </Col>
            <Col span={12}>
              <InputNumber
                style={{ width: '100%' }}
                placeholder="إلى"
                value={filters.maxAmount}
                onChange={(v) => setFilters({ ...filters, maxAmount: v || 100000 })}
                size="large"
              />
            </Col>
          </Row>
          <Slider
            range
            min={0}
            max={100000}
            step={1000}
            value={[filters.minAmount, filters.maxAmount]}
            onChange={([min, max]) => setFilters({ ...filters, minAmount: min, maxAmount: max })}
            style={{ marginTop: 16 }}
          />
        </div>
        <Button type="primary" block size="large" onClick={() => setShowFilters(false)}>تطبيق</Button>
        <Button block size="large" style={{ marginTop: 12 }} onClick={resetFilters}>إعادة تعيين</Button>
      </Drawer>

      <SponsoredForm
        open={showForm}
        sponsored={editItem}
        onClose={() => { setShowForm(false); setEditItem(null); }}
        onSave={handleSave}
      />

      <DeleteConfirmModal
        open={!!deleteItem}
        title="حذف مكفول"
        description="هل أنت متأكد من حذف هذا المكفول؟ سيتم حذف جميع الدفعات والمستندات المرتبطة به."
        itemName={deleteItem?.fullName}
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
        loading={deleteLoading}
      />

      <ImportData
        open={showImport}
        onClose={() => setShowImport(false)}
        onSuccess={() => fetchData(1)}
      />
    </motion.div>
  );
};

export default SponsoredList;
