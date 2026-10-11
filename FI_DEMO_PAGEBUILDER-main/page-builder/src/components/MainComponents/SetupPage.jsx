import React from "react";
import { Layout, Menu, Typography } from "antd";
import { FormOutlined, SecurityScanOutlined } from "@ant-design/icons";
import { useNavigate, useLocation, Outlet } from "react-router-dom";

import IntegrateLogo from "../../Integrate-logo.png";

const { Sider, Content } = Layout;
const { Title } = Typography;

const SetupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getSelectedKey = () => {
    if (location.pathname.includes("/settings/crm-mapping")) return "general";
    if (location.pathname.includes("/settings/form-settings"))
      return "security";
    if (location.pathname.includes("/settings/captcha")) return "process";
    return "general";
  };

  const handleMenuClick = (e) => {
    const routeMap = {
      general: "/settings/crm-mapping",
      security: "/settings/form-settings",
      process: "/settings/captcha",
    };

    navigate(routeMap[e.key]);
  };

  const selectedKey = getSelectedKey();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={220} className="site-layout-background" theme="light">
        <Title level={2} style={{ color: "#3169be", marginLeft: "10px" }}>
          Setup
        </Title>

        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={handleMenuClick}
          style={{ height: "100%", borderRight: 0 }}
          theme="light"
        >
          <Menu.Item
            key="general"
            icon={
              <img
                src={IntegrateLogo}
                alt="CRM Logo"
                style={{ width: "20px", marginRight: "-2px" }}
              />
            }
            style={{
              fontWeight: selectedKey === "general" ? "bold" : "normal",
              backgroundColor:
                selectedKey === "general" ? "#f0f0f0" : "transparent",
            }}
          >
            Zoho CRM Mapping
          </Menu.Item>

          <Menu.Item
            key="security"
            icon={<FormOutlined />}
            style={{
              fontWeight: selectedKey === "security" ? "bold" : "normal",
              backgroundColor:
                selectedKey === "security" ? "#f0f0f0" : "transparent",
            }}
          >
            Form Settings
          </Menu.Item>

          <Menu.Item
            key="process"
            icon={<SecurityScanOutlined />}
            style={{
              fontWeight: selectedKey === "process" ? "bold" : "normal",
              backgroundColor:
                selectedKey === "process" ? "#f0f0f0" : "transparent",
            }}
          >
            Captcha
          </Menu.Item>
        </Menu>
      </Sider>

      <Layout style={{ padding: "20px 20px 20px" }}>
        <Content
          style={{
            margin: 0,
            minHeight: 280,
            background: "#fff",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default SetupPage;
