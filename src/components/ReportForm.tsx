import React, { useState } from 'react';
import { Send, User, Building2, AlertTriangle, FileText, Calendar, Loader2, PlusCircle, Mail, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { SafetyReport, SafetyReportInput } from '../types';
import { analyzeSafetyReport } from '../geminiService';

const DEPARTMENTS = [
  "Cơ quan Tổng công ty - Văn phòng",
  "Cơ quan Tổng công ty - Ban Kế hoạch - Đầu tư",
  "Cơ quan Tổng công ty - Ban Tài chính",
  "Cơ quan Tổng công ty - Ban Tổ chức cán bộ - Lao động",
  "Cơ quan Tổng công ty - Ban Kỹ thuật",
  "Cơ quan Tổng công ty - Ban Không vận",
  "Cơ quan Tổng công ty - Ban An toàn - Chất lượng - An ninh",
  "Cơ quan Tổng công ty - Ban Quản lý Luồng không lưu",
  "Cơ quan Tổng công ty - Ban Quản lý dự án",
  "Cơ quan Tổng công ty - Ban Kiểm soát nội bộ",
  "Công ty Quản lý bay miền Bắc",
  "Công ty Quản lý bay miền Trung",
  "Công ty Quản lý bay miền Nam",
  "Trung tâm Quản lý luồng không lưu",
  "Trung tâm Thông báo tin tức hàng không",
  "Trung tâm Phối hợp tìm kiếm, cứu nạn hàng không",
  "Trung tâm Đào tạo - Huấn luyện nghiệp vụ Quản lý bay",
  "Khác"
];

const INCIDENT_TYPES = [
  "Dịch vụ Không lưu (ATS)",
  "Dịch vụ CNS (Thông tin, Dẫn đường, Giám sát)",
  "Dịch vụ Khí tượng (MET)",
  "Dịch vụ Tin tức hàng không (AIS)",
  "Phối hợp Tìm kiếm, cứu nạn (SAR)",
  "Kỹ thuật hạ tầng / Điện nguồn",
  "An toàn vệ sinh lao động / Cháy nổ",
  "An ninh hàng không",
  "Lỗi quy trình / Kỷ luật lao động",
  "Khác"
];

export default function ReportForm({ onSubmit }: { onSubmit: (report: SafetyReport) => void }) {
  const [formData, setFormData] = useState<Partial<SafetyReportInput>>({
    ngay_xay_ra: new Date().toISOString().split('T')[0],
    is_anonymous: false,
    don_vi: DEPARTMENTS[0],
    loai_vu_viec: INCIDENT_TYPES[0],
    chi_tiet_su_viec: "",
    email: ""
  });
  const [customDonVi, setCustomDonVi] = useState("");
  const [customLoaiVuViec, setCustomLoaiVuViec] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.chi_tiet_su_viec) return;

    setIsSubmitting(true);
    try {
      const input: SafetyReportInput = {
        id: crypto.randomUUID(),
        ngay_xay_ra: formData.ngay_xay_ra!,
        nguoi_bao_cao: formData.is_anonymous ? "Ẩn danh" : (formData.nguoi_bao_cao || "Người dùng"),
        is_anonymous: formData.is_anonymous!,
        don_vi: formData.don_vi === "Khác" ? customDonVi : formData.don_vi!,
        loai_vu_viec: formData.loai_vu_viec === "Khác" ? customLoaiVuViec : formData.loai_vu_viec!,
        chi_tiet_su_viec: formData.chi_tiet_su_viec!,
        email: formData.email,
        created_at: new Date().toISOString()
      };

      // AI Analysis
      const analysis = await analyzeSafetyReport(input);

      const newReport: SafetyReport = {
        ...input,
        analysis,
        status: 'pending'
      };

      onSubmit(newReport);
      setIsSubmitted(true);
    } catch (error: any) {
      console.error("AI Analysis Error:", error);
      
      let errorMessage = "Phân tích AI thất bại.";
      if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("invalid API key")) {
        errorMessage = "Lỗi: GEMINI_API_KEY không hợp lệ hoặc chưa được kích hoạt.";
      } else if (error.message?.includes("API_KEY_MISSING")) {
        errorMessage = "Lỗi: Hệ thống chưa nhận diện được GEMINI_API_KEY. Vui lòng thử tải lại trang (Refresh).";
      } else if (error.message?.includes("model not found")) {
        errorMessage = "Lỗi: Mô hình AI không khả dụng hoặc chưa được cấu hình đúng.";
      } else {
        errorMessage = `Lỗi AI: ${error.message || "Lỗi không xác định"}`;
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto bg-white p-12 rounded-3xl border border-slate-200 shadow-xl text-center space-y-6"
      >
        <div className="inline-flex p-6 bg-emerald-50 rounded-full text-emerald-600 mb-2">
          <CheckCircle2 className="w-16 h-16" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900">Báo cáo đã được gửi!</h2>
        <p className="text-slate-500 text-lg">
          Cảm ơn bạn đã đóng góp cho an toàn hàng không. <br/>
          Thông tin của bạn đã được tiếp nhận và sẽ được xử lý sớm nhất.
        </p>
        <div className="pt-6">
          <button 
            onClick={() => {
              setIsSubmitted(false);
              setFormData({
                ngay_xay_ra: new Date().toISOString().split('T')[0],
                is_anonymous: false,
                don_vi: DEPARTMENTS[0],
                loai_vu_viec: INCIDENT_TYPES[0],
                chi_tiet_su_viec: "",
                email: ""
              });
            }}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
          >
            Gửi báo cáo khác
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-blue-600 p-6 text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <PlusCircle className="w-6 h-6" />
            Báo cáo an toàn tự nguyện
          </h2>
          <p className="text-blue-100 text-sm mt-1">Thông tin của bạn giúp hệ thống an toàn hơn mỗi ngày.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Ngày xảy ra
              </label>
              <input 
                type="date" 
                max={new Date().toISOString().split('T')[0]}
                required
                value={formData.ngay_xay_ra}
                onChange={e => setFormData({...formData, ngay_xay_ra: e.target.value})}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              />
            </div>

            {/* Reporter */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Người báo cáo
              </label>
              <div className="flex items-center gap-4">
                <input 
                  type="text" 
                  disabled={formData.is_anonymous}
                  placeholder={formData.is_anonymous ? "Ẩn danh" : "Nhập họ tên..."}
                  value={formData.nguoi_bao_cao || ""}
                  onChange={e => setFormData({...formData, nguoi_bao_cao: e.target.value})}
                  className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none disabled:opacity-50"
                />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.is_anonymous}
                    onChange={e => setFormData({...formData, is_anonymous: e.target.checked})}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-600">Ẩn danh</span>
                </label>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                Địa chỉ Email (Để nhận phản hồi)
              </label>
              <input 
                type="email" 
                placeholder="example@email.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              />
            </div>

            {/* Department */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Đơn vị / Phòng ban
              </label>
              <div className="space-y-2">
                <select 
                  value={formData.don_vi}
                  onChange={e => setFormData({...formData, don_vi: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                >
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {formData.don_vi === "Khác" && (
                  <input 
                    type="text"
                    required
                    placeholder="Nhập tên đơn vị khác..."
                    value={customDonVi}
                    onChange={e => setCustomDonVi(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                )}
              </div>
            </div>

            {/* Incident Type */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-blue-600" />
                Loại vụ việc
              </label>
              <div className="space-y-2">
                <select 
                  value={formData.loai_vu_viec}
                  onChange={e => setFormData({...formData, loai_vu_viec: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                >
                  {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {formData.loai_vu_viec === "Khác" && (
                  <input 
                    type="text"
                    required
                    placeholder="Nhập loại vụ việc khác..."
                    value={customLoaiVuViec}
                    onChange={e => setCustomLoaiVuViec(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Chi tiết sự việc
            </label>
            <textarea 
              required
              rows={6}
              placeholder="Mô tả chi tiết sự cố, tình trạng hoặc nguy cơ bạn phát hiện..."
              value={formData.chi_tiet_su_viec}
              onChange={e => setFormData({...formData, chi_tiet_su_viec: e.target.value})}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang phân tích bằng AI...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Gửi báo cáo
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
