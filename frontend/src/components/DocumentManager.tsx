import { useState, useEffect } from 'react';
import {
  Card,
  Upload,
  Button,
  List,
  Tag,
  Select,
  Input,
  Modal,
  Image,
  message,
  Empty,
  Popconfirm,
  Skeleton,
} from 'antd';
import { motion } from 'framer-motion';
import {
  Upload as UploadIcon,
  FileText,
  Image as ImageIcon,
  Trash2,
  Download,
  Eye,
  File,
  Edit,
} from 'lucide-react';
import { documentAPI } from '../services/api';
import { Document } from '../types';

interface Props {
  sponsoredId: string;
  sponsoredName: string;
}

// Lazy Image Component with loading state
const LazyImage = ({
  src,
  alt,
  style,
}: {
  src: string;
  alt: string;
  style?: React.CSSProperties;
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div style={{ position: 'relative', ...style }}>
      {!loaded && !error && (
        <Skeleton.Image
          active
          style={{ width: style?.width || 48, height: style?.height || 48 }}
        />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{
          ...style,
          display: loaded ? 'block' : 'none',
          objectFit: 'cover',
        }}
      />
      {error && (
        <div
          style={{
            ...style,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f0f0f0',
          }}
        >
          <ImageIcon size={20} color="#999" />
        </div>
      )}
    </div>
  );
};

const categoryLabels: Record<string, { label: string; color: string }> = {
  id: { label: 'هوية', color: 'blue' },
  photo: { label: 'صورة', color: 'green' },
  contract: { label: 'عقد', color: 'purple' },
  receipt: { label: 'إيصال', color: 'orange' },
  other: { label: 'أخرى', color: 'default' }
};

const DocumentManager = ({ sponsoredId }: Props) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [editDoc, setEditDoc] = useState<Document | null>(null);
  const [editForm, setEditForm] = useState({ category: 'other', description: '' });
  const [uploadCategory, setUploadCategory] = useState('other');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data } = await documentAPI.getBySponsored(sponsoredId);
      setDocuments(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => { fetchDocuments(); }, [sponsoredId]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sponsoredId', sponsoredId);
    formData.append('category', uploadCategory);

    try {
      await documentAPI.upload(formData);
      message.success('تم رفع الملف بنجاح');
      fetchDocuments();
    } catch (error) {
      console.error('Error:', error);
      message.error('حدث خطأ في رفع الملف');
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleDelete = async (id: string) => {
    try {
      await documentAPI.delete(id);
      message.success('تم حذف المستند');
      fetchDocuments();
    } catch (error) {
      console.error('Error:', error);
      message.error('حدث خطأ في الحذف');
    }
  };

  const handleUpdate = async () => {
    if (!editDoc) return;
    try {
      await documentAPI.update(editDoc._id, editForm);
      message.success('تم تحديث المستند');
      setEditDoc(null);
      fetchDocuments();
    } catch (error) {
      console.error('Error:', error);
      message.error('حدث خطأ في التحديث');
    }
  };

  const handlePreview = (doc: Document) => {
    if (doc.fileType.startsWith('image/')) {
      setPreviewUrl(documentAPI.getFileUrl(doc.filename));
      setPreviewVisible(true);
    } else {
      window.open(documentAPI.getFileUrl(doc.filename), '_blank');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon size={20} color="#52c41a" />;
    if (fileType === 'application/pdf') return <FileText size={20} color="#ff4d4f" />;
    return <File size={20} color="#1890ff" />;
  };

  return (
    <Card 
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={20} />
          المستندات ({documents.length})
        </span>
      }
    >
      {/* Upload Section */}
      <div style={{ marginBottom: 20, padding: 16, background: '#f9f9f9', borderRadius: 12 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <Select
            value={uploadCategory}
            onChange={setUploadCategory}
            style={{ width: isMobile ? '100%' : 150 }}
            options={Object.entries(categoryLabels).map(([value, { label }]) => ({ value, label }))}
          />
        </div>
        <Upload.Dragger
          beforeUpload={handleUpload}
          showUploadList={false}
          accept="image/*,.pdf,.doc,.docx"
          disabled={uploading}
        >
          <p style={{ marginBottom: 8 }}>
            <UploadIcon size={32} color="#1890ff" />
          </p>
          <p style={{ fontSize: 14, color: '#666' }}>
            {uploading ? 'جاري الرفع...' : 'اضغط أو اسحب الملف هنا'}
          </p>
          <p style={{ fontSize: 12, color: '#999' }}>
            صور، PDF، Word (حد أقصى 10MB)
          </p>
        </Upload.Dragger>
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <Empty description="لا توجد مستندات" />
      ) : (
        <List
          dataSource={documents}
          renderItem={(doc) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <List.Item
                style={{ 
                  padding: 12, 
                  marginBottom: 8, 
                  background: '#fafafa', 
                  borderRadius: 8,
                  flexWrap: 'wrap'
                }}
                actions={[
                  <Button 
                    type="text" 
                    icon={<Eye size={16} />} 
                    onClick={() => handlePreview(doc)}
                  />,
                  <Button 
                    type="text" 
                    icon={<Download size={16} />}
                    onClick={() => window.open(documentAPI.getFileUrl(doc.filename), '_blank')}
                  />,
                  <Button 
                    type="text" 
                    icon={<Edit size={16} />}
                    onClick={() => {
                      setEditDoc(doc);
                      setEditForm({ category: doc.category, description: doc.description || '' });
                    }}
                  />,
                  <Popconfirm
                    title="هل أنت متأكد من حذف هذا المستند؟"
                    onConfirm={() => handleDelete(doc._id)}
                    okText="نعم"
                    cancelText="لا"
                  >
                    <Button type="text" danger icon={<Trash2 size={16} />} />
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    doc.fileType.startsWith('image/') ? (
                      <LazyImage
                        src={documentAPI.getFileUrl(doc.filename)}
                        alt={doc.originalName}
                        style={{ width: 48, height: 48, borderRadius: 8 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#f0f0f0',
                          borderRadius: 8,
                        }}
                      >
                        {getFileIcon(doc.fileType)}
                      </div>
                    )
                  }
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14 }}>{doc.originalName}</span>
                      <Tag color={categoryLabels[doc.category]?.color || 'default'}>
                        {categoryLabels[doc.category]?.label || doc.category}
                      </Tag>
                    </div>
                  }
                  description={
                    <div style={{ fontSize: 12, color: '#999' }}>
                      {formatFileSize(doc.fileSize)} • {new Date(doc.createdAt).toLocaleDateString('ar-SA')}
                      {doc.description && <div style={{ marginTop: 4 }}>{doc.description}</div>}
                    </div>
                  }
                />
              </List.Item>
            </motion.div>
          )}
        />
      )}

      {/* Preview Modal */}
      <Image
        style={{ display: 'none' }}
        preview={{
          visible: previewVisible,
          src: previewUrl,
          onVisibleChange: (visible) => setPreviewVisible(visible),
        }}
      />

      {/* Edit Modal */}
      <Modal
        title="تعديل المستند"
        open={!!editDoc}
        onCancel={() => setEditDoc(null)}
        onOk={handleUpdate}
        okText="حفظ"
        cancelText="إلغاء"
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>التصنيف</label>
          <Select
            value={editForm.category}
            onChange={(v) => setEditForm({ ...editForm, category: v })}
            style={{ width: '100%' }}
            options={Object.entries(categoryLabels).map(([value, { label }]) => ({ value, label }))}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 8 }}>الوصف</label>
          <Input.TextArea
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            rows={3}
            placeholder="وصف المستند..."
          />
        </div>
      </Modal>
    </Card>
  );
};

export default DocumentManager;
