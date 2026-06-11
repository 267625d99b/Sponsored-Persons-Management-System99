import { useEffect, memo, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, DatePicker, App } from 'antd';
import dayjs from 'dayjs';
import { sponsoredAPI } from '../services/api';
import { Sponsored } from '../types';
import { useSettings } from '../context/SettingsContext';

interface Props {
  open: boolean;
  sponsored: Sponsored | null;
  onClose: () => void;
  onSave: () => void;
}

const SponsoredForm = memo(({ open, sponsored, onClose, onSave }: Props) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const { settings } = useSettings();
  const isEdit = !!sponsored;
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (sponsored) {
        form.setFieldsValue({
          ...sponsored,
          sponsorshipStartDate: dayjs(sponsored.sponsorshipStartDate)
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, sponsored, form]);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        sponsorshipStartDate: values.sponsorshipStartDate.format('YYYY-MM-DD')
      };

      if (isEdit) {
        await sponsoredAPI.update(sponsored._id, data);
        message.success('تم تحديث بيانات المكفول بنجاح');
      } else {
        await sponsoredAPI.create(data);
        message.success('تم إضافة المكفول بنجاح');
      }
      form.resetFields();
      onSave();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }, errorFields?: unknown[] };
      // تجاهل أخطاء validation الخاصة بالـ Form
      if (error.errorFields) {
        return;
      }
      // عرض رسالة الخطأ من الـ API
      const errorMessage = error.response?.data?.message;
      if (errorMessage) {
        message.error(errorMessage);
      } else {
        message.error('حدث خطأ في حفظ البيانات');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={isEdit ? 'تعديل مكفول' : 'إضافة مكفول جديد'}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={submitting}
      okText={isEdit ? 'تحديث' : 'إضافة'}
      cancelText="إلغاء"
      width={600}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" initialValues={{ status: 'active' }}>
        <Form.Item
          name="fullName"
          label="الاسم الكامل"
          rules={[
            { required: true, message: 'الاسم مطلوب' },
            { min: 2, message: 'الاسم يجب أن يكون حرفين على الأقل' },
            { max: 100, message: 'الاسم طويل جداً' }
          ]}
        >
          <Input placeholder="أدخل الاسم الكامل" maxLength={100} />
        </Form.Item>

        <Form.Item
          name="idNumber"
          label="رقم الهوية / الجواز"
          rules={[
            { required: true, message: 'رقم الهوية مطلوب' },
            { min: 5, message: 'رقم الهوية يجب أن يكون 5 أرقام على الأقل' },
            { max: 20, message: 'رقم الهوية طويل جداً' }
          ]}
        >
          <Input placeholder="أدخل رقم الهوية" maxLength={20} />
        </Form.Item>

        <Form.Item 
          name="phone" 
          label="رقم الهاتف"
          rules={[
            { pattern: /^[0-9+\-\s]*$/, message: 'رقم الهاتف غير صحيح' }
          ]}
        >
          <Input placeholder="أدخل رقم الهاتف" maxLength={20} />
        </Form.Item>

        <Form.Item
          name="sponsorshipStartDate"
          label="تاريخ بداية الكفالة"
          rules={[{ required: true, message: 'التاريخ مطلوب' }]}
        >
          <DatePicker style={{ width: '100%' }} placeholder="اختر التاريخ" />
        </Form.Item>

        <Form.Item
          name="annualAmount"
          label="قيمة الكفالة السنوية"
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

        <Form.Item name="status" label="الحالة">
          <Select
            options={[
              { value: 'active', label: 'نشط' },
              { value: 'inactive', label: 'منتهي' }
            ]}
          />
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

SponsoredForm.displayName = 'SponsoredForm';

export default SponsoredForm;
