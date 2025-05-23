import React, { useState, useEffect } from 'react';
import AdminRedirect from '../../components/admin/AdminRedirect';
import { 
  Users, DollarSign, Gauge, TrendingUp, ChevronDown, ChevronUp, 
  BarChart2, PieChart, CircleDollarSign, UserCheck, UserMinus
} from 'lucide-react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import { SaaSMetrics } from '../../types';

// Register ChartJS components
ChartJS.register(...registerables);

// Mock data for demo purposes - would be fetched from API
const mockMetrics: SaaSMetrics = {
  activeTenantsCount: 245,
  totalRevenue: 87650.25,
  revenueGrowth: 12.5,
  monthlyRecurringRevenue: 25430.75,
  averageRevenuePerUser: 79.90,
  userGrowth: 8.7,
  churnRate: 2.1,
  moduleUsageStats: [
    { moduleName: 'CRM', count: 215, percentage: 87.8 },
    { moduleName: 'Finance', count: 189, percentage: 77.1 },
    { moduleName: 'Tasks', count: 230, percentage: 93.9 },
    { moduleName: 'Documents', count: 167, percentage: 68.2 },
    { moduleName: 'Tax Docs', count: 98, percentage: 40.0 },
    { moduleName: 'Communication', count: 142, percentage: 58.0 },
    { moduleName: 'Legal', count: 78, percentage: 31.8 },
    { moduleName: 'SaaS Admin', count: 12, percentage: 4.9 },
  ],
  subscriptionStatusSummary: [
    { status: 'Active', count: 228, percentage: 93.1 },
    { status: 'Trial', count: 12, percentage: 4.9 },
    { status: 'Overdue', count: 3, percentage: 1.2 },
    { status: 'Cancelled', count: 2, percentage: 0.8 },
  ],
  revenueByPlan: [
    { planName: 'Basic', revenue: 14500.50, percentage: 16.5 },
    { planName: 'Professional', revenue: 42800.75, percentage: 48.8 },
    { planName: 'Enterprise', revenue: 30349.00, percentage: 34.7 },
  ]
};

// Time periods for filtering data
const timePeriods = ['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'This Year', 'All Time'];

const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SaaSMetrics>(mockMetrics);
  const [selectedPeriod, setSelectedPeriod] = useState('Last 30 Days');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // In a real app, we would fetch data based on the selected period
  useEffect(() => {
    // Simulate data fetching based on selected period
    console.log(`Fetching data for period: ${selectedPeriod}`);
    // In a real app, we would make an API call here
    // setMetrics(data);
  }, [selectedPeriod]);

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  // Chart data for revenue growth
  const revenueChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'MRR',
        data: [19000, 20100, 21500, 22300, 23100, 24200, 24900, 25430, 26100, 27200, 28400, 29800],
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ],
  };

  // Chart data for user growth
  const userGrowthData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'New Users',
        data: [15, 22, 28, 31, 35, 41, 48, 52, 60, 67, 75, 81],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      }
    ],
  };

  // Chart data for module usage
  const moduleUsageData = {
    labels: metrics.moduleUsageStats.map(m => m.moduleName),
    datasets: [
      {
        data: metrics.moduleUsageStats.map(m => m.percentage),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(199, 199, 199, 0.7)',
          'rgba(83, 102, 255, 0.7)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart data for subscription status
  const subscriptionStatusData = {
    labels: metrics.subscriptionStatusSummary.map(s => s.status),
    datasets: [
      {
        data: metrics.subscriptionStatusSummary.map(s => s.count),
        backgroundColor: [
          'rgba(75, 192, 192, 0.7)', // Active
          'rgba(54, 162, 235, 0.7)', // Trial
          'rgba(255, 206, 86, 0.7)', // Overdue
          'rgba(255, 99, 132, 0.7)', // Cancelled
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart data for revenue by plan
  const revenueByPlanData = {
    labels: metrics.revenueByPlan.map(p => p.planName),
    datasets: [
      {
        label: 'Revenue by Plan',
        data: metrics.revenueByPlan.map(p => p.revenue),
        backgroundColor: [
          'rgba(255, 159, 64, 0.7)', // Basic
          'rgba(54, 162, 235, 0.7)', // Professional
          'rgba(153, 102, 255, 0.7)', // Enterprise
        ],
      }
    ],
  };

  return (
    <AdminRedirect>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SaaS Admin Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Comprehensive view of platform performance metrics
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <select
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              {timePeriods.map(period => (
                <option key={period} value={period}>{period}</option>
              ))}
            </select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Active Tenants Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Active Tenants
                    </h2>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {metrics.activeTenantsCount}
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="text-xs font-medium">+{metrics.userGrowth}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Recurring Revenue Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CircleDollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Monthly Recurring Revenue
                    </h2>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      R$ {metrics.monthlyRecurringRevenue.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="text-xs font-medium">+{metrics.revenueGrowth}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* ARPU Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Avg. Revenue Per User
                    </h2>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      R$ {metrics.averageRevenuePerUser.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="text-xs font-medium">+2.1%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Churn Rate Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <UserMinus className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Churn Rate
                    </h2>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {metrics.churnRate}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-red-600 dark:text-red-400">
                  <TrendingUp className="h-4 w-4 mr-1 transform rotate-180" />
                  <span className="text-xs font-medium">-0.3%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue Over Time Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Revenue Growth</h3>
              <button
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                onClick={() => toggleCardExpansion('revenueChart')}
              >
                {expandedCards['revenueChart'] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
            <div className={`p-5 ${expandedCards['revenueChart'] ? 'h-96' : 'h-72'} transition-all duration-300`}>
              <Line 
                data={revenueChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: 'Monthly Recurring Revenue (R$)'
                    }
                  }
                }} 
              />
            </div>
          </div>

          {/* User Growth Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">User Acquisition</h3>
              <button
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                onClick={() => toggleCardExpansion('userChart')}
              >
                {expandedCards['userChart'] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
            <div className={`p-5 ${expandedCards['userChart'] ? 'h-96' : 'h-72'} transition-all duration-300`}>
              <Bar 
                data={userGrowthData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: 'New Users Per Month'
                    }
                  }
                }} 
              />
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Module Usage Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Module Usage</h3>
              <button
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                onClick={() => toggleCardExpansion('moduleChart')}
              >
                {expandedCards['moduleChart'] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
            <div className={`p-5 ${expandedCards['moduleChart'] ? 'h-96' : 'h-72'} transition-all duration-300 flex items-center justify-center`}>
              <div className="w-full max-w-md">
                <Doughnut
                  data={moduleUsageData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                      },
                      title: {
                        display: true,
                        text: 'Module Adoption (%)'
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Subscription Status Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Subscription Status</h3>
              <button
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                onClick={() => toggleCardExpansion('subscriptionChart')}
              >
                {expandedCards['subscriptionChart'] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
            <div className={`p-5 ${expandedCards['subscriptionChart'] ? 'h-96' : 'h-72'} transition-all duration-300 flex items-center justify-center`}>
              <div className="w-full max-w-md">
                <Doughnut
                  data={subscriptionStatusData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                      },
                      title: {
                        display: true,
                        text: 'Subscription Status Distribution'
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 3 */}
        <div className="grid grid-cols-1 gap-6">
          {/* Revenue by Plan Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Revenue by Plan</h3>
              <button
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                onClick={() => toggleCardExpansion('revenueByPlanChart')}
              >
                {expandedCards['revenueByPlanChart'] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
            <div className={`p-5 ${expandedCards['revenueByPlanChart'] ? 'h-96' : 'h-72'} transition-all duration-300`}>
              <Bar
                data={revenueByPlanData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                    title: {
                      display: true,
                      text: 'Revenue Distribution by Plan (R$)'
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </AdminRedirect>
  );
};

export default AdminDashboard;