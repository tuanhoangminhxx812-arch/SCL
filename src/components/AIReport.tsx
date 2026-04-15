import { useState } from 'react';
import { SummaryData } from '../types';
import { GoogleGenAI } from '@google/genai';
import { Bot, Loader2, RefreshCw, Key, Download } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
      // Ưu tiên dùng CUSTOM_GEMINI_API_KEY nếu có, nếu không thì fallback về GEMINI_API_KEY mặc định
      const apiKey = process.env.CUSTOM_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      
      if (!apiKey || apiKey === 'undefined' || apiKey === '""' || apiKey.includes('AIzaSyBmRE')) {
        throw new Error('Chưa cấu hình Gemini API Key. Vui lòng thêm biến CUSTOM_GEMINI_API_KEY trong phần Settings > Secrets.');
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
Bạn là một Kế Toán Trưởng dày dạn kinh nghiệm. Hãy viết một báo cáo phân tích tình hình thực hiện các công trình sửa chữa lớn gửi cho Ban Giám Đốc dựa trên số liệu sau.

YÊU CẦU BẮT BUỘC:
1. Văn phong doanh nghiệp trang trọng, chuyên nghiệp, khách quan.
2. TUYỆT ĐỐI KHÔNG sai lỗi chính tả, ngữ pháp tiếng Việt.
3. BẮT BUỘC sử dụng BẢNG (Markdown Table) để trình bày số liệu cho rõ ràng, trực quan.
4. Bố cục chia phần rõ ràng theo đúng cấu trúc bên dưới.

SỐ LIỆU ĐẦU VÀO:
- Tổng Giá trị Khái toán: ${summary.totalEstimated.toLocaleString('vi-VN')} VNĐ
- Tổng Giá trị Thực hiện: ${summary.totalExecuted.toLocaleString('vi-VN')} VNĐ
- Tổng Giá trị Quyết toán: ${summary.totalSettlement.toLocaleString('vi-VN')} VNĐ

Dữ liệu theo Hạng mục (Khái toán):
${Object.entries(summary.estimatedByCategory).map(([k, v]) => `- ${k}: ${v.toLocaleString('vi-VN')} VNĐ`).join('\n')}

Tình trạng Công trình:
${Object.entries(summary.countByStatus).map(([k, v]) => `- ${k}: ${v} công trình`).join('\n')}

CẤU TRÚC BÁO CÁO YÊU CẦU (Hãy viết theo đúng format này):

# BÁO CÁO TÌNH HÌNH THỰC HIỆN CÔNG TRÌNH SỬA CHỮA LỚN
**Kính gửi:** Ban Giám Đốc
**Người lập:** Kế Toán Trưởng

## I. TỔNG QUAN TÀI CHÍNH
[Tạo 1 bảng Markdown thể hiện 4 cột: Chỉ tiêu, Giá trị (VNĐ), Tỷ lệ % Thực hiện/Khái toán, Tỷ lệ % Quyết toán/Khái toán. Thêm nhận xét ngắn gọn dưới bảng về tiến độ giải ngân tổng thể]

## II. PHÂN TÍCH THEO HẠNG MỤC & TRẠNG THÁI
[Tạo 1 bảng Markdown liệt kê các hạng mục và giá trị khái toán tương ứng, sắp xếp từ cao xuống thấp]
[Nhận xét về các hạng mục chiếm tỷ trọng vốn lớn nhất]
[Tạo 1 bảng Markdown thống kê số lượng công trình theo từng trạng thái (Đang thi công, Lập kế hoạch...)]
[Nhận xét về tình trạng chung của các công trình]

## III. ĐÁNH GIÁ RỦI RO & ĐỀ XUẤT
[Chỉ ra các điểm nghẽn, rủi ro chậm tiến độ hoặc vượt dự toán nếu có dựa trên số liệu]
[Gạch đầu dòng các đề xuất hành động cụ thể cho tháng tới để đẩy nhanh tiến độ và tối ưu chi phí]
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setReport(response.text || 'Không thể tạo báo cáo.');
    } catch (err: any) {
      const errorMessage = err.message || '';
      if (errorMessage.includes('leaked') || errorMessage.includes('PERMISSION_DENIED')) {
        setError('Mã API Key của bạn đã bị Google khóa vì phát hiện bị lộ (có thể do bạn đã dán nó vào khung chat hoặc nơi công khai). Vui lòng vào https://aistudio.google.com/app/apikey tạo một mã MỚI HOÀN TOÀN, sau đó dán vào biến CUSTOM_GEMINI_API_KEY trong phần Settings > Secrets (Tuyệt đối không dán vào khung chat nữa).');
      } else {
        setError(errorMessage || 'Có lỗi xảy ra khi gọi Gemini API.');
      }
    } finally {
      setLoading(false);
    }
  };

  const exportToWord = () => {
    const content = document.getElementById('report-content')?.innerHTML;
    if (!content) return;

    const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Báo Cáo Phân Tích</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #000000; padding: 8px; text-align: left; vertical-align: middle; }
          th { background-color: #f2f2f2; font-weight: bold; }
          h1 { font-size: 16pt; color: #1e3a8a; text-align: center; text-transform: uppercase; margin-bottom: 20px; }
          h2 { font-size: 14pt; color: #1e3a8a; margin-top: 20px; margin-bottom: 10px; }
          p { margin-bottom: 10px; }
          ul { margin-bottom: 10px; }
          li { margin-bottom: 5px; }
        </style>
      </head>
      <body>
    `;
    const footer = "</body></html>";
    const sourceHTML = header + content + footer;

    const blob = new Blob(['\ufeff', sourceHTML], {
      type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Bao_Cao_Phan_Tich_Cong_Trinh.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex justify-between items-center">
        <div className="title-group">
          <h2 className="text-[24px] font-bold text-[#1e3a8a]">Báo Cáo Phân Tích AI</h2>
          <p className="text-[13px] text-[#64748b]">Tự động phân tích bởi Kế Toán Trưởng AI</p>
        </div>
        <div className="flex gap-3">
          {report && (
            <button
              onClick={exportToWord}
              className="bg-white text-[#1e3a8a] border border-[#1e3a8a] px-5 py-2.5 rounded-md font-semibold cursor-pointer flex items-center gap-2 hover:bg-[#f8fafc] transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              XUẤT WORD
            </button>
          )}
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
        </div>
      </header>

      <section className="bg-white rounded-lg border border-[#e2e8f0] flex flex-col overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="p-4 border-b border-[#e2e8f0] font-bold text-[14px] flex items-center">
          <Bot className="w-4 h-4 mr-2 text-[#3b82f6]" />
          Nội Dung Báo Cáo
        </div>
        <div className="p-6 flex-1">
          {error && (
            <div className="mb-4 p-4 bg-[#ef4444]/10 text-[#ef4444] rounded border border-[#ef4444]/20 text-[13px] flex items-start gap-3">
              <Key className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block mb-1 text-[14px]">Lỗi xác thực API Key</strong>
                {error}
              </div>
            </div>
          )}

          {summary.totalEstimated === 0 ? (
            <div className="text-center py-12 text-[#64748b] text-[13px]">
              Đang tải dữ liệu hoặc chưa có dữ liệu để phân tích.
            </div>
          ) : report ? (
            <div className="prose prose-sm max-w-none text-[#1e293b]">
              <div id="report-content" className="markdown-body">
                <Markdown remarkPlugins={[remarkGfm]}>{report}</Markdown>
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
