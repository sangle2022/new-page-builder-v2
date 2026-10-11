import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { Media } from '../api/client';
import MediaLibrary from '../components/MediaLibrary';

export default function Gallery() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    Media.stats().then(setStats).catch(() => {});
  }, []);

  return (
    <div>
      <div className="pb-page-head">
        <div>
          <h1>Image gallery</h1>
          <p>Uploaded and AI-generated images in one place. Search by meaning; similar AI requests reuse existing images to save cost.</p>
        </div>
      </div>
      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={12} md={6}><Card className="pb-kpi"><Statistic title="Images" value={stats.total} /></Card></Col>
          <Col xs={12} md={6}><Card className="pb-kpi"><Statistic title="AI generated" value={stats.ai} /></Card></Col>
          <Col xs={12} md={6}><Card className="pb-kpi"><Statistic title="Uploaded" value={stats.uploads} /></Card></Col>
          <Col xs={12} md={6}><Card className="pb-kpi"><Statistic title="Reuses" value={stats.reuses} /></Card></Col>
        </Row>
      )}
      <Card>
        <MediaLibrary />
      </Card>
    </div>
  );
}
