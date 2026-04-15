import { useState, useMemo } from 'react';
import { SummaryData, ProjectData } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, DollarSign, Filter, Activity } from 'lucide-react';

interface DashboardProps {
  projects: ProjectData[];
  summary: SummaryData;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f43f5e'];

export function Dashboard({ projects, summary }: DashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const categoryData = useMemo(() => {
    return Object.entries(summary.estimatedByCategory).map(([name, value]) => ({ name, value }));
  }, [summary.estimatedByCategory]);

  const statusData = useMemo(() => {
    return Object.entries(summary.estimatedByStatus).map(([name, value]) => ({ name, value }));
  }, [summary.estimatedByStatus]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (selectedCategory && p.category !== selectedCategory) return false;
      if (selectedStatus && p.status !== selectedStatus) return false;
      return true;
    });
  }, [projects, selectedCategory, selectedStatus]);

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#64748b] space-y-4">
        <Activity className="w-16 h-16 text-[#e2e8f0]" />
        <p className="text-lg">Đang tải dữ liệu hoặc chưa có dữ liệu...</p>
      </div>
    );
  }

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedStatus(null);
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-[24px] font-bold text-[#1e3a8a]">Báo Cáo Phân Tích Công Trình</h2>
          <p className="text-[13px] text-[#64748b]">Nguồn dữ liệu: Google Sheets (Sửa chữa lớn)</p>
        </div>
        {(selectedCategory || selectedStatus) && (
          <button 
            onClick={clearFilters}
            className="flex items-center px-4 py-2 bg-[#3b82f6] text-white rounded-md font-semibold text-sm hover:bg-blue-600 transition-colors"
          >
            <Filter className="w-4 h-4 mr-2" />
            Bỏ lọc {selectedCategory ? `[${selectedCategory}]` : ''} {selectedStatus ? `[${selectedStatus}]` : ''}
          </button>
        )}
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-[#e2e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="text-[12px] text-[#64748b] uppercase font-bold mb-2">Tổng Giá Trị Khái Toán</div>
          <div className="text-[22px] font-bold text-[#1e3a8a]">{formatCurrency(summary.totalEstimated)}</div>
          <div className="text-[12px] mt-1 text-[#10b981]">Tổng số {projects.length} công trình</div>
        </div>
        
        <div className="bg-white p-5 rounded-lg border border-[#e2e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="text-[12px] text-[#64748b] uppercase font-bold mb-2">Tổng Giá Trị Thực Hiện</div>
          <div className="text-[22px] font-bold text-[#1e3a8a]">{formatCurrency(summary.totalExecuted)}</div>
          <div className="text-[12px] mt-1 text-[#f59e0b]">
            {((summary.totalExecuted / summary.totalEstimated) * 100 || 0).toFixed(1)}% so với khái toán
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-[#e2e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="text-[12px] text-[#64748b] uppercase font-bold mb-2">Tổng Giá Trị Quyết Toán</div>
          <div className="text-[22px] font-bold text-[#1e3a8a]">{formatCurrency(summary.totalSettlement)}</div>
          <div className="text-[12px] mt-1 text-[#8b5cf6]">
            {((summary.totalSettlement / summary.totalEstimated) * 100 || 0).toFixed(1)}% so với khái toán
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-lg border border-[#e2e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="text-[12px] text-[#64748b] uppercase font-bold mb-2">Đang Thi Công</div>
          <div className="text-[22px] font-bold text-[#1e3a8a]">
            {summary.countByStatus['Đang thi công'] || 0}
          </div>
          <div className="text-[12px] mt-1 text-[#64748b]">công trình</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="bg-white rounded-lg border border-[#e2e8f0] flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#e2e8f0] font-bold text-[14px] flex justify-between">
            <span>Giá Trị Khái Toán Theo Hạng Mục</span>
            <span className="text-[#64748b] font-normal">Nhấp để lọc</span>
          </div>
          <div className="p-4 flex-1">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" onClick={(data: any) => {
                  if (data && data.activePayload && data.activePayload.length > 0) {
                    setSelectedCategory(data.activePayload[0].payload.name);
                  }
                }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" tickFormatter={(value) => `${(value / 1000000000).toFixed(1)}B`} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis dataKey="name" type="category" width={150} tick={{fill: '#64748b', fontSize: 11}} />
                  <RechartsTooltip formatter={(value: number) => formatCurrency(value)} cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} className="cursor-pointer" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg border border-[#e2e8f0] flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#e2e8f0] font-bold text-[14px] flex justify-between">
            <span>Trạng Thái Công Trình (Theo Giá Trị)</span>
            <span className="text-[#64748b] font-normal">Nhấp để lọc</span>
          </div>
          <div className="p-4 flex-1 flex flex-col">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    onClick={(data) => setSelectedStatus(data.name)}
                    className="cursor-pointer"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>

      {/* Detailed Table */}
      <section className="bg-white rounded-lg border border-[#e2e8f0] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#e2e8f0] font-bold text-[14px]">
          Chi Tiết Công Trình {(selectedCategory || selectedStatus) ? '(Đã lọc)' : ''}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr>
                <th className="p-[10px] bg-[#f8fafc] text-[#64748b] font-semibold border-b border-[#e2e8f0]">Mã CT</th>
                <th className="p-[10px] bg-[#f8fafc] text-[#64748b] font-semibold border-b border-[#e2e8f0]">Tên Công Trình</th>
                <th className="p-[10px] bg-[#f8fafc] text-[#64748b] font-semibold border-b border-[#e2e8f0]">Hạng Mục</th>
                <th className="p-[10px] bg-[#f8fafc] text-[#64748b] font-semibold border-b border-[#e2e8f0]">Trạng Thái</th>
                <th className="p-[10px] bg-[#f8fafc] text-[#64748b] font-semibold border-b border-[#e2e8f0] text-right">Khái Toán</th>
                <th className="p-[10px] bg-[#f8fafc] text-[#64748b] font-semibold border-b border-[#e2e8f0] text-right">Thực Hiện</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((p) => (
                <tr key={p.id} className="hover:bg-[#f8fafc]">
                  <td className="p-[10px] border-b border-[#e2e8f0] font-mono text-[#3b82f6]">{p.code}</td>
                  <td className="p-[10px] border-b border-[#e2e8f0] font-semibold text-[#1e293b] max-w-[300px] truncate" title={p.name}>{p.name}</td>
                  <td className="p-[10px] border-b border-[#e2e8f0] text-[#64748b]">{p.category}</td>
                  <td className="p-[10px] border-b border-[#e2e8f0]">
                    <span className={`px-2 py-1 rounded text-[11px] font-bold ${
                      p.status === 'Đang thi công' ? 'bg-[#3b82f6]/10 text-[#3b82f6]' : 
                      p.status.includes('Lập') ? 'bg-[#f59e0b]/10 text-[#f59e0b]' : 
                      'bg-[#64748b]/10 text-[#64748b]'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-[10px] border-b border-[#e2e8f0] text-right font-bold text-[#1e293b]">
                    {formatCurrency(p.estimatedValue)}
                  </td>
                  <td className="p-[10px] border-b border-[#e2e8f0] text-right text-[#10b981] font-semibold">
                    {p.executedValue > 0 ? formatCurrency(p.executedValue) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
