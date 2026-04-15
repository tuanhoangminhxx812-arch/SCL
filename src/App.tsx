/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { AIReport } from './components/AIReport';
import { ProjectData, SummaryData } from './types';
import { LayoutDashboard, FileText, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1cbzRaL7op3ynywqtqDhfRQLYg3gSLSAd/export?format=csv&gid=393987778';

export default function App() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'report'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const parseCurrency = (val: string) => {
    if (!val) return 0;
    const cleaned = val.replace(/\./g, '').replace(/,/g, '').replace(/\s/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const fetchData = () => {
    setLoading(true);
    setError('');
    Papa.parse(SHEET_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const parsedData: ProjectData[] = [];
          results.data.forEach((row: any, index) => {
            if (row['STT'] === '' && row['Tên công trình'] === 'Tổng giá trị') return;
            if (!row['Tên công trình']) return;

            parsedData.push({
              id: `proj-${index}`,
              code: row['Mã công trình'] || '',
              name: row['Tên công trình'] || '',
              decision: row['Số QĐ phê duyệt danh mục'] || '',
              content: row['Nội dung chính sữa chữa '] || '',
              schedule: row['Tiến độ thực hiện theo kế hoạch'] || '',
              year: row['Năm'] || '',
              estimatedValue: parseCurrency(row['Giá trị khái toán']),
              category: row['Tên hạng mục'] || 'Chưa phân loại',
              status: row['Trạng thái'] || 'Chưa xác định',
              executedValue: parseCurrency(row['Giá trị thực hiện']),
              settlementValue: parseCurrency(row['Giá trị quyết toán']),
            });
          });
          setProjects(parsedData);
          setLastUpdated(new Date());
        } catch (err: any) {
          setError('Lỗi khi xử lý dữ liệu: ' + err.message);
        } finally {
          setLoading(false);
        }
      },
      error: (err) => {
        setError('Lỗi khi tải dữ liệu từ Google Sheets: ' + err.message);
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const summaryData = useMemo<SummaryData>(() => {
    let totalEstimated = 0;
    let totalExecuted = 0;
    let totalSettlement = 0;
    const estimatedByCategory: Record<string, number> = {};
    const executedByCategory: Record<string, number> = {};
    const countByStatus: Record<string, number> = {};
    const estimatedByStatus: Record<string, number> = {};

    projects.forEach(p => {
      totalEstimated += p.estimatedValue;
      totalExecuted += p.executedValue;
      totalSettlement += p.settlementValue;

      estimatedByCategory[p.category] = (estimatedByCategory[p.category] || 0) + p.estimatedValue;
      executedByCategory[p.category] = (executedByCategory[p.category] || 0) + p.executedValue;
      
      countByStatus[p.status] = (countByStatus[p.status] || 0) + 1;
      estimatedByStatus[p.status] = (estimatedByStatus[p.status] || 0) + p.estimatedValue;
    });

    return {
      totalEstimated,
      totalExecuted,
      totalSettlement,
      estimatedByCategory,
      executedByCategory,
      countByStatus,
      estimatedByStatus
    };
  }, [projects]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row text-[#1e293b] font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-[240px] bg-[#1e3a8a] text-white flex flex-col py-6">
        <div className="px-6 pb-8 border-b border-white/10 mb-6">
          <h1 className="text-lg uppercase tracking-[1px] font-bold">FinaSystem</h1>
          <p className="text-xs text-blue-200 mt-1">Báo cáo Kế toán trưởng</p>
        </div>
        <nav className="flex-1 flex flex-col">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-6 py-3 text-sm transition-all border-l-4 ${activeTab === 'dashboard' ? 'bg-white/10 opacity-100 border-[#3b82f6] font-semibold' : 'opacity-70 hover:opacity-100 border-transparent'}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Tổng Quan Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`w-full flex items-center space-x-3 px-6 py-3 text-sm transition-all border-l-4 ${activeTab === 'report' ? 'bg-white/10 opacity-100 border-[#3b82f6] font-semibold' : 'opacity-70 hover:opacity-100 border-transparent'}`}
          >
            <FileText className="w-4 h-4" />
            <span>Báo Cáo AI</span>
          </button>
        </nav>
        <div className="px-6 mt-auto">
          <button
            onClick={fetchData}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 bg-[#3b82f6] hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>Cập Nhật Dữ Liệu</span>
          </button>
          {lastUpdated && (
            <p className="text-[10px] text-center text-blue-200 mt-2">
              Cập nhật lần cuối: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 flex flex-col gap-5 overflow-y-auto">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center border border-red-200">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}
        {activeTab === 'dashboard' && <Dashboard projects={projects} summary={summaryData} />}
        {activeTab === 'report' && <AIReport summary={summaryData} />}
      </main>
    </div>
  );
}
