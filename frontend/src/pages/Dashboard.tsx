import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Table, Tag, Empty, List } from 'antd';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import {
  Users,
  DollarSign,
  AlertTriangle,
  Calendar,
  CheckCircle,
  TrendingUp,
  ChevronLeft,
} from 'lucide-react';
import { reportAPI } from '../services/api';
import { DashboardData } from '../types';
import { DashboardSkeleton } from '../components/SkeletonCard';
import { useSettings } from '../context/SettingsContext';

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { formatCurrency, formatDate } = useSettings();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await reportAPI.getDashboard();
        setData(data);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (!data) return <Empty description="حدث خطأ في تحميل البيانات" />;

  const pieData = [
    { name: 'المحصّل', value: data.stats.totalCollectedThisYear, color: '#52c41a' },
    { name: 'المتبقي', value: Math.max(0, data.stats.totalExpected - data.stats.totalCollectedThisYear), color: '#ff4d4f' },
  ];

  const barData = [
    { name: 'المكفولين', نشط: data.stats.activeSponsored, إجمالي: data.stats.totalSponsored },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const stats = [
    { title: 'إجمالي المكفولين', value: data.stats.totalSponsored, icon: <Users size={isMobile ? 16 : 22} />, color: '#3b82f6', className: 'primary' },
    { title: 'المكفولين النشطين', value: data.stats.activeSponsored, icon: <CheckCircle size={isMobile ? 16 : 22} />, color: '#52c41a', className: 'success' },
    { title: 'المحصّل هذا العام', value: data.stats.totalCollectedThisYear, icon: <DollarSign size={isMobile ? 16 : 22} />, color: '#3b82f6', isCurrency: true, className: 'primary' },
    { title: 'المتوقع تحصيله', value: data.stats.totalExpected, icon: <TrendingUp size={isMobile ? 16 : 22} />, color: '#666', isCurrency: true, className: '' },
    { title: 'المتأخرين عن الدفع', value: data.stats.overdueCount, icon: <AlertTriangle size={isMobile ? 16 : 22} />, color: '#ff4d4f', className: 'danger' },
    { title: 'قريب التجديد', value: data.stats.upcomingRenewalCount, icon: <Calendar size={isMobile ? 16 : 22} />, color: '#faad14', className: 'warning' },
  ];

  const overdueColumns = [
    { title: 'الاسم', dataIndex: 'fullName', key: 'fullName' },
    { title: 'المتبقي', dataIndex: 'remaining', key: 'remaining', render: (v: number) => <Tag color="red">{formatCurrency(v)}</Tag> },
    { title: '', key: 'action', render: (_: unknown, r: { _id: string }) => <Link to={`/sponsored/${r._id}`}><ChevronLeft size={18} /></Link> }
  ];

  const upcomingColumns = [
    { title: 'الاسم', dataIndex: 'fullName', key: 'fullName' },
    { title: 'تاريخ التجديد', dataIndex: 'renewalDate', key: 'renewalDate', render: formatDate },
    { title: 'الأيام المتبقية', dataIndex: 'daysUntilRenewal', key: 'days', render: (v: number) => <Tag color="orange">{v} يوم</Tag> }
  ];

  return (
    <motion.div 
      className="dashboard-stats"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Stats Grid */}
      <Row gutter={[isMobile ? 8 : 20, isMobile ? 8 : 20]}>
        {stats.map((stat, index) => (
          <Col xs={12} sm={12} md={8} lg={4} key={index}>
            <motion.div variants={itemVariants}>
              <Card className={`stat-card ${stat.className}`}>
                <div className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13, color: '#666' }}>
                  {stat.icon}
                  {stat.title}
                </div>
                <div className="stat-value" style={{ fontSize: 24, fontWeight: 700, color: stat.color }}>
                  {stat.isCurrency ? formatCurrency(stat.value) : stat.value}
                </div>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>

      {/* Charts */}
      <Row gutter={[isMobile ? 8 : 20, isMobile ? 8 : 20]} style={{ marginTop: isMobile ? 12 : 24 }}>
        <Col xs={24} lg={12}>
          <motion.div variants={itemVariants}>
            <Card title="📊 نسبة التحصيل">
              <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={isMobile ? 50 : 80}
                    outerRadius={isMobile ? 80 : 120}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </Col>
        <Col xs={24} lg={12}>
          <motion.div variants={itemVariants}>
            <Card title="📈 إحصائيات المكفولين">
              <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
                <BarChart data={barData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="نشط" fill="#52c41a" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="إجمالي" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* Lists */}
      <Row gutter={[isMobile ? 8 : 20, isMobile ? 8 : 20]} style={{ marginTop: isMobile ? 12 : 24 }}>
        <Col xs={24} lg={12}>
          <motion.div variants={itemVariants}>
            <Card title={<span><AlertTriangle size={18} style={{ color: '#ff4d4f', marginLeft: 8 }} /> المتأخرين عن الدفع ({data.overdueList.length})</span>}>
              {data.overdueList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: isMobile ? 20 : 40, color: '#52c41a', fontSize: isMobile ? 14 : 16 }}>
                  🎉 لا يوجد متأخرين
                </div>
              ) : isMobile ? (
                <List
                  size="small"
                  dataSource={data.overdueList.slice(0, 5)}
                  renderItem={(item) => (
                    <List.Item>
                      <Link to={`/sponsored/${item._id}`} style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>{item.fullName}</span>
                        <Tag color="red">{formatCurrency(item.remaining)}</Tag>
                      </Link>
                    </List.Item>
                  )}
                />
              ) : (
                <Table
                  dataSource={data.overdueList}
                  columns={overdueColumns}
                  rowKey="_id"
                  pagination={false}
                  size="middle"
                />
              )}
            </Card>
          </motion.div>
        </Col>
        <Col xs={24} lg={12}>
          <motion.div variants={itemVariants}>
            <Card title={<span><Calendar size={18} style={{ color: '#faad14', marginLeft: 8 }} /> قريب التجديد - 30 يوم ({data.upcomingRenewalList.length})</span>}>
              {data.upcomingRenewalList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: isMobile ? 20 : 40, color: '#999', fontSize: isMobile ? 14 : 16 }}>
                  لا توجد تجديدات قريبة
                </div>
              ) : isMobile ? (
                <List
                  size="small"
                  dataSource={data.upcomingRenewalList}
                  renderItem={(item) => (
                    <List.Item>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>{item.fullName}</span>
                        <Tag color="orange">{item.daysUntilRenewal} يوم</Tag>
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                <Table
                  dataSource={data.upcomingRenewalList}
                  columns={upcomingColumns}
                  rowKey="_id"
                  pagination={false}
                  size="middle"
                />
              )}
            </Card>
          </motion.div>
        </Col>
      </Row>
    </motion.div>
  );
};

export default Dashboard;
