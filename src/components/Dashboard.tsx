import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Shield, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Activity,
  Archive
} from 'lucide-react';
import { SafetyReport } from '../types';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Dashboard({ reports, onSelectReport }: { 
  reports: SafetyReport[], 
  onSelectReport: (id: string) => void 
}) {
  const totalReports = reports.length;
  const pendingReports = reports.filter(r => r.status === 'pending').length;
  const processingReports = reports.filter(r => r.status === 'processing').length;
  const completedReports = reports.filter(r => r.status === 'completed').length;
  const archivedReports = reports.filter(r => r.status === 'archived').length;
  const highRiskReports = reports.filter(r => (r.analysis?.muc_do_rui_ro === 'A' || r.analysis?.muc_do_rui_ro === 'B') && r.status !== 'archived').length;

  // Data for charts
  const typeData = reports.reduce((acc: any[], report) => {
    const type = report.analysis?.loai_vu_viec || report.loai_vu_viec;
    const existing = acc.find(item => item.name === type);
    if (existing) existing.value += 1;
    else acc.push({ name: type, value: 1 });
    return acc;
  }, []);

  const riskData = ['A', 'B', 'C', 'D', 'E'].map(level => ({
    name: `Mức ${level}`,
    value: reports.filter(r => r.analysis?.muc_do_rui_ro === level).length
  }));

  const recentReports = reports.filter(r => r.status !== 'archived').slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard 
          title="Tổng cộng" 
          value={totalReports} 
          icon={<Shield className="w-5 h-5 text-blue-600" />} 
          color="blue"
        />
        <StatCard 
          title="Chưa tiếp nhận" 
          value={pendingReports} 
          icon={<Clock className="w-5 h-5 text-amber-600" />} 
          color="amber"
        />
        <StatCard 
          title="Đang xử lý" 
          value={processingReports} 
          icon={<Activity className="w-5 h-5 text-blue-500" />} 
          color="blue"
        />
        <StatCard 
          title="Đã xử lý" 
          value={completedReports} 
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />} 
          color="emerald"
        />
        <StatCard 
          title="Đã lưu trữ" 
          value={archivedReports} 
          icon={<Archive className="w-5 h-5 text-slate-600" />} 
          color="slate"
        />
        <StatCard 
          title="Rủi ro (A/B)" 
          value={highRiskReports} 
          icon={<AlertCircle className="w-5 h-5 text-red-600" />} 
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Risk Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Phân bổ mức độ rủi ro
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#F1F5F9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incident Types */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Phân loại vụ việc (AI Chuẩn hóa)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Báo cáo gần đây</h3>
          <button className="text-blue-600 text-sm font-semibold hover:underline">Xem tất cả</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Nội dung báo cáo</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap text-center">Ngày</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap text-center">Chỉ số rủi ro</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap text-center">Trạng thái</th>
                <th className="px-6 py-4 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentReports.map((report) => (
                <tr 
                  key={report.id} 
                  className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  onClick={() => onSelectReport(report.id)}
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{report.analysis?.tieu_de_bao_cao || "Đang phân tích..."}</div>
                    <div className="text-xs text-slate-500">{report.loai_vu_viec}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 text-center">{report.ngay_xay_ra}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getRiskColor(report.analysis?.muc_do_rui_ro)}`}>
                      {(report.analysis?.tan_suat_rui_ro || '-') + (report.analysis?.muc_do_rui_ro || '-')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${getStatusColor(report.status)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${getStatusBg(report.status)}`}></span>
                      {getStatusLabel(report.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 group-hover:text-blue-600 transition-colors">
                      Chi tiết →
                    </button>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                    Chưa có báo cáo nào được ghi nhận.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) {
  const bgColors: Record<string, string> = {
    blue: 'bg-blue-50',
    amber: 'bg-amber-50',
    emerald: 'bg-emerald-50',
    red: 'bg-red-50',
    slate: 'bg-slate-50'
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
      <div className={`p-2 rounded-lg ${bgColors[color]}`}>
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{title}</div>
        <div className="text-xl font-bold text-slate-900">{value}</div>
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

function getStatusColor(status: string) {
  switch (status) {
    case 'pending': return 'text-amber-600';
    case 'processing': return 'text-blue-600';
    case 'completed': return 'text-emerald-600';
    case 'archived': return 'text-slate-500';
    default: return 'text-slate-600';
  }
}

function getStatusBg(status: string) {
  switch (status) {
    case 'pending': return 'bg-amber-600';
    case 'processing': return 'bg-blue-600';
    case 'completed': return 'bg-emerald-600';
    case 'archived': return 'bg-slate-500';
    default: return 'bg-slate-600';
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
