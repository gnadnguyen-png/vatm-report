import React, { useState, useRef } from 'react';
import { 
  Search, 
  Filter, 
  ChevronRight, 
  MoreVertical, 
  Download, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Activity, 
  Archive,
  Check
} from 'lucide-react';
import { SafetyReport } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ReportDetail from './ReportDetail';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function ReportList({ reports, onSelectReport }: { 
  reports: SafetyReport[], 
  onSelectReport: (id: string) => void 
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const hiddenReportRef = useRef<HTMLDivElement>(null);
  const [reportToExport, setReportToExport] = useState<SafetyReport | null>(null);
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);

  const handleStatusChange = async (reportId: string, newStatus: SafetyReport['status']) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), { status: newStatus });
    } catch (error) {
      console.error("Error updating status:", error);
    }
    setOpenStatusId(null);
  };

  const handleCompleteAll = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn đánh dấu hoàn thành cho tất cả các báo cáo đang hiển thị?")) return;
    try {
      const updates = filteredReports
        .filter(r => r.status !== 'completed')
        .map(r => updateDoc(doc(db, 'reports', r.id), { status: 'completed' as const }));
      await Promise.all(updates);
    } catch (error) {
      console.error("Error completing all reports:", error);
    }
  };

  const exportPDF = async (report: SafetyReport) => {
    // We need to render the report detail temporarily to capture it
    // This is handled by setting reportToExport and using a hidden div
    setReportToExport(report);
    
    // Wait for React to render the hidden component
    setTimeout(async () => {
      const element = document.getElementById(`export-container-${report.id}`);
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Force content to fit on one page
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`Safety_Report_${report.id.slice(0, 8)}.pdf`);
      setReportToExport(null);
    }, 100);
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = (report.analysis?.tieu_de_bao_cao || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.chi_tiet_su_viec.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || report.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tiêu đề hoặc nội dung..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={handleCompleteAll}
            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl border border-transparent hover:border-emerald-200 transition-all"
            title="Hoàn thành tất cả"
          >
            <CheckCircle2 className="w-5 h-5" />
          </button>

          <div className="h-8 w-px bg-slate-200 mx-1"></div>

          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <Filter className="w-4 h-4" />
            Lọc:
          </div>
          <select 
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Tất cả</option>
            <option value="pending">Chờ xử lý</option>
            <option value="processing">Đang xử lý</option>
            <option value="completed">Hoàn thành</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Nội dung báo cáo</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap text-center">Đơn vị</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap text-center w-32">Chỉ số rủi ro</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap text-center w-40">Trạng thái</th>
                <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.map((report) => (
                <tr 
                  key={report.id} 
                  className="hover:bg-slate-50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {report.analysis?.tieu_de_bao_cao || "Đang phân tích..."}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                      <span>{report.ngay_xay_ra}</span>
                      <span>•</span>
                      <span>{report.is_anonymous ? "Ẩn danh" : report.nguoi_bao_cao}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-slate-600 font-medium">{report.don_vi}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getRiskColor(report.analysis?.muc_do_rui_ro)}`}>
                      {(report.analysis?.tan_suat_rui_ro || '-') + (report.analysis?.muc_do_rui_ro || '-')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="relative inline-block">
                      <button 
                        onClick={() => setOpenStatusId(openStatusId === report.id ? null : report.id)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all hover:ring-2 hover:ring-offset-1 flex items-center gap-1.5 ${getStatusBadgeClass(report.status)}`}
                      >
                        {getStatusIcon(report.status)}
                        {getStatusLabel(report.status)}
                      </button>

                      <AnimatePresence>
                        {openStatusId === report.id && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="fixed md:absolute mt-2 md:right-0 left-1/2 -translate-x-1/2 md:translate-x-0 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl z-[100] py-2 overflow-hidden"
                          >
                            <StatusOption 
                              active={report.status === 'pending'} 
                              label="Đang chờ" 
                              onClick={() => handleStatusChange(report.id, 'pending')}
                              icon={<Clock className="w-4 h-4 text-amber-500" />}
                            />
                            <StatusOption 
                              active={report.status === 'processing'} 
                              label="Đang xử lý" 
                              onClick={() => handleStatusChange(report.id, 'processing')}
                              icon={<Activity className="w-4 h-4 text-blue-500" />}
                            />
                            <StatusOption 
                              active={report.status === 'completed'} 
                              label="Hoàn thành" 
                              onClick={() => handleStatusChange(report.id, 'completed')}
                              icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                            />
                            <StatusOption 
                              active={report.status === 'archived'} 
                              label="Lưu trữ" 
                              onClick={() => handleStatusChange(report.id, 'archived')}
                              icon={<Archive className="w-4 h-4 text-slate-500" />}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {openStatusId === report.id && (
                        <div 
                          className="fixed inset-0 z-[90]" 
                          onClick={() => setOpenStatusId(null)}
                        ></div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => onSelectReport(report.id)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => exportPDF(report)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                        title="Tải xuống PDF"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Search className="w-12 h-12 opacity-20" />
                      <p className="italic">Không tìm thấy báo cáo nào phù hợp.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {reportToExport && <ExportContainer report={reportToExport} />}
    </div>
  );
}

{/* Hidden container for PDF export */}
function ExportContainer({ report }: { report: SafetyReport }) {
  return (
    <div className="fixed left-[-9999px] top-0">
      <div id={`export-container-${report.id}`} style={{ width: '800px', padding: '20px' }}>
        <ReportDetail 
          report={report} 
          onBack={() => {}} 
          onUpdate={() => {}} 
          isExportMode={true}
        />
      </div>
    </div>
  );
}

function getRiskColor(level?: string) {
  switch (level) {
    case 'A': return 'bg-red-100 text-red-700';
    case 'B': return 'bg-orange-100 text-orange-700';
    case 'C': return 'bg-amber-100 text-amber-700';
    case 'D': return 'bg-blue-100 text-blue-700';
    case 'E': return 'bg-emerald-100 text-emerald-700';
    default: return 'bg-slate-100 text-slate-700';
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'pending': return 'bg-amber-50 text-amber-700 border border-amber-200 ring-amber-500';
    case 'processing': return 'bg-blue-50 text-blue-700 border border-blue-200 ring-blue-500';
    case 'completed': return 'bg-emerald-50 text-emerald-700 border border-emerald-200 ring-emerald-500';
    case 'archived': return 'bg-slate-50 text-slate-600 border border-slate-200 ring-slate-500';
    default: return 'bg-slate-50 text-slate-600 ring-slate-400';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'pending': return <Clock className="w-3.5 h-3.5" />;
    case 'processing': return <Activity className="w-3.5 h-3.5" />;
    case 'completed': return <CheckCircle2 className="w-3.5 h-3.5" />;
    case 'archived': return <Archive className="w-3.5 h-3.5" />;
    default: return null;
  }
}

function StatusOption({ active, label, onClick, icon }: { active: boolean, label: string, onClick: () => void, icon: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full px-4 py-2.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${active ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600'}`}
    >
      <div className="flex items-center gap-2.5">
        {icon}
        {label}
      </div>
      {active && <Check className="w-3.5 h-3.5" />}
    </button>
  );
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
