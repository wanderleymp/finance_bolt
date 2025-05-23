import React from 'react';
import { BarChart3 } from 'lucide-react';

interface ChartWidgetProps {
  title: string;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      color: string;
    }[];
  };
}

const ChartWidget: React.FC<ChartWidgetProps> = ({ title, data }) => {
  // Em uma aplicação real, usaríamos uma biblioteca de gráficos como Chart.js ou Recharts
  // Aqui estamos simulando um gráfico simples
  const maxValue = Math.max(...data.datasets.flatMap(dataset => dataset.data));
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            {title}
          </h2>
          <div className="flex items-center space-x-4">
            {data.datasets.map((dataset, index) => (
              <div key={index} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-1"
                  style={{ backgroundColor: dataset.color }}
                ></div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {dataset.label}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="h-64 relative">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
            <div>R$ {maxValue.toLocaleString('pt-BR')}</div>
            <div>R$ {(maxValue * 0.75).toLocaleString('pt-BR')}</div>
            <div>R$ {(maxValue * 0.5).toLocaleString('pt-BR')}</div>
            <div>R$ {(maxValue * 0.25).toLocaleString('pt-BR')}</div>
            <div>R$ 0</div>
          </div>
          
          {/* Chart grid lines */}
          <div className="absolute left-12 right-0 top-0 bottom-0 flex flex-col justify-between">
            <div className="border-b border-gray-200 dark:border-gray-700 h-0"></div>
            <div className="border-b border-gray-200 dark:border-gray-700 h-0"></div>
            <div className="border-b border-gray-200 dark:border-gray-700 h-0"></div>
            <div className="border-b border-gray-200 dark:border-gray-700 h-0"></div>
            <div className="border-b border-gray-200 dark:border-gray-700 h-0"></div>
          </div>
          
          {/* Bars */}
          <div className="absolute left-16 right-4 top-0 bottom-8 flex items-end">
            <div className="flex-1 flex justify-around items-end h-full">
              {data.labels.map((label, labelIndex) => (
                <div key={labelIndex} className="flex flex-col items-center">
                  <div className="flex items-end h-[calc(100%-20px)]">
                    {data.datasets.map((dataset, datasetIndex) => {
                      const value = dataset.data[labelIndex];
                      const height = `${(value / maxValue) * 100}%`;
                      
                      return (
                        <div
                          key={datasetIndex}
                          className="mx-1 w-6 rounded-t-sm transition-all duration-300 hover:opacity-80"
                          style={{ 
                            height, 
                            backgroundColor: dataset.color,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                          title={`${dataset.label}: ${value.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}`}
                        ></div>
                      );
                    })}
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartWidget;