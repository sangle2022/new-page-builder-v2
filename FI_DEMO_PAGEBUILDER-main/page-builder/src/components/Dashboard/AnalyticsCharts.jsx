import React, { useState } from "react";
import { Row, Col, Card, Typography, Select, message } from "antd";
import ReactApexChart from "react-apexcharts";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { PropagateLoader } from "react-spinners";

const { Title } = Typography;
const { Option } = Select;

const verticalBarChartConfig = (categories, monthlyData) => ({
  series: [
    {
      name: "Leads Count",
      data: monthlyData,
    },
  ],
  options: {
    chart: {
      type: "bar",
      height: 300,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
        columnWidth: "60%",
      },
    },
    xaxis: {
      categories,
    },
    colors: ["#A6C5F5"],
    fill: {
      type: "gradient",
      gradient: {
        shade: "light",
        type: "vertical",
        gradientToColors: ["#3169BE"],
        stops: [0, 100],
      },
    },
    yaxis: {
      title: {
        text: "Number of Leads",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 1,
      colors: ["transparent"],
    },
  },
});

const fetchMonthWiseData = async ({ queryKey }) => {
  const [, year] = queryKey;

  const response = await axios.get(
    `/server/page_builder_function/month-wise-count?year=${year}`,
  );

  return response.data;
};

const AnalyticsCharts = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());

  const years = Array.from({ length: 3 }, (_, i) =>
    (currentYear - i).toString(),
  ).filter((year) => year !== "2023");

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["month-wise-count", selectedYear],
    queryFn: fetchMonthWiseData,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const apiData = data?.data || [];

  const categories =
    apiData.length > 0
      ? apiData.map((item) => item.month)
      : [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];

  const monthlyData =
    apiData.length > 0
      ? apiData.map((item) => item.count)
      : new Array(12).fill(0);

  if (isError) {
    message.error(error?.message || "Failed to load monthly analytics");
  }

  return (
    <div>
      <Row style={{ marginBottom: "16px" }}>
        <Col xs={24} md={12}>
          <Select
            value={selectedYear}
            style={{ width: 200 }}
            onChange={setSelectedYear}
          >
            {years.map((year) => (
              <Option key={year} value={year}>
                {year}
              </Option>
            ))}
          </Select>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginBottom: "24px" }}>
        <Col xs={24}>
          <Card
            bordered={false}
            className="hover-card"
            style={{ height: 400, width: "100%" }}
          >
            <Title level={4} style={{ color: "#3169BE", marginBottom: "16px" }}>
              Monthly Leads Data for {selectedYear}
            </Title>

            {isPending ? (
              <div
                style={{
                  height: 300,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
               <PropagateLoader color="#3169be" size={15} />
              </div>
            ) : (
              <ReactApexChart
                options={
                  verticalBarChartConfig(categories, monthlyData).options
                }
                series={verticalBarChartConfig(categories, monthlyData).series}
                type="bar"
                height={300}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AnalyticsCharts;
