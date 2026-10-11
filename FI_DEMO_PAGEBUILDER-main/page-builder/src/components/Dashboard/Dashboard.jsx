import React from "react";
import { Row, Col } from "antd";
import SummaryCards from "./SummaryCards";
import AnalyticsCharts from "./AnalyticsCharts";
import TexturedBackground from "./TexturedBackground";
import AllLeads from "../Tables/AllLeads";
import { useSelector } from "react-redux";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { PropagateLoader } from "react-spinners";

const fetchDashboardCards = async () => {
  const response = await axios.get(
    "/server/page_builder_function/dashboard-card-analytics"
  );
  return response.data;
};

const Dashboard = () => {
  const user = useSelector((state) => state.user);
  const userName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();

  const {
    data: cardsdata = {},
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["dashboard-card-analytics"],
    queryFn: fetchDashboardCards,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  if (isPending) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#f5f7fa",
        }}
      >
       <PropagateLoader color="#3169be" size={15} />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: "20px", color: "red" }}>
        Error loading dashboard: {error?.message || "Something went wrong"}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "10px",
        backgroundColor: "#f5f7fa",
        minHeight: "100vh",
      }}
    >
      <TexturedBackground
        title={`Welcome ${userName}`}
        description="Page Builder Overview"
      />

      <SummaryCards data={cardsdata} />

      <AnalyticsCharts />

      {/* <Row style={{ marginTop: 24 }}>
        <Col xs={24}>
          <AllLeads />
        </Col>
      </Row> */}
    </div>
  );
};

export default Dashboard;