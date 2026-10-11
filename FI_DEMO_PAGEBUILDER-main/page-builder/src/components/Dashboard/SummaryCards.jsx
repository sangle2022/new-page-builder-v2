import React from "react";
import { Row, Col, Card, Typography, Statistic } from "antd";
import {
  UserOutlined,
  FormOutlined,
  LayoutOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;

const cardStyle = {
  borderRadius: "12px",
  background: "linear-gradient(135deg, #ffffff, #f0f2f5)",
  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
  padding: "12px",
  position: "relative",
  transition: "transform 0.4s ease, box-shadow 0.4s ease",
  minHeight: "120px",
  cursor: "pointer",
};

const iconStyle = {
  position: "absolute",
  top: "12px",
  right: "12px",
  fontSize: "40px",
  color: "#3169BE",
};

const SummaryCards = ({ data = {} }) => {
  const navigate = useNavigate();

  return (
    <Row
      gutter={[16, 16]}
      justify="space-between"
      style={{ marginBottom: "24px" }}
    >
      <Col xs={24} sm={12} md={6}>
        <Card
          bordered={false}
          style={{ ...cardStyle, borderLeft: "5px solid #3169BE" }}
          hoverable
          onClick={() => navigate("/all-leads")}
        >
          <UserOutlined style={iconStyle} />
          <Title level={4} style={{ marginBottom: "8px" }}>
            Total Leads
          </Title>
          <Statistic value={data?.leads?.total || 0} />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card
          bordered={false}
          style={{ ...cardStyle, borderLeft: "5px solid #3169BE" }}
          hoverable
          onClick={() => navigate("/all-pages")}
        >
          <FormOutlined style={iconStyle} />
          <Title level={4} style={{ marginBottom: "8px" }}>
            Total Pages
          </Title>
          <Statistic value={data?.pages?.total || 0} />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card
          bordered={false}
          style={{ ...cardStyle, borderLeft: "5px solid #3169BE" }}
          hoverable
          onClick={() => navigate("/all-pages")}
        >
          <TeamOutlined style={iconStyle} />
          <Title level={4} style={{ marginBottom: "8px" }}>
            Published Pages
          </Title>
          <Statistic value={data?.pages?.published || 0} />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card
          bordered={false}
          style={{ ...cardStyle, borderLeft: "5px solid #3169BE" }}
          hoverable
          onClick={() => navigate("/all-pages")}
        >
          <LayoutOutlined style={iconStyle} />
          <Title level={4} style={{ marginBottom: "8px" }}>
            Draft Pages
          </Title>
          <Statistic value={data?.pages?.drafted || 0} />
        </Card>
      </Col>
    </Row>
  );
};

export default SummaryCards;