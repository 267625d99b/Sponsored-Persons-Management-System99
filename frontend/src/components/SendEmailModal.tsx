import { useState } from 'react';
import { Modal, Form, Input, Button, message, Alert } from 'antd';
import { Mail, Send } from 'lucide-react';
import { settingsAPI } from '../services/api';

interface SendEmailModalProps {
  open: boolean;
  onClose: () => void;
  defaultTo?: string;
  defaultSubject?: string;
}

const SendEmailModal = ({ open, onClose, defaultTo, defaultSubject }: SendEmailModalProps) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values: { to: string; subject: string; message: string }) => {
    setLoading(true);
    try {
      await settingsAPI.sendEmail(values.to, values.subject, values.message);
      message.success('تم إرسال البريد بنجاح');
      form.resetFields();
      onClose();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'فشل إرسال البريد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Mail size={20} />
          إرسال بريد إلكتروني
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <Alert
        type="info"
        message="سيتم إرسال البريد من حساب النظام المُعد في الإعدادات"
        style={{ marginBottom: 16 }}
        showIcon
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          to: defaultTo || '',
          subject: defaultSubject || ''
        }}
      >
        <Form.Item
          name="to"
          label="إلى (البريد الإلكتروني)"
          rules={[
            { required: true, message: 'مطلوب' },
            { type: 'email', message: 'بريد إلكتروني غير صحيح' }
          ]}
        >
          <Input placeholder="example@email.com" prefix={<Mail size={16} />} />
        </Form.Item>

        <Form.Item
          name="subject"
          label="الموضوع"
          rules={[{ required: true, message: 'مطلوب' }]}
        >
          <Input placeholder="موضوع الرسالة" />
        </Form.Item>

        <Form.Item
          name="message"
          label="الرسالة"
          rules={[{ required: true, message: 'مطلوب' }]}
        >
          <Input.TextArea 
            rows={6} 
            placeholder="اكتب رسالتك هنا..."
            style={{ resize: 'none' }}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={onClose}>إلغاء</Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<Send size={16} />}
            >
              إرسال
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SendEmailModal;
