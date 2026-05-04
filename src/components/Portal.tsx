import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Send, Lock, ChevronRight } from 'lucide-react';

interface PortalProps {
  onSelectRole: (role: 'reporter' | 'handler') => void;
}

export default function Portal({ onSelectRole }: PortalProps) {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full text-center space-y-12"
      >
        <div className="space-y-4">
          <div className="inline-flex p-4 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-600/20 mb-4">
            <ShieldCheck className="w-12 h-12" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Hệ Thống Quản Lý <br/>
            <span className="text-blue-600">An Toàn Hàng Không</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Chào mừng bạn đến với cổng tiếp nhận và xử lý báo cáo an toàn. Vui lòng chọn vai trò để tiếp tục.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Reporter Option */}
          <motion.button
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectRole('reporter')}
            className="group relative bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl hover:shadow-2xl transition-all text-left space-y-6 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
            
            <div className="relative inline-flex p-4 bg-emerald-500 rounded-2xl text-white">
              <Send className="w-8 h-8" />
            </div>
            
            <div className="relative space-y-2">
              <h3 className="text-2xl font-bold text-slate-900">Tôi muốn Gửi báo cáo</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                Gửi phản ánh về các sự cố, mối nguy hoặc vấn đề an toàn. Không yêu cầu đăng nhập.
              </p>
            </div>
            
            <div className="relative flex items-center gap-2 text-emerald-600 font-bold group-hover:gap-4 transition-all">
              Bắt đầu ngay <ChevronRight className="w-5 h-5" />
            </div>
          </motion.button>

          {/* Handler Option */}
          <motion.button
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectRole('handler')}
            className="group relative bg-slate-900 p-10 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all text-left space-y-6 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
            
            <div className="relative inline-flex p-4 bg-blue-600 rounded-2xl text-white">
              <Lock className="w-8 h-8" />
            </div>
            
            <div className="relative space-y-2">
              <h3 className="text-2xl font-bold text-white">Tôi là Người xử lý</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                Truy cập Dashboard, phân tích AI và quản lý các báo cáo đã nhận. Yêu cầu tài khoản admin.
              </p>
            </div>
            
            <div className="relative flex items-center gap-2 text-blue-400 font-bold group-hover:gap-4 transition-all">
              Đăng nhập hệ thống <ChevronRight className="w-5 h-5" />
            </div>
          </motion.button>
        </div>

        <div className="text-slate-400 text-sm font-medium flex items-center justify-center gap-4">
          <span className="w-12 h-px bg-slate-200" />
          Dẫn đầu về An toàn & Công nghệ
          <span className="w-12 h-px bg-slate-200" />
        </div>
      </motion.div>
    </div>
  );
}
