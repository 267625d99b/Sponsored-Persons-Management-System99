import { Card, Skeleton, Row, Col } from 'antd';

export const DashboardSkeleton = () => (
  <div>
    <Row gutter={[16, 16]}>
      {[...Array(6)].map((_, i) => (
        <Col xs={24} sm={12} lg={8} xl={4} key={i}>
          <Card>
            <Skeleton active paragraph={{ rows: 1 }} />
          </Card>
        </Col>
      ))}
    </Row>
    <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
      <Col xs={24} lg={12}>
        <Card>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </Col>
    </Row>
  </div>
);

export const TableSkeleton = () => (
  <Card>
    <Skeleton active paragraph={{ rows: 1 }} style={{ marginBottom: 24 }} />
    {[...Array(5)].map((_, i) => (
      <Skeleton key={i} active avatar paragraph={{ rows: 1 }} style={{ marginBottom: 16 }} />
    ))}
  </Card>
);

export const DetailSkeleton = () => (
  <div>
    <Card style={{ marginBottom: 16 }}>
      <Skeleton active paragraph={{ rows: 4 }} />
    </Card>
    <Card style={{ marginBottom: 16 }}>
      <Row gutter={16}>
        {[...Array(3)].map((_, i) => (
          <Col span={8} key={i}>
            <Skeleton active paragraph={{ rows: 1 }} />
          </Col>
        ))}
      </Row>
    </Card>
    <Card>
      <Skeleton active paragraph={{ rows: 5 }} />
    </Card>
  </div>
);

export const ReportSkeleton = () => (
  <Card>
    <Row gutter={[16, 16]}>
      {[...Array(4)].map((_, i) => (
        <Col xs={24} sm={12} lg={6} key={i}>
          <Card>
            <Skeleton active paragraph={{ rows: 1 }} />
          </Card>
        </Col>
      ))}
    </Row>
    <Card style={{ marginTop: 24 }}>
      <Skeleton active paragraph={{ rows: 8 }} />
    </Card>
  </Card>
);
