import { memo } from 'react';
import { Modal, Input } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, ShieldAlert } from 'lucide-react';
import { useState } from 'react';

interface Props {
  open: boolean;
  title: string;
  description: string;
  itemName?: string;
  confirmText?: string;
  requireConfirmation?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  danger?: boolean;
}

const DeleteConfirmModal = memo(({ 
  open, 
  title, 
  description, 
  itemName,
  confirmText = 'نعم، احذف',
  requireConfirmation = false,
  onConfirm, 
  onCancel, 
  loading,
  danger = true
}: Props) => {
  const [confirmInput, setConfirmInput] = useState('');
  
  const canConfirm = !requireConfirmation || confirmInput === itemName;

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm();
      setConfirmInput('');
    }
  };

  const handleCancel = () => {
    setConfirmInput('');
    onCancel();
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      footer={null}
      closable={false}
      centered
      width={420}
      destroyOnHidden
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{ textAlign: 'center', padding: '20px 0' }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', delay: 0.1, stiffness: 200 }}
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: danger 
                  ? 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)'
                  : 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: danger 
                  ? '0 10px 30px rgba(255, 77, 79, 0.3)'
                  : '0 10px 30px rgba(250, 173, 20, 0.3)',
              }}
            >
              {danger ? <AlertTriangle size={40} color="white" /> : <ShieldAlert size={40} color="white" />}
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ marginBottom: 8, color: '#1e3a5f', fontSize: 20 }}
            >
              {title}
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              style={{ color: '#666', marginBottom: 16, fontSize: 15, lineHeight: 1.6 }}
            >
              {description}
            </motion.p>

            {itemName && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{
                  background: '#fff2f0',
                  border: '1px solid #ffccc7',
                  borderRadius: 8,
                  padding: '12px 16px',
                  marginBottom: 16,
                  textAlign: 'right'
                }}
              >
                <div style={{ fontSize: 13, color: '#cf1322', marginBottom: 4 }}>
                  ⚠️ سيتم حذف جميع البيانات المرتبطة بـ:
                </div>
                <div style={{ fontWeight: 600, color: '#1e3a5f', fontSize: 16 }}>
                  "{itemName}"
                </div>
              </motion.div>
            )}

            {requireConfirmation && itemName && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                style={{ marginBottom: 20, textAlign: 'right' }}
              >
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#666' }}>
                  للتأكيد، اكتب "<strong>{itemName}</strong>" في الحقل أدناه:
                </label>
                <Input
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder={`اكتب "${itemName}" للتأكيد`}
                  status={confirmInput && confirmInput !== itemName ? 'error' : undefined}
                />
              </motion.div>
            )}

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{ display: 'flex', gap: 12, justifyContent: 'center' }}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCancel}
                style={{
                  padding: '12px 28px',
                  borderRadius: 8,
                  border: '1px solid #d9d9d9',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: 15,
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
              >
                إلغاء
              </motion.button>
              <motion.button
                whileHover={canConfirm ? { scale: 1.02 } : {}}
                whileTap={canConfirm ? { scale: 0.98 } : {}}
                onClick={handleConfirm}
                disabled={loading || !canConfirm}
                style={{
                  padding: '12px 28px',
                  borderRadius: 8,
                  border: 'none',
                  background: canConfirm 
                    ? (danger ? 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)' : 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)')
                    : '#f5f5f5',
                  color: canConfirm ? 'white' : '#999',
                  cursor: (loading || !canConfirm) ? 'not-allowed' : 'pointer',
                  fontSize: 15,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.2s'
                }}
              >
                <Trash2 size={18} />
                {loading ? 'جاري الحذف...' : confirmText}
              </motion.button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{ 
                marginTop: 16, 
                fontSize: 12, 
                color: '#999',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4
              }}
            >
              <ShieldAlert size={14} />
              هذا الإجراء لا يمكن التراجع عنه
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
});

DeleteConfirmModal.displayName = 'DeleteConfirmModal';

export default DeleteConfirmModal;
