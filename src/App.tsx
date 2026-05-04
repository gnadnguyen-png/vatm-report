import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  ShieldCheck, 
  History, 
  Menu, 
  X,
  Bell,
  Search,
  Settings,
  Archive,
  Lock
} from 'lucide-react';
import { SafetyReport } from './types';
import ReportForm from './components/ReportForm';
import Dashboard from './components/Dashboard';
import ReportList from './components/ReportList';
import ReportDetail from './components/ReportDetail';
import Login from './components/Login';
import Portal from './components/Portal';
import { db } from './lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  setDoc, 
  doc,
  updateDoc
} from 'firebase/firestore';

export default function App() {
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'new' | 'archive'>('new');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'none' | 'reporter' | 'handler'>('none');

  // Sync with Firestore
  useEffect(() => {
    const q = query(collection(db, 'reports'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData: SafetyReport[] = [];
      snapshot.forEach((doc) => {
        reportsData.push(doc.data() as SafetyReport);
      });
      setReports(reportsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSelectReport = async (id: string | null) => {
    setSelectedReportId(id);
    if (id) {
      const report = reports.find(r => r.id === id);
      // Auto move to processing if current status is pending
      if (report && report.status === 'pending') {
        try {
          await updateDoc(doc(db, 'reports', id), { status: 'processing' });
        } catch (error) {
          console.error("Auto-status update failed:", error);
        }
      }
    }
  };

  const handleAddReport = async (newReport: SafetyReport) => {
    try {
      await setDoc(doc(db, 'reports', newReport.id), newReport);
      if (userRole === 'handler') {
        setActiveTab('reports');
      }
    } catch (error) {
      console.error("Error adding report to Firestore:", error);
      alert("Không thể lưu báo cáo vào hệ thống. Vui lòng thử lại.");
    }
  };

  const handleUpdateReport = async (updatedReport: SafetyReport) => {
    try {
      await updateDoc(doc(db, 'reports', updatedReport.id), {
        status: updatedReport.status,
        analysis: updatedReport.analysis,
        response: updatedReport.response || null
      });
    } catch (error) {
      console.error("Error updating report in Firestore:", error);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('none');
    setActiveTab('new');
  };

  const handleRoleSelection = (role: 'reporter' | 'handler') => {
    setUserRole(role);
    if (role === 'handler') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('new');
    }
  };

  if (userRole === 'none') {
    return <Portal onSelectRole={handleRoleSelection} />;
  }

  const selectedReport = reports.find(r => r.id === selectedReportId);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-slate-900 font-sans">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-[#1A1C1E] text-white transition-all duration-300 flex flex-col fixed h-full z-50`}
      >
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="bg-blue-600 p-2 rounded-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          {isSidebarOpen && (
            <span className="font-bold text-lg tracking-tight">SafetyAI</span>
          )}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2">
          {userRole === 'handler' && (
            <>
              <NavItem 
                icon={<LayoutDashboard className="w-5 h-5" />} 
                label="Dashboard" 
                active={activeTab === 'dashboard'} 
                collapsed={!isSidebarOpen}
                onClick={() => { setActiveTab('dashboard'); handleSelectReport(null); }}
              />
              <NavItem 
                icon={<FileText className="w-5 h-5" />} 
                label="Báo cáo đang xử lý" 
                active={activeTab === 'reports'} 
                collapsed={!isSidebarOpen}
                onClick={() => { setActiveTab('reports'); handleSelectReport(null); }}
                badge={reports.filter(r => r.status === 'pending').length}
              />
              <NavItem 
                icon={<Archive className="w-5 h-5" />} 
                label="Kho lưu trữ" 
                active={activeTab === 'archive'} 
                collapsed={!isSidebarOpen}
                onClick={() => { setActiveTab('archive'); handleSelectReport(null); }}
              />
            </>
          )}

          {userRole === 'reporter' && (
            <NavItem 
              icon={<PlusCircle className="w-5 h-5" />} 
              label="Gửi báo cáo" 
              active={activeTab === 'new'} 
              collapsed={!isSidebarOpen}
              onClick={() => { setActiveTab('new'); handleSelectReport(null); }}
            />
          )}

          <div className="pt-8 space-y-2">
            <div className="h-px bg-white/10 my-4"></div>
            
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-4 p-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all text-sm font-medium"
            >
              <History className="w-5 h-5" />
              {!isSidebarOpen ? '' : 'Màn hình chính'}
            </button>

            {isAuthenticated && (
              <button 
                onClick={() => setIsAuthenticated(false)}
                className="w-full flex items-center gap-4 p-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium"
              >
                <X className="w-5 h-5" />
                {!isSidebarOpen ? '' : 'Đăng xuất Admin'}
              </button>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-slate-800 capitalize">
              {activeTab === 'dashboard' ? 'Tổng quan an toàn' : 
               activeTab === 'reports' ? (selectedReportId ? 'Chi tiết báo cáo' : 'Báo cáo đang xử lý') : 
               activeTab === 'archive' ? 'Kho lưu trữ báo cáo' :
               'Gửi báo cáo mới'}
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            {userRole === 'handler' && isAuthenticated && (
              <div className="relative hidden md:block">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm báo cáo..." 
                  className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm w-64 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            )}
            <div className="flex items-center gap-3">
              {userRole === 'handler' && isAuthenticated && (
                <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
              )}
              <div 
                className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs border border-blue-200 transition-colors"
                title={userRole === 'handler' ? "Người xử lý" : "Người báo cáo"}
              >
                {userRole === 'handler' ? 'AD' : 'RP'}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-400">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p>Đang nạp dữ liệu an toàn...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
            {activeTab === 'new' && userRole === 'reporter' && (
              <motion.div
                key="new-report"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <ReportForm onSubmit={handleAddReport} />
              </motion.div>
            )}

            {userRole === 'handler' && (
              <>
                {activeTab === 'dashboard' && (
                  !isAuthenticated ? <Login key="login" onLogin={setIsAuthenticated} /> :
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Dashboard 
                      reports={reports} 
                      onSelectReport={handleSelectReport} 
                    />
                  </motion.div>
                )}

                {activeTab === 'reports' && !selectedReportId && (
                  !isAuthenticated ? <Login key="login" onLogin={setIsAuthenticated} /> :
                  <motion.div
                    key="reports-list"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <ReportList 
                      reports={reports.filter(r => r.status !== 'archived')} 
                      onSelectReport={handleSelectReport} 
                    />
                  </motion.div>
                )}

                {activeTab === 'archive' && !selectedReportId && (
                  !isAuthenticated ? <Login key="login" onLogin={setIsAuthenticated} /> :
                  <motion.div
                    key="archive-list"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <ReportList 
                      reports={reports.filter(r => r.status === 'archived')} 
                      onSelectReport={handleSelectReport} 
                    />
                  </motion.div>
                )}

                {(activeTab === 'reports' || activeTab === 'archive') && selectedReportId && selectedReport && (
                  !isAuthenticated ? <Login key="login" onLogin={setIsAuthenticated} /> :
                  <motion.div
                    key="report-detail"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <ReportDetail 
                      report={selectedReport} 
                      onBack={() => handleSelectReport(null)} 
                      onUpdate={handleUpdateReport}
                    />
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, collapsed, onClick, badge }: { 
  icon: React.ReactNode, 
  label: string, 
  active?: boolean, 
  collapsed?: boolean,
  onClick: () => void,
  badge?: number
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 relative group ${
        active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <span className={`${active ? 'text-white' : 'text-slate-400'}`}>
        {icon}
      </span>
      {!collapsed && <span className="font-medium text-sm flex-1 text-left">{label}</span>}
      
      {badge !== undefined && badge > 0 && (
        <span className={`
          flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold
          ${active ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}
          ${collapsed ? 'absolute top-0 right-0 -translate-y-1/4 translate-x-1/4' : ''}
        `}>
          {badge}
        </span>
      )}
    </button>
  );
}

