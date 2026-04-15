import { useState } from 'react';
import { SummaryData } from '../types';
import { GoogleGenAI } from '@google/genai';
import { Bot, Loader2, RefreshCw } from 'lucide-react';
import Markdown from 'react-markdown';

interface AIReportProps {
  summary: SummaryData;
}

export function AIReport({ summary }: AIReportProps) {
  const [report, setReport] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateReport = async () => {
    setLoading(true);
    setError('');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `
Bạn là một Kế Toán Trưởng dày dạn kinh nghiệm. Hãy viết một báo cáo phân tích tình hình thực hiện các công trình sửa chữa lớn gửi cho Ban Giám Đốc dựa trên số liệu sau:

- Tổng Giá trị Khái toán: ${summary.totalEstimated.toLocaleString()} VND
- Tổng Giá trị Thực hiện: ${summary.totalExecuted.toLocaleString()} VND
- Tổng Giá trị Quyết toán: ${summary.totalSettlement.toLocaleString()} VND

Cơ cấu Khái toán theo Hạng mục:
${Object.entries(summary.estimatedByCategory).map(([k, v]) => `- ${k}: ${v.toLocaleString()} VND`).join('\n')}

Tình trạng Công trình:
${Object.entries(summary.countByStatus).map(([k, v]) => `- ${k}: ${v} công trình`).join('\n')}

Yêu cầu báo cáo:
1. Nhận xét tổng quan về tiến độ giải ngân và thực hiện các công trình sửa chữa lớn.
2. Phân tích các hạng mục chiếm tỷ trọng vốn lớn.
3. Đánh giá rủi ro về tiến độ (dựa trên trạng thái công trình) và chênh lệch giữa khái toán - thực hiện.
4. Đề xuất hành động cho tháng tới để đẩy nhanh tiến độ quyết toán.
Sử dụng format Markdown để trình bày đẹp mắt, chuyên nghiệp.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setReport(response.text || 'Không thể tạo báo cáo.');
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi gọi Gemini API.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex justify-between items-center">
        <div className="title-group">
          <h2 className="text-[24px] font-bold text-[#1e3a8a]">Báo Cáo Phân Tích AI</h2>
          <p className="text-[13px] text-[#64748b]">Tự động phân tích bởi Kế Toán Trưởng AI</p>
        </div>
        <button
          onClick={generateReport}
          disabled={loading || summary.totalEstimated === 0}
          className="bg-[#3b82f6] text-white border-none px-5 py-2.5 rounded-md font-semibold cursor-pointer flex items-center gap-2 hover:bg-blue-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {report ? 'TẠO LẠI BÁO CÁO' : 'TẠO BÁO CÁO'}
        </button>
      </header>

      <section className="bg-white rounded-lg border border-[#e2e8f0] flex flex-col overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="p-4 border-b border-[#e2e8f0] font-bold text-[14px] flex items-center">
          <Bot className="w-4 h-4 mr-2 text-[#3b82f6]" />
          Nội Dung Báo Cáo
        </div>
        <div className="p-6 flex-1">
          {error && (
            <div className="mb-4 p-3 bg-[#ef4444]/10 text-[#ef4444] rounded border border-[#ef4444]/20 text-[13px]">
              {error}
            </div>
          )}

          {summary.totalEstimated === 0 ? (
            <div className="text-center py-12 text-[#64748b] text-[13px]">
              Đang tải dữ liệu hoặc chưa có dữ liệu để phân tích.
            </div>
          ) : report ? (
            <div className="prose prose-sm max-w-none text-[#1e293b]">
              <div className="markdown-body">
                <Markdown>{report}</Markdown>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-[#64748b] text-[13px] border-2 border-dashed border-[#e2e8f0] rounded bg-[#f8fafc]">
              Nhấn nút "TẠO BÁO CÁO" để AI phân tích số liệu hiện tại của bạn.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
