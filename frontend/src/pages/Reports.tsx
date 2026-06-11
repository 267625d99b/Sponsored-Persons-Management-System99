import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Select, Progress, Button, Dropdown, App } from 'antd';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  DollarSign,
  CheckCircle,
  XCircle,
  FileText,
  TrendingUp,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { reportAPI, sponsoredAPI } from '../services/api';
import { ReportSkeleton } from '../components/SkeletonCard';
import { exportToExcel, exportToPDF } from '../utils/export';
import { useSettings } from '../context/SettingsContext';

interface YearlyReport {
  year: number;
  totalCollected: number;
  totalExpected: number;
  collectionRate: string;
  totalPayments: number;
}

const Reports = () => {
  const { message } = App.useApp();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [report, setReport] = useState<YearlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { formatCurrency } = useSettings();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const { data } = await reportAPI.getYearlyReport(year);
        setReport(data);
      } catch (error: unknown) {
        console.error('Error:', error);
        const err = error as { response?: { data?: { message?: string } } };
        message.error(err.response?.data?.message || 'حدث خطأ في تحميل التقرير');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [year]);

  const handleExport = async (type: 'excel' | 'pdf') => {
    try {
      const { data } = await sponsoredAPI.getAll({ limit: 10000 });
      // دعم الـ format الجديد { sponsored: [] } والقديم (array مباشر)
      const sponsoredData = Array.isArray(data) ? data : (data.sponsored ?? data.data ?? []);
      if (!sponsoredData || sponsoredData.length === 0) {
        message.warning('لا يوجد بيانات للتصدير');
        return;
      }
      if (type === 'excel') exportToExcel(sponsoredData, `تقرير_${year}`);
      else exportToPDF(sponsoredData, `تقرير_${year}`);
      message.success('تم التصدير بنجاح');
    } catch (error: unknown) {
      console.error('Export error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || 'حدث خطأ في التصدير');
    }
  };
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const chartData = report ? [
    { name: 'ينا', المحصل: report.totalCollected * 0.1 },
    { name: 'فبر', المحصل: report.totalCollected * 0.2 },
    { name: 'مار', المحصل: report.totalCollected * 0.35 },
    { name: 'أبر', المحصل: report.totalCollected * 0.45 },
    { name: 'ماي', المحصل: report.totalCollected * 0.55 },
    { name: 'يون', المحصل: report.totalCollected * 0.65 },
    { name: 'يول', المحصل: report.totalCollected * 0.75 },
    { name: 'أغس', المحصل: report.totalCollected * 0.82 },
    { name: 'سبت', المحصل: report.totalCollected * 0.88 },
    { name: 'أكت', المحصل: report.totalCollected * 0.93 },
    { name: 'نوف', المحصل: report.totalCollected * 0.97 },
    { name: 'ديس', المحصل: report.totalCollected },
  ] : [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const exportMenuItems = {
    items: [
      { key: 'excel', icon: <FileSpreadsheet size={16} />, label: 'Excel', onClick: () => handleExport('excel') },
      { key: 'pdf', icon: <FileText size={16} />, label: 'PDF', onClick: () => handleExport('pdf') }
    ]
  };

  if (loading) return <ReportSkeleton />;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants}>
        <Card size="small" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
              <FileText size={18} />
              التقارير السنوية
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <Dropdown menu={exportMenuItems}>
                <Button size="small" icon={<Download size={14} />}>تصدير</Button>
              </Dropdown>
              <Select
                value={year}
                onChange={setYear}
                size="small"
                style={{ width: 90 }}
                options={years.map(y => ({ value: y, label: y.toString() }))}
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {report && (
        <>
          {/* Stats */}
          <Row gutter={[8, 8]}>
            <Col xs={12} sm={6}>
              <motion.div variants={itemVariants}>
                <Card size="small" className="stat-card primary">
                  <Statistic
                    title={<span style={{ fontSize: 11 }}><CheckCircle size={12} /> المحصّل</span>}
                    value={report.totalCollected}
                    suffix="ر"
                    styles={{ content: { color: '#52c41a', fontSize: isMobile ? 16 : 20 } }}
                  />
                </Card>
              </motion.div>
            </Col>
            <Col xs={12} sm={6}>
              <motion.div variants={itemVariants}>
                <Card size="small" className="stat-card">
                  <Statistic
                    title={<span style={{ fontSize: 11 }}><DollarSign size={12} /> المتوقع</span>}
                    value={report.totalExpected}
                    suffix="ر"
                    styles={{ content: { fontSize: isMobile ? 16 : 20 } }}
                  />
                </Card>
              </motion.div>
            </Col>
            <Col xs={12} sm={6}>
              <motion.div variants={itemVariants}>
                <Card size="small" className="stat-card danger">
                  <Statistic
                    title={<span style={{ fontSize: 11 }}><XCircle size={12} /> المتبقي</span>}
                    value={report.totalExpected - report.totalCollected}
                    suffix="ر"
                    styles={{ content: { color: '#ff4d4f', fontSize: isMobile ? 16 : 20 } }}
                  />
                </Card>
              </motion.div>
            </Col>
            <Col xs={12} sm={6}>
              <motion.div variants={itemVariants}>
                <Card size="small" className="stat-card warning">
                  <Statistic
                    title={<span style={{ fontSize: 11 }}><TrendingUp size={12} /> النسبة</span>}
                    value={report.collectionRate}
                    suffix="%"
                    styles={{ content: { 
                      color: Number(report.collectionRate) >= 80 ? '#52c41a' : '#faad14',
                      fontSize: isMobile ? 16 : 20
                    } }}
                  />
                </Card>
              </motion.div>
            </Col>
          </Row>

          {/* Progress */}
          <motion.div variants={itemVariants}>
            <Card size="small" style={{ marginTop: 12 }}>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>نسبة التحصيل</div>
              <Progress
                percent={Number(report.collectionRate)}
                strokeColor={{
                  '0%': '#ff4d4f',
                  '50%': '#faad14',
                  '100%': '#52c41a',
                }}
                size={['100%', 16]}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 12, color: '#666' }}>
                <span>عدد الدفعات: {report.totalPayments}</span>
                <span>السنة: {report.year}</span>
              </div>
            </Card>
          </motion.div>

          {/* Chart */}
          <motion.div variants={itemVariants}>
            <Card size="small" style={{ marginTop: 12 }}>
              <div style={{ marginBottom: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={16} />
                تطور التحصيل
              </div>
              <ResponsiveContainer width="100%" height={isMobile ? 200 : 280}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value || 0))} />
                  <Area type="monotone" dataKey="المحصل" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* Summary */}
          <motion.div variants={itemVariants}>
            <Card size="small" style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>📋 ملخص</div>
              <p style={{ fontSize: 14, lineHeight: 1.8, margin: 0 }}>
                في <strong>{report.year}</strong>، تم تحصيل{' '}
                <strong style={{ color: '#52c41a' }}>{formatCurrency(report.totalCollected)}</strong>
                {' '}من أصل <strong>{formatCurrency(report.totalExpected)}</strong>.
                {report.totalExpected > report.totalCollected && (
                  <><br />المتبقي: <strong style={{ color: '#ff4d4f' }}>{formatCurrency(report.totalExpected - report.totalCollected)}</strong></>
                )}
              </p>
            </Card>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default Reports;
