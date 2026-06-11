import { useState, useEffect, useCallback } from 'react';
import { Badge, Dropdown, List, Button, Empty, Spin, App, Tooltip } from 'antd';
import { Bell, Check, CheckCheck, Trash2, User, DollarSign, AlertTriangle, Calendar, Settings, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: number;
  isRead: boolean;
  createdAt: string;
}

const NotificationCenter = () => {
  return (
    <App>
      <NotificationCenterContent />
    </App>
  );
};

const NotificationCenterContent = () => {
  const { theme } = useTheme();
  const { message } = App.useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await notificationAPI.getAll();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await notificationAPI.getUnreadCount();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Error:', error);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    // تحديث العدد كل 30 ثانية
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetchNotifications().finally(() => setLoading(false));
    }
  }, [open, fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleTriggerCheck = async () => {
    setTriggering(true);
    try {
      const { data } = await notificationAPI.triggerCheck();
      message.success(data.message);
      await fetchNotifications();
    } catch (error) {
      message.error('فشل تشغيل الفحص');
    } finally {
      setTriggering(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationAPI.delete(id);
      const notification = notifications.find(n => n._id === id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment': return <DollarSign size={16} style={{ color: '#52c41a' }} />;
      case 'overdue': return <AlertTriangle size={16} style={{ color: '#ff4d4f' }} />;
      case 'renewal': return <Calendar size={16} style={{ color: '#faad14' }} />;
      case 'sponsored': return <User size={16} style={{ color: '#3b82f6' }} />;
      case 'system': return <Settings size={16} style={{ color: '#666' }} />;
      default: return <Bell size={16} />;
    }
  };

  // const getTypeColor = (type: string) => {
  //   switch (type) {
  //     case 'payment': return 'success';
  //     case 'overdue': return 'error';
  //     case 'renewal': return 'warning';
  //     case 'sponsored': return 'processing';
  //     default: return 'default';
  //   }
  // };

  const formatTime = (date: string) => {
    const now = new Date();
    const d = new Date(date);
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    return d.toLocaleDateString('ar-SA');
  };

  const dropdownContent = (
    <div style={{ 
      width: 360, 
      maxHeight: 450, 
      background: theme === 'dark' ? '#1f1f1f' : '#fff', 
      borderRadius: 12,
      boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: theme === 'dark' ? '1px solid #333' : '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontWeight: 600, fontSize: 15, color: theme === 'dark' ? '#fff' : '#000' }}>
          الإشعارات {unreadCount > 0 && `(${unreadCount})`}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <Tooltip title="فحص التجديدات الآن">
            <Button
              type="text"
              size="small"
              icon={<RefreshCw size={14} />}
              loading={triggering}
              onClick={handleTriggerCheck}
            />
          </Tooltip>
          {unreadCount > 0 && (
            <Button
              type="link"
              size="small"
              icon={<CheckCheck size={14} />}
              onClick={handleMarkAllAsRead}
            >
              قراءة الكل
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxHeight: 350, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <Empty 
            description="لا توجد إشعارات" 
            style={{ padding: 40 }}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(item) => (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <List.Item
                    style={{ 
                      padding: '12px 16px',
                      background: item.isRead ? 'transparent' : (theme === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.05)'),
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      borderBottom: theme === 'dark' ? '1px solid #333' : '1px solid #f0f0f0'
                    }}
                    onClick={() => !item.isRead && handleMarkAsRead(item._id)}
                  >
                    <List.Item.Meta
                      avatar={
                        <div style={{ 
                          width: 36, 
                          height: 36, 
                          borderRadius: '50%',
                          background: theme === 'dark' ? '#333' : '#f5f5f5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {getIcon(item.type)}
                        </div>
                      }
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ 
                            fontWeight: item.isRead ? 400 : 600,
                            color: theme === 'dark' ? '#fff' : '#000'
                          }}>
                            {item.title}
                          </span>
                          {!item.isRead && (
                            <span style={{ 
                              width: 8, 
                              height: 8, 
                              borderRadius: '50%', 
                              background: '#3b82f6' 
                            }} />
                          )}
                        </div>
                      }
                      description={
                        <div>
                          <div style={{ 
                            fontSize: 13, 
                            color: theme === 'dark' ? '#aaa' : '#666', 
                            marginBottom: 4 
                          }}>
                            {item.message}
                          </div>
                          <div style={{ 
                            fontSize: 11, 
                            color: theme === 'dark' ? '#888' : '#999' 
                          }}>
                            {formatTime(item.createdAt)}
                          </div>
                        </div>
                      }
                    />
                    <div style={{ display: 'flex', gap: 4 }}>
                      {!item.isRead && (
                        <Button 
                          type="text" 
                          size="small" 
                          icon={<Check size={14} />}
                          onClick={(e) => { e.stopPropagation(); handleMarkAsRead(item._id); }}
                        />
                      )}
                      <Button 
                        type="text" 
                        size="small" 
                        danger
                        icon={<Trash2 size={14} />}
                        onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }}
                      />
                    </div>
                  </List.Item>
                </motion.div>
              </AnimatePresence>
            )}
          />
        )}
      </div>
    </div>
  );

  return (
    <Dropdown
      popupRender={() => dropdownContent}
      trigger={['click']}
      open={open}
      onOpenChange={setOpen}
      placement="bottomLeft"
    >
      <motion.div
        whileTap={{ scale: 0.95 }}
        style={{ cursor: 'pointer', position: 'relative' }}
      >
        <Badge count={unreadCount} size="small" offset={[-2, 2]}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(59, 130, 246, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bell size={20} style={{ color: '#3b82f6' }} />
          </div>
        </Badge>
      </motion.div>
    </Dropdown>
  );
};

export default NotificationCenter;
