import { useState } from 'react';
import { Modal, Upload, Button, Table, Alert, Progress, message, Steps, Tag, Tooltip, Space, Divider, Card, Statistic, Row, Col } from 'antd';
import { Upload as UploadIcon, FileSpreadsheet, Check, AlertTriangle, Download, Info, X, CheckCircle, XCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { sponsoredAPI } from '../services/api';

interface ImportDataProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportRow {
  key: number;
  fullName: string;
  idNumber: string;
  phone?: string;
  sponsorshipStartDate: string;
  annualAmount: number;
  status: 'valid' | 'error' | 'duplicate' | 'warning';
  error?: string;
  warnings?: string[];
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const ImportData = ({ open, onClose, onSuccess }: ImportDataProps) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState({ success: 0, failed: 0, skipped: 0 });
  const [fileName, setFileName] = useState('');

  const resetState = () => {
    setStep(0);
    setData([]);
    setProgress(0);
    setResults({ success: 0, failed: 0, skipped: 0 });
    setFileName('');
  };

  const handleClose = () => {
    if (importing) {
      message.warning('جاري الاستيراد، يرجى الانتظار...');
      return;
    }
    resetState();
    onClose();
  };

  // التحقق المتقدم من البيانات
  const validateRow = (row: any): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    const fullName = String(row.fullName || '').trim();
    const idNumber = String(row.idNumber || '').trim();
    const phone = String(row.phone || '').trim();
    const amount = row.annualAmount;

    // التحقق من الحقول المطلوبة
    if (!fullName) {
      errors.push('الاسم مطلوب');
    } else if (fullName.length < 3) {
      errors.push('الاسم يجب أن يكون 3 أحرف على الأقل');
    } else if (fullName.length > 100) {
      errors.push('الاسم طويل جداً (أكثر من 100 حرف)');
    }

    if (!idNumber) {
      errors.push('رقم الهوية مطلوب');
    } else if (idNumber.length < 5) {
      errors.push('رقم الهوية يجب أن يكون 5 أرقام على الأقل');
    } else if (idNumber.length > 20) {
      errors.push('رقم الهوية طويل جداً');
    }

    if (!row.sponsorshipStartDate) {
      errors.push('تاريخ البداية مطلوب');
    }

    if (!amount || amount <= 0) {
      errors.push('الكفالة السنوية يجب أن تكون أكبر من صفر');
    } else if (amount > 1000000) {
      warnings.push('الكفالة السنوية كبيرة جداً (أكثر من مليون)');
    }

    // تحذيرات
    if (phone && phone.length > 0) {
      if (phone.length < 9) {
        warnings.push('رقم الهاتف قد يكون غير صحيح (أقل من 9 أرقام)');
      } else if (phone.length > 15) {
        warnings.push('رقم الهاتف طويل جداً');
      }
    } else {
      warnings.push('لا يوجد رقم هاتف');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  };

  const parseExcel = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target?.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          message.error('الملف فارغ');
          return;
        }

        if (jsonData.length > 5000) {
          message.warning('الملف يحتوي على أكثر من 5000 سجل، قد يستغرق الاستيراد وقتاً طويلاً');
        }

        const parsedData: ImportRow[] = jsonData.map((row: any, index) => {
          // قراءة البيانات من الأعمدة المختلفة
          const fullName = row['الاسم'] || row['fullName'] || row['name'] || row['الاسم الكامل'] || '';
          const idNumber = row['رقم الهوية'] || row['idNumber'] || row['id'] || row['الهوية'] || '';
          const phone = row['الهاتف'] || row['phone'] || row['الجوال'] || row['mobile'] || '';
          const startDate = row['تاريخ البداية'] || row['sponsorshipStartDate'] || row['startDate'] || row['تاريخ الكفالة'] || '';
          const amount = parseFloat(row['الكفالة السنوية'] || row['annualAmount'] || row['amount'] || row['المبلغ'] || 0);

          const rowData = {
            fullName: String(fullName).trim(),
            idNumber: String(idNumber).trim(),
            phone: String(phone).trim(),
            sponsorshipStartDate: formatDate(startDate),
            annualAmount: amount
          };

          const validation = validateRow(rowData);

          return {
            key: index,
            ...rowData,
            status: validation.isValid ? 'valid' : 'error',
            error: validation.errors.join(', '),
            warnings: validation.warnings
          };
        });

        // التحقق من التكرارات
        const idNumbers = new Set<string>();
        parsedData.forEach(row => {
          if (row.idNumber && idNumbers.has(row.idNumber)) {
            row.status = 'duplicate';
            row.error = 'رقم الهوية مكرر في الملف';
          } else if (row.idNumber) {
            idNumbers.add(row.idNumber);
          }
        });

        setData(parsedData);
        setStep(1);
        
        const validCount = parsedData.filter(d => d.status === 'valid').length;
        message.success(`تم قراءة ${parsedData.length} سجل، ${validCount} سجل صالح`);
      } catch (error) {
        console.error('Parse error:', error);
        message.error('خطأ في قراءة الملف. تأكد من أن الملف بتنسيق Excel صحيح');
      }
    };
    
    reader.onerror = () => {
      message.error('فشل قراءة الملف');
    };
    
    reader.readAsBinaryString(file);
  };

  const formatDate = (date: any): string => {
    if (!date) return '';
    
    try {
      // إذا كان رقم Excel
      if (typeof date === 'number') {
        const excelDate = new Date((date - 25569) * 86400 * 1000);
        return excelDate.toISOString().split('T')[0];
      }
      
      // إذا كان نص
      if (typeof date === 'string') {
        // محاولة تحويل التنسيقات المختلفة
        const formats = [
          date, // كما هو
          date.replace(/\//g, '-'), // تحويل / إلى -
          date.split('/').reverse().join('-'), // عكس الترتيب
        ];
        
        for (const format of formats) {
          const parsed = new Date(format);
          if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split('T')[0];
          }
        }
      }
      
      return String(date);
    } catch {
      return String(date);
    }
  };

  const handleImport = async () => {
    const validData = data.filter(d => d.status === 'valid');
    if (validData.length === 0) {
      message.error('لا توجد بيانات صالحة للاستيراد');
      return;
    }

    setImporting(true);
    setStep(2);
    let success = 0;
    let failed = 0;
    let skipped = 0;

    // استيراد تدريجي مع معالجة الأخطاء
    for (let i = 0; i < validData.length; i++) {
      const row = validData[i];
      try {
        await sponsoredAPI.create({
          fullName: row.fullName,
          idNumber: row.idNumber,
          phone: row.phone || undefined,
          sponsorshipStartDate: row.sponsorshipStartDate,
          annualAmount: row.annualAmount,
          status: 'active',
          notes: `مستورد من ${fileName}`
        });
        success++;
        
        // تحديث حالة الصف
        setData(prev => prev.map(d => 
          d.key === row.key 
            ? { ...d, status: 'valid' as const }
            : d
        ));
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || 'خطأ غير معروف';
        
        if (errorMsg.includes('مسجل مسبقاً') || errorMsg.includes('موجود')) {
          skipped++;
          setData(prev => prev.map(d => 
            d.key === row.key 
              ? { ...d, status: 'duplicate' as const, error: 'موجود مسبقاً في النظام' }
              : d
          ));
        } else {
          failed++;
          setData(prev => prev.map(d => 
            d.key === row.key 
              ? { ...d, status: 'error' as const, error: errorMsg }
              : d
          ));
        }
      }
      
      setProgress(Math.round(((i + 1) / validData.length) * 100));
      
      // تأخير بسيط لتجنب الضغط على الخادم
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    setResults({ success, failed, skipped });
    setImporting(false);
    setStep(3);
    
    if (success > 0) {
      onSuccess();
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        'الاسم': 'محمد أحمد',
        'رقم الهوية': '1234567890',
        'الهاتف': '0501234567',
        'تاريخ البداية': '2024-01-01',
        'الكفالة السنوية': 5000
      },
      {
        'الاسم': 'فاطمة علي',
        'رقم الهوية': '0987654321',
        'الهاتف': '0559876543',
        'تاريخ البداية': '2024-02-01',
        'الكفالة السنوية': 6000
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المكفولين');
    XLSX.writeFile(wb, 'قالب_استيراد_المكفولين.xlsx');
    message.success('تم تحميل القالب');
  };

  const columns = [
    { 
      title: '#', 
      key: 'index',
      width: 50,
      render: (_: any, __: any, index: number) => index + 1
    },
    { 
      title: 'الاسم', 
      dataIndex: 'fullName', 
      key: 'fullName',
      width: 150,
      ellipsis: true
    },
    { 
      title: 'رقم الهوية', 
      dataIndex: 'idNumber', 
      key: 'idNumber',
      width: 120
    },
    { 
      title: 'الهاتف', 
      dataIndex: 'phone', 
      key: 'phone',
      width: 110,
      render: (phone: string) => phone || '-'
    },
    { 
      title: 'تاريخ البداية', 
      dataIndex: 'sponsorshipStartDate', 
      key: 'date',
      width: 110
    },
    { 
      title: 'الكفالة السنوية', 
      dataIndex: 'annualAmount', 
      key: 'amount',
      width: 110,
      render: (amount: number) => amount.toLocaleString('ar-SA')
    },
    {
      title: 'الحالة',
      dataIndex: 'status',
      key: 'status',
      width: 200,
      fixed: 'right' as const,
      render: (status: string, record: ImportRow) => {
        if (status === 'valid') {
          return (
            <Space direction="vertical" size={0}>
              <Tag color="success" icon={<CheckCircle size={14} />}>صالح</Tag>
              {record.warnings && record.warnings.length > 0 && (
                <Tooltip title={record.warnings.join(', ')}>
                  <Tag color="warning" icon={<Info size={14} />} style={{ cursor: 'pointer' }}>
                    {record.warnings.length} تحذير
                  </Tag>
                </Tooltip>
              )}
            </Space>
          );
        }
        
        if (status === 'duplicate') {
          return (
            <Tooltip title={record.error}>
              <Tag color="orange" icon={<AlertTriangle size={14} />}>مكرر</Tag>
            </Tooltip>
          );
        }
        
        return (
          <Tooltip title={record.error}>
            <Tag color="error" icon={<XCircle size={14} />}>خطأ</Tag>
          </Tooltip>
        );
      }
    }
  ];

  const validCount = data.filter(d => d.status === 'valid').length;
  const errorCount = data.filter(d => d.status === 'error').length;
  const duplicateCount = data.filter(d => d.status === 'duplicate').length;
  const warningCount = data.filter(d => d.warnings && d.warnings.length > 0).length;

  return (
    <Modal
      title={
        <Space>
          <FileSpreadsheet size={20} />
          <span>استيراد بيانات من Excel</span>
        </Space>
      }
      open={open}
      onCancel={handleClose}
      width={1000}
      footer={null}
      mask={{ closable: !importing }}
      closable={!importing}
    >
      <Steps
        current={step}
        items={[
          { title: 'رفع الملف', icon: <UploadIcon size={16} /> },
          { title: 'مراجعة البيانات', icon: <FileSpreadsheet size={16} /> },
          { title: 'الاستيراد', icon: <Progress type="circle" percent={0} width={16} /> },
          { title: 'النتائج', icon: <Check size={16} /> }
        ]}
        style={{ marginBottom: 24 }}
      />

      {step === 0 && (
        <div>
          <Upload.Dragger
            accept=".xlsx,.xls,.csv"
            showUploadList={false}
            beforeUpload={(file) => {
              if (file.size > 10 * 1024 * 1024) {
                message.error('حجم الملف كبير جداً (أكثر من 10 MB)');
                return false;
              }
              parseExcel(file);
              return false;
            }}
            style={{ marginBottom: 20 }}
          >
            <p style={{ fontSize: 48, color: '#3b82f6', margin: '20px 0' }}>
              <FileSpreadsheet size={48} />
            </p>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              اضغط أو اسحب ملف Excel هنا
            </p>
            <p style={{ color: '#666', marginBottom: 0 }}>
              يدعم ملفات .xlsx, .xls, .csv (حتى 10 MB)
            </p>
          </Upload.Dragger>

          <Card size="small" title="معلومات مهمة">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                type="info"
                showIcon
                message="تنسيق الملف المطلوب"
                description={
                  <div>
                    <p style={{ marginBottom: 8 }}>يجب أن يحتوي الملف على الأعمدة التالية:</p>
                    <ul style={{ paddingRight: 20, marginBottom: 0 }}>
                      <li><strong>الاسم</strong> (مطلوب) - 3 أحرف على الأقل</li>
                      <li><strong>رقم الهوية</strong> (مطلوب) - 5 أرقام على الأقل</li>
                      <li><strong>الهاتف</strong> (اختياري) - 9-15 رقم</li>
                      <li><strong>تاريخ البداية</strong> (مطلوب) - بتنسيق YYYY-MM-DD</li>
                      <li><strong>الكفالة السنوية</strong> (مطلوب) - رقم أكبر من صفر</li>
                    </ul>
                  </div>
                }
              />
              
              <Button 
                icon={<Download size={16} />} 
                onClick={downloadTemplate}
                block
              >
                تحميل قالب Excel جاهز
              </Button>
            </Space>
          </Card>
        </div>
      )}

      {step === 1 && (
        <div>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card size="small">
                <Statistic 
                  title="إجمالي السجلات" 
                  value={data.length}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic 
                  title="صالح" 
                  value={validCount}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircle size={16} />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic 
                  title="أخطاء" 
                  value={errorCount + duplicateCount}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<XCircle size={16} />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic 
                  title="تحذيرات" 
                  value={warningCount}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<AlertTriangle size={16} />}
                />
              </Card>
            </Col>
          </Row>

          {(errorCount > 0 || duplicateCount > 0) && (
            <Alert
              type="warning"
              showIcon
              message={`يوجد ${errorCount + duplicateCount} سجل بها أخطاء، لن يتم استيرادها`}
              style={{ marginBottom: 16 }}
            />
          )}

          <Table
            dataSource={data}
            columns={columns}
            size="small"
            pagination={{ 
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `إجمالي ${total} سجل`
            }}
            scroll={{ x: 900, y: 400 }}
            rowClassName={(record) => {
              if (record.status === 'error' || record.status === 'duplicate') return 'error-row';
              if (record.warnings && record.warnings.length > 0) return 'warning-row';
              return '';
            }}
          />

          <Divider />

          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
            <Button onClick={resetState} icon={<X size={16} />}>
              إلغاء
            </Button>
            <Space>
              <Button onClick={() => setStep(0)}>
                رجوع
              </Button>
              <Button 
                type="primary" 
                onClick={handleImport}
                disabled={validCount === 0}
                icon={<Check size={16} />}
              >
                استيراد {validCount} سجل صالح
              </Button>
            </Space>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Progress 
            type="circle" 
            percent={progress}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
            width={150}
          />
          <p style={{ marginTop: 24, fontSize: 18, fontWeight: 600 }}>
            جاري الاستيراد...
          </p>
          <p style={{ color: '#666' }}>
            يرجى عدم إغلاق النافذة
          </p>
        </div>
      )}

      {step === 3 && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 80, marginBottom: 24 }}>
            {results.failed === 0 ? '🎉' : results.success > 0 ? '⚠️' : '❌'}
          </div>
          <h2 style={{ marginBottom: 24 }}>
            {results.failed === 0 ? 'اكتمل الاستيراد بنجاح!' : 'اكتمل الاستيراد مع بعض الأخطاء'}
          </h2>
          
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Card>
                <Statistic 
                  title="نجح" 
                  value={results.success}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircle size={20} />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic 
                  title="فشل" 
                  value={results.failed}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<XCircle size={20} />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic 
                  title="مكرر" 
                  value={results.skipped}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<AlertTriangle size={20} />}
                />
              </Card>
            </Col>
          </Row>

          {results.failed > 0 && (
            <Alert
              type="warning"
              showIcon
              message="بعض السجلات فشلت"
              description="يمكنك مراجعة الجدول أعلاه لمعرفة السجلات التي فشلت وأسباب الفشل"
              style={{ marginBottom: 16 }}
            />
          )}

          <Space>
            {results.failed > 0 && (
              <Button onClick={() => setStep(1)}>
                مراجعة الأخطاء
              </Button>
            )}
            <Button type="primary" onClick={handleClose} size="large">
              إغلاق
            </Button>
          </Space>
        </div>
      )}

      <style>{`
        .error-row {
          background-color: #fff1f0 !important;
        }
        .warning-row {
          background-color: #fffbe6 !important;
        }
      `}</style>
    </Modal>
  );
};

export default ImportData;
