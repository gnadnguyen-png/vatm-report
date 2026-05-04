import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronLeft, 
  Download, 
  ShieldAlert, 
  ShieldCheck, 
  MessageSquare, 
  Archive, 
  CheckCircle,
  AlertTriangle,
  Info,
  User,
  Calendar,
  Building2,
  FileText,
  Printer,
  Mail,
  Loader2,
  Clock,
  Activity,
  Check,
  CheckCircle2
} from 'lucide-react';
import { SafetyReport } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ReportDetail({ report, onBack, onUpdate, isExportMode = false }: { 
  report: SafetyReport, 
  onBack: () => void,
  onUpdate: (report: SafetyReport) => void,
  isExportMode?: boolean
}) {
  const [response, setResponse] = useState(report.response || "");
  const [isSending, setIsSending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setIsStatusOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sendEmail = async (subject: string, html: string, attachments?: { filename: string, content: string }[]) => {
    if (!report.email) return;
    setIsSending(true);
    setEmailError(null);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: report.email,
          subject,
          html,
          attachments
        })
      });
      
      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to send email');
        } else {
          const textError = await res.text();
          console.error("Non-JSON error response:", textError);
          throw new Error('Server error: Yêu cầu quá lớn hoặc máy chủ gặp sự cố. Vui lòng thử lại.');
        }
      }
    } catch (error: any) {
      console.error('Error sending email:', error);
      setEmailError(error.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveResponse = async () => {
    // Automatically set to completed when a response is saved/sent
    const newStatus = 'completed';
    handleStatusChange(newStatus);
    
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    
    if (report.email) {
      // Generate PDF for attachment
      let pdfBase64 = "";
      if (reportRef.current) {
        try {
          setIsGenerating(true);
          // Small delay to allow React to re-render and hide the section
          await new Promise(resolve => setTimeout(resolve, 100));

          const canvas = await html2canvas(reportRef.current, {
            scale: 1.2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 1200 // Ensure consistent width for capture
          });
          const imgData = canvas.toDataURL('image/jpeg', 0.6);
          const pdf = new jsPDF('p', 'mm', 'a4', true);
          
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const margin = 10; // 10mm margin
          const contentWidth = pdfWidth - (2 * margin);
          const imgContentHeight = (canvas.height * contentWidth) / canvas.width;
          
          let heightLeft = imgContentHeight;
          let position = margin; // Start with top margin

          // Add first page
          pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, imgContentHeight, undefined, 'FAST');
          heightLeft -= (pageHeight - 2 * margin);

          // Add subsequent pages if needed
          while (heightLeft > 0) {
            position = heightLeft - imgContentHeight + margin;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, imgContentHeight, undefined, 'FAST');
            heightLeft -= (pageHeight - 2 * margin);
          }
          
          pdfBase64 = pdf.output('datauristring').split(',')[1];
        } catch (err) {
          console.error("Failed to generate PDF for attachment:", err);
        } finally {
          setIsGenerating(false);
        }
      }

      const statusLabel = 'Hoàn thành';
      
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #2563eb;">Cập nhật phản hồi báo cáo an toàn</h2>
          <p>Xin chào,</p>
          <p>Báo cáo của bạn về vụ việc: <strong>${report.analysis?.tieu_de_bao_cao || report.loai_vu_viec}</strong> đã có cập nhật mới.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Trạng thái hiện tại:</strong> <span style="color: #2563eb; font-weight: bold;">${statusLabel}</span></p>
            <p><strong>Phản hồi từ hệ thống:</strong></p>
            <p style="white-space: pre-wrap;">${response || "Chúng tôi đang tích cực xem xét và xử lý báo cáo của bạn."}</p>
          </div>
          <p>Chúng tôi có đính kèm bản PDF chi tiết báo cáo và phân tích AI trong email này để bạn tiện theo dõi.</p>
          <p>Trân trọng,<br/>Đội ngũ An toàn</p>
        </div>
      `;
      
      const attachments = pdfBase64 ? [{
        filename: `Safety_Report_${report.id.slice(0, 8)}.pdf`,
        content: pdfBase64
      }] : undefined;

      await sendEmail(`[Cập nhật] Phản hồi báo cáo an toàn: ${report.id.slice(0, 8)}`, html, attachments);
    }
  };

  const handleRequestInfo = async () => {
    const newStatus = report.status === 'pending' ? 'processing' : report.status;
    handleStatusChange(newStatus);
    
    if (report.email) {
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #2563eb;">Yêu cầu bổ sung thông tin báo cáo</h2>
          <p>Xin chào,</p>
          <p>Chúng tôi đã nhận được báo cáo của bạn về vụ việc: <strong>${report.analysis?.tieu_de_bao_cao || report.loai_vu_viec}</strong>.</p>
          <div style="background-color: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p><strong>Yêu cầu từ hệ thống:</strong></p>
            <p>Để có thể phân tích và xử lý chính xác hơn, vui lòng bổ sung thêm các bằng chứng cụ thể (hình ảnh, tài liệu, hoặc mô tả chi tiết hơn) liên quan đến sự việc này.</p>
            ${response ? `<p><strong>Ghi chú thêm từ điều tra viên:</strong> ${response}</p>` : ''}
          </div>
          <p>Bạn có thể gửi thông tin bổ sung bằng cách phản hồi lại email này hoặc truy cập hệ thống.</p>
          <p>Trân trọng,<br/>Đội ngũ An toàn</p>
        </div>
      `;
      
      await sendEmail(`[Yêu cầu] Bổ sung thông tin báo cáo: ${report.id.slice(0, 8)}`, html);
      if (!emailError) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    }
  };

  const handleStatusChange = (newStatus: SafetyReport['status']) => {
    onUpdate({ ...report, status: newStatus, response: response || report.response });
  };

  const exportPDF = async () => {
    if (!reportRef.current) return;
    
    setIsGenerating(true);
    // Allow UI to update
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc',
        windowWidth: 1200
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      const pdf = new jsPDF('p', 'mm', 'a4', true);
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pdfWidth - (2 * margin);
      const imgContentHeight = (canvas.height * contentWidth) / canvas.width;
      
      let heightLeft = imgContentHeight;
      let position = margin;

      // Add first page
      pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, imgContentHeight, undefined, 'FAST');
      heightLeft -= (pageHeight - 2 * margin);

      // Add subsequent pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgContentHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, imgContentHeight, undefined, 'FAST');
        heightLeft -= (pageHeight - 2 * margin);
      }

      pdf.save(`Safety_Report_${report.id.slice(0, 8)}.pdf`);
    } catch (err) {
      console.error("Export PDF error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const analysis = report.analysis;

  return (
    <div className={`space-y-6 ${isExportMode ? 'pb-0' : 'pb-20'}`}>
      {/* Top Actions */}
      {!isExportMode && (
        <div className="flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-medium transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Quay lại danh sách
          </button>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={exportPDF}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-all shadow-sm group"
              title="Xuất PDF"
            >
              <Printer className="w-5 h-5 group-hover:text-blue-600 transition-colors" />
            </button>
            
            <div className="h-8 w-px bg-slate-200 mx-1"></div>
            
            {/* Status Dropdown */}
            <div className="relative" ref={statusRef}>
              <button 
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all border shadow-sm ${getStatusBadgeClass(report.status)}`}
              >
                {getStatusIcon(report.status)}
                {isStatusOpen ? 'Trạng thái' : getStatusLabel(report.status)}
              </button>

              <AnimatePresence>
                {isStatusOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden py-2"
                  >
                    <StatusOption 
                      active={report.status === 'pending'} 
                      label="Đang chờ" 
                      onClick={() => { handleStatusChange('pending'); setIsStatusOpen(false); }}
                      icon={<Clock className="w-4 h-4 text-amber-500" />}
                    />
                    <StatusOption 
                      active={report.status === 'processing'} 
                      label="Đang xử lý" 
                      onClick={() => { handleStatusChange('processing'); setIsStatusOpen(false); }}
                      icon={<Activity className="w-4 h-4 text-blue-500" />}
                    />
                    <StatusOption 
                      active={report.status === 'completed'} 
                      label="Hoàn thành" 
                      onClick={() => { handleStatusChange('completed'); setIsStatusOpen(false); }}
                      icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    />
                    <div className="h-px bg-slate-100 my-1"></div>
                    <StatusOption 
                      active={report.status === 'archived'} 
                      label="Lưu trữ" 
                      onClick={() => { handleStatusChange('archived'); setIsStatusOpen(false); }}
                      icon={<Archive className="w-4 h-4 text-slate-500" />}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => handleStatusChange('archived')}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Lưu trữ"
            >
              <Archive className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div ref={reportRef} className={`grid grid-cols-1 ${isExportMode ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-8`} style={{ color: '#0f172a', backgroundColor: '#f8fafc' }}>
        {/* Left Column: Original Report & AI Summary */}
        <div className={`${isExportMode ? 'space-y-4' : 'lg:col-span-2 space-y-8'}`}>
          {/* AI Summary Header */}
          <div className={`${isExportMode ? 'p-6' : 'p-8'} rounded-3xl border shadow-sm ${isExportMode ? 'space-y-4' : 'space-y-6'}`} style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={getRiskStyle(analysis?.muc_do_rui_ro)}>
                    Rủi ro {analysis?.muc_do_rui_ro || '-'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                    Tần suất {analysis?.tan_suat_rui_ro || '-'}
                  </span>
                </div>
                <h2 className={`${isExportMode ? 'text-xl' : 'text-2xl'} font-bold leading-tight mt-2`} style={{ color: '#0f172a' }}>
                  {analysis?.tieu_de_bao_cao || "Đang phân tích báo cáo..."}
                </h2>
              </div>
              <div className={`${isExportMode ? 'p-2' : 'p-3'} rounded-2xl`} style={{ backgroundColor: '#eff6ff' }}>
                <ShieldCheck className={`${isExportMode ? 'w-6 h-6' : 'w-8 h-8'}`} style={{ color: '#2563eb' }} />
              </div>
            </div>

            {analysis?.classification_warning && (
              <div className="p-4 rounded-2xl flex gap-3 text-sm italic" style={{ backgroundColor: '#fffbeb', borderColor: '#fef3c7', color: '#b45309' }}>
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p>{analysis.classification_warning}</p>
              </div>
            )}

            <div className={`${isExportMode ? 'space-y-2' : 'space-y-4'}`}>
              <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>Tóm tắt khử định danh</h3>
              <p className={`leading-relaxed ${isExportMode ? 'text-base' : 'text-lg'} italic`} style={{ color: '#334155' }}>
                "{analysis?.tom_tat_an_danh || "Hệ thống AI đang xử lý dữ liệu..."}"
              </p>
            </div>

            <div className={`grid grid-cols-2 ${isExportMode ? 'md:grid-cols-2' : 'md:grid-cols-4'} gap-6 pt-6 border-t`} style={{ borderTopColor: '#f1f5f9' }}>
              <InfoItem icon={<Calendar />} label="Ngày xảy ra" value={report.ngay_xay_ra} />
              <InfoItem icon={<Building2 />} label="Đơn vị" value={report.don_vi} />
              <InfoItem icon={<User />} label="Người báo cáo" value={report.is_anonymous ? "Ẩn danh" : report.nguoi_bao_cao} />
              {report.email && <InfoItem icon={<Mail />} label="Email" value={report.email} />}
              <InfoItem icon={<FileText />} label="Loại vụ việc" value={analysis?.loai_vu_viec || report.loai_vu_viec} />
            </div>
          </div>

          {/* Detailed Content */}
          <div className={`${isExportMode ? 'p-6' : 'p-8'} rounded-3xl border shadow-sm ${isExportMode ? 'space-y-4' : 'space-y-8'}`} style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
            <section className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#1e293b' }}>
                <FileText className="w-5 h-5" style={{ color: '#2563eb' }} />
                Chi tiết sự việc (Gốc)
              </h3>
              <div className={`${isExportMode ? 'p-4' : 'p-6'} rounded-2xl text-slate-700 leading-relaxed whitespace-pre-wrap border`} style={{ backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }}>
                {report.chi_tiet_su_viec}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#1e293b' }}>
                <ShieldAlert className="w-5 h-5" style={{ color: '#dc2626' }} />
                Phân tích mối nguy gốc rễ
              </h3>
              <div style={{ backgroundColor: 'rgba(254, 242, 242, 0.3)', borderColor: '#fee2e2' }} className={`${isExportMode ? 'p-4' : 'p-6'} rounded-2xl text-slate-800 border`}>
                {analysis?.moi_nguy_goc_re || "Đang phân tích..."}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#1e293b' }}>
                <CheckCircle className="w-5 h-5" style={{ color: '#059669' }} />
                Đề xuất xử lý & Phòng ngừa
              </h3>
              <div style={{ backgroundColor: 'rgba(236, 253, 245, 0.3)', borderColor: '#d1fae5' }} className={`${isExportMode ? 'p-4' : 'p-6'} rounded-2xl text-slate-800 border`}>
                {analysis?.de_xuat_xu_ly || "Đang phân tích..."}
              </div>
            </section>
          </div>
        </div>

        {/* Right Column: SHELL Model & Response */}
        <div className={`${isExportMode ? 'space-y-4' : 'space-y-8'}`}>
          {/* SHELL Model Analysis */}
          <div className={`bg-[#1A1C1E] text-white ${isExportMode ? 'p-6' : 'p-8'} rounded-3xl shadow-xl space-y-6`}>
            <h3 style={{ borderBottomColor: 'rgba(255, 255, 255, 0.1)' }} className="text-lg font-bold flex items-center gap-2 border-b pb-4">
              <Activity className="w-5 h-5 text-blue-400" />
              Mô hình SHELL
            </h3>
            
            <div className={`grid ${isExportMode ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
              <ShellItem label="Software" value={analysis?.shell_analysis?.software} color="blue" />
              <ShellItem label="Hardware" value={analysis?.shell_analysis?.hardware} color="emerald" />
              <ShellItem label="Environment" value={analysis?.shell_analysis?.environment} color="amber" />
              <ShellItem label="Liveware (Self)" value={analysis?.shell_analysis?.liveware} color="purple" />
              <ShellItem label="Liveware (Other)" value={analysis?.shell_analysis?.liveware_other} color="rose" />
            </div>
          </div>

          {/* Action & Response */}
          {!isExportMode && !isGenerating && (
            <div className="p-8 rounded-3xl border shadow-sm space-y-6" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#1e293b' }}>
                <MessageSquare className="w-5 h-5" style={{ color: '#2563eb' }} />
                Phản hồi & Xử lý
              </h3>
              
              <div className="space-y-4">
                {saveSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-xl flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Đã lưu phản hồi và cập nhật trạng thái thành công!
                  </div>
                )}
                {emailError && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {emailError}
                  </div>
                )}
                <textarea 
                  rows={4}
                  placeholder="Nhập nội dung phản hồi hoặc ghi chú xử lý..."
                  value={response}
                  onChange={e => setResponse(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                />
                
                <div className="grid grid-cols-1 gap-2">
                  <button 
                    onClick={handleSaveResponse}
                    disabled={isSending}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Lưu phản hồi
                  </button>
                  <button 
                    onClick={handleRequestInfo}
                    disabled={isSending || !report.email}
                    className="w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Yêu cầu bổ sung thông tin
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5" style={{ color: '#94a3b8' }}>
        <span className="scale-75">{icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-sm font-semibold" style={{ color: '#334155' }}>{value}</div>
    </div>
  );
}

function ShellItem({ label, value, color }: { label: string, value?: string, color: string }) {
  const colors: Record<string, string> = {
    blue: '#60a5fa',
    emerald: '#34d399',
    amber: '#fbbf24',
    purple: '#a78bfa',
    rose: '#fb7185'
  };

  return (
    <div className="space-y-1">
      <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: colors[color] }}>{label}</div>
      <div className="text-sm leading-relaxed" style={{ color: '#cbd5e1' }}>{value || "N/A"}</div>
    </div>
  );
}

function StatusOption({ active, label, onClick, icon }: { active: boolean, label: string, onClick: () => void, icon: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full px-4 py-2.5 text-sm flex items-center justify-between hover:bg-slate-50 transition-colors ${active ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600'}`}
    >
      <div className="flex items-center gap-3">
        {icon}
        {label}
      </div>
      {active && <Check className="w-4 h-4" />}
    </button>
  );
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'pending': return <Clock className="w-4 h-4" />;
    case 'processing': return <Activity className="w-4 h-4" />;
    case 'completed': return <CheckCircle2 className="w-4 h-4" />;
    case 'archived': return <Archive className="w-4 h-4" />;
    default: return <Info className="w-4 h-4" />;
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'processing': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'archived': return 'bg-slate-50 text-slate-600 border-slate-200';
    default: return 'bg-slate-50 text-slate-600';
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'pending': return 'Chờ xử lý';
    case 'processing': return 'Đang xử lý';
    case 'completed': return 'Hoàn thành';
    case 'archived': return 'Đã lưu trữ';
    default: return status;
  }
}

function getRiskStyle(level?: string) {
  switch (level) {
    case 'A': return { backgroundColor: '#fee2e2', color: '#b91c1c' };
    case 'B': return { backgroundColor: '#ffedd5', color: '#c2410c' };
    case 'C': return { backgroundColor: '#fef3c7', color: '#b45309' };
    case 'D': return { backgroundColor: '#dbeafe', color: '#1d4ed8' };
    case 'E': return { backgroundColor: '#d1fae5', color: '#047857' };
    default: return { backgroundColor: '#f1f5f9', color: '#334155' };
  }
}

import { motion, AnimatePresence } from 'motion/react';
