"use client";

import * as React from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface VisualizationChartProps {
  title: string;
  data: ChartData[];
  type?: "pie" | "bar";
  height?: number;
  className?: string;
}

const DEFAULT_COLORS = [
  "#2563eb", // primary
  "#059669", // success
  "#d97706", // warning
  "#dc2626", // error
  "#7c3aed", // purple
  "#db2777", // pink
  "#0891b2", // cyan
  "#65a30d", // lime
];

export function VisualizationChart({
  title,
  data,
  type = "pie",
  height = 300,
  className,
}: VisualizationChartProps) {
  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }));

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number, data: ChartData[]) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
    return `${percentage}%`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-primary">
            {formatValue(data.value)}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatPercentage(data.value, chartData)}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={(entry) => `${entry.name}: ${formatPercentage(entry.value, chartData)}`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis 
          dataKey="name" 
          className="text-muted-foreground"
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          className="text-muted-foreground"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {type === "pie" ? renderPieChart() : renderBarChart()}
      </CardContent>
    </Card>
  );
}