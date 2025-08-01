import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

interface StatChartProps {
  data: any[];
  type: 'bar' | 'line' | 'pie';
  title: string;
  xAxisKey: string;
  yAxisKey: string;
  color?: string;
  height?: number;
}

const StatChart: React.FC<StatChartProps> = ({ 
  data, 
  type, 
  title, 
  xAxisKey, 
  yAxisKey, 
  color = '#8B5CF6', 
  height = 300 
}) => {
  const colors = ['#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/10 backdrop-blur-lg p-3 rounded-lg border border-white/20">
          <p className="text-white font-medium">{label}</p>
          <p className="text-white/80">
            {payload[0].name}: {payload[0].value?.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey={xAxisKey} 
                stroke="rgba(255,255,255,0.7)"
                fontSize={12}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.7)"
                fontSize={12}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey={yAxisKey} fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey={xAxisKey} 
                stroke="rgba(255,255,255,0.7)"
                fontSize={12}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.7)"
                fontSize={12}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey={yAxisKey} 
                stroke={color} 
                strokeWidth={2}
                dot={{ fill: color, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey={yAxisKey}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
    >
      <h3 className="text-white font-bold text-lg mb-4">{title}</h3>
      {renderChart()}
    </motion.div>
  );
};

export default StatChart;