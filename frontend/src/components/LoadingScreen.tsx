import { Spin } from 'antd';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

const LoadingScreen = ({ message = 'جاري التحميل...', fullScreen = true }: LoadingScreenProps) => {
  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Spin size="large" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ 
          color: '#666', 
          fontSize: 16,
          margin: 0
        }}
      >
        {message}
      </motion.p>
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.9)',
        zIndex: 9999
      }}>
        {content}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      minHeight: 200
    }}>
      {content}
    </div>
  );
};

// Loading Overlay للعمليات
export const LoadingOverlay = ({ visible, message }: { visible: boolean; message?: string }) => {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 10000
      }}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        style={{
          background: '#fff',
          padding: 32,
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}
      >
        <Spin size="large" />
        <span style={{ color: '#333', fontSize: 15 }}>{message || 'جاري المعالجة...'}</span>
      </motion.div>
    </motion.div>
  );
};

export default LoadingScreen;
