import { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Result } from 'antd';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    // يمكن إرسال الخطأ لخدمة تتبع الأخطاء هنا
    console.error('Error Boundary caught:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: 20,
          background: '#f5f5f5'
        }}>
          <Result
            icon={<AlertTriangle size={64} color="#ff4d4f" />}
            title="حدث خطأ غير متوقع"
            subTitle="نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى."
            extra={[
              <Button 
                key="retry" 
                type="primary" 
                icon={<RefreshCw size={16} />}
                onClick={this.handleRetry}
              >
                إعادة المحاولة
              </Button>,
              <Button 
                key="reload" 
                icon={<RefreshCw size={16} />}
                onClick={this.handleReload}
              >
                تحديث الصفحة
              </Button>,
              <Button 
                key="home" 
                icon={<Home size={16} />}
                onClick={this.handleGoHome}
              >
                الصفحة الرئيسية
              </Button>
            ]}
          >
            {this.state.error && (
              <div style={{ 
                textAlign: 'left', 
                direction: 'ltr',
                background: '#fff1f0',
                padding: 16,
                borderRadius: 8,
                marginTop: 16,
                maxHeight: 200,
                overflow: 'auto'
              }}>
                <strong style={{ color: '#cf1322' }}>{this.state.error.toString()}</strong>
                <pre style={{ fontSize: 12, marginTop: 8, color: '#666' }}>
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}
          </Result>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
