import { memo, useState } from 'react';
import { Modal, Form, InputNumber, DatePicker, Input, App } from 'antd';
import dayjs from 'dayjs';
import { paymentAPI } from '../services/api';
import { useSettings } from '../context/SettingsContext';

interface Props {
  open: boolean;
  sponsoredId: string;
  onClose: () => void;
  onSave: () => void;
}

const PaymentForm = memo(({ open, sponsoredId, onClose, onSave }: Props) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const { settings } = useSettings();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const values = await form.validateFields();
      await paymentAPI.create({
        sponsored: sponsoredId,
        amount: values.amount,
        paymentDate: values.paymentDate.format('YYYY-MM-DD'),
        notes: values.notes
      });
      message.success('تم تسجيل الدفعة بنجاح');
      form.resetFields();
      onSave();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }, errorFields?: unknown[] };
      if (error.errorFields) {
        // Validation error - already shown by form
        return;
      }
      message.error(error.response?.data?.message || 'حدث خطأ في تسجيل الدفعة');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="تسجيل دفعة جديدة"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={submitting}
      okText="تسجيل"
      cancelText="إلغاء"
      destroyOnHidden
    >
      <Form 
        form={form} 
        layout="vertical"
        initialValues={{ paymentDate: dayjs() }}
      >
        <Form.Item
          name="amount"
          label="المبلغ"
          rules={[
            { required: true, message: 'المبلغ مطلوب' },
            { type: 'number', min: 1, message: 'المبلغ يجب أن يكون أكبر من صفر' }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="أدخل المبلغ"
            min={1}
            max={10000000}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            suffix={settings.currencySymbol}
          />
        </Form.Item>

        <Form.Item
          name="paymentDate"
          label="تاريخ الدفع"
          rules={[{ required: true, message: 'التاريخ مطلوب' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item 
          name="notes" 
          label="ملاحظات"
          rules={[{ max: 500, message: 'الملاحظات طويلة جداً' }]}
        >
          <Input.TextArea rows={3} placeholder="ملاحظات إضافية..." maxLength={500} showCount />
        </Form.Item>
      </Form>
    </Modal>
  );
});

PaymentForm.displayName = 'PaymentForm';

export default PaymentForm;
