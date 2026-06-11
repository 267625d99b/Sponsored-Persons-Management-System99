import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown, Drawer } from 'antd';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  User,
  Menu as MenuIcon,
  Sun,
  Moon,
  X,
  ChevronRight,
  ChevronLeft,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationCenter from './NotificationCenter';

const { Header, Sider, Content } = Layout;

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { admin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const allMenuItems = [
    { key: '/', icon: <LayoutDashboard size={20} />, label: 'لوحة التحكم' },
    { key: '/sponsored', icon: <Users size={20} />, label: 'المكفولين' },
    { key: '/reports', icon: <BarChart3 size={20} />, label: 'التقارير' },
    { key: '/settings', icon: <Settings size={20} />, label: 'الإعدادات' },
  ];

  // السوبر أدمن يرى الإعدادات فقط
  const menuItems = admin?.role === 'superadmin'
    ? [{ key: '/settings', icon: <Settings size={20} />, label: 'إدارة المستخدمين' }]
    : allMenuItems;

  const userMenu = {
    items: [
      { key: 'settings', icon: <Settings size={16} />, label: 'الإعدادات', onClick: () => navigate('/settings') },
      { key: 'logout', icon: <X size={16} />, label: 'تسجيل الخروج', danger: true, onClick: logout },
    ]
  };

  const handleMenuClick = (key: string) => {
    navigate(key);
    setMobileMenuOpen(false);
  };

  return (
    <Layout className="site-layout">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sider 
          trigger={null} 
          collapsible 
          collapsed={collapsed}
          width={220}
          collapsedWidth={70}
          style={{ 
            background: theme === 'dark' ? '#1f1f1f' : '#1e3a5f',
            transition: 'all 0.3s',
            position: 'fixed',
            right: 0,
            top: 0,
            bottom: 0,
            zIndex: 100,
          }}
        >
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div className="logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <img 
                src="/الشعار.png" 
                alt="Logo" 
                style={{ 
                  width: collapsed ? 40 : 60, 
                  height: collapsed ? 40 : 60,
                  transition: 'all 0.3s',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  background: 'white',
                  padding: '5px'
                }}
              />
              {!collapsed && <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>إدارة المكفولين</span>}
            </div>
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ background: 'transparent', borderInlineEnd: 'none' }}
          />
          
          <div style={{ 
            position: 'absolute', 
            bottom: 20, 
            width: '100%', 
            padding: '0 8px',
            textAlign: 'center'
          }}>
            <Button
              type="text"
              onClick={() => setCollapsed(!collapsed)}
              style={{ 
                color: 'rgba(255,255,255,0.7)',
                width: '100%',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: 12,
                padding: collapsed ? '0' : '0 20px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)'
              }}
            >
              <div style={{ minWidth: '20px', display: 'flex', justifyContent: 'center' }}>
                {collapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
              </div>
              {!collapsed && <span style={{ fontSize: '14px', fontWeight: 500 }}>طي القائمة</span>}
            </Button>
          </div>
        </Sider>
      )}

      <Layout style={{ marginRight: isMobile ? 0 : (collapsed ? 70 : 220), transition: 'margin 0.3s' }}>
        <Header className="mobile-header" style={{ 
          background: theme === 'dark' ? '#1f1f1f' : '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          transition: 'background 0.3s',
          position: 'sticky',
          top: 0,
          zIndex: 99,
        }}>
          {isMobile ? (
            <>
              <Button
                type="text"
                icon={<MenuIcon size={22} />}
                onClick={() => setMobileMenuOpen(true)}
              />
              <div className="logo" style={{ color: theme === 'dark' ? '#fff' : '#1e3a5f', display: 'flex', alignItems: 'center', gap: 8 }}>
                <img 
                  src="/الشعار.png" 
                  alt="Logo" 
                  style={{ width: 32, height: 32, background: 'white', borderRadius: '6px', padding: '2px' }}
                />
                <span style={{ fontSize: 14, fontWeight: 700 }}>إدارة المكفولين</span>
              </div>
            </>
          ) : (
            <div />
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Dropdown menu={userMenu} placement="bottomLeft">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar 
                  icon={<User size={16} />} 
                  style={{ background: admin?.role === 'superadmin' ? '#f59e0b' : '#3b82f6' }} 
                />
                {!isMobile && (
                  <div style={{ lineHeight: 1.3 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{admin?.name}</div>
                    {admin?.role === 'superadmin' && (
                      <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>مدير عام</div>
                    )}
                  </div>
                )}
              </div>
            </Dropdown>
            
            <motion.div 
              onClick={toggleTheme}
              whileTap={{ scale: 0.9 }}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(59, 130, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {theme === 'dark' ? <Sun size={20} style={{ color: '#3b82f6' }} /> : <Moon size={20} style={{ color: '#3b82f6' }} />}
            </motion.div>

            <NotificationCenter />
          </div>
        </Header>

        <Content className={`content-area ${isMobile ? 'content-with-bottom-nav' : ''}`}>
          <Outlet />
        </Content>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <nav className="mobile-bottom-nav">
            {menuItems.slice(0, 4).map((item) => (
              <NavLink
                key={item.key}
                to={item.key}
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        )}

        {/* Mobile Menu Drawer */}
        <Drawer
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar icon={<User size={16} />} style={{ background: '#3b82f6' }} />
              <div>
                <div style={{ fontWeight: 600 }}>{admin?.name}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{admin?.email}</div>
              </div>
            </div>
          }
          placement="right"
          onClose={() => setMobileMenuOpen(false)}
          open={mobileMenuOpen}
          size="default"
          closeIcon={<X size={20} />}
        >
          <Menu
            mode="vertical"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => handleMenuClick(key)}
            style={{ border: 'none' }}
          />
          <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0', marginTop: 16 }}>
          </div>
        </Drawer>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
