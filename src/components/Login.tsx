import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, User, Key, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (success: boolean) => void;
  key?: string;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      onLogin(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex p-4 bg-blue-50 rounded-2xl text-blue-600 mb-2">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Đăng nhập Admin</h2>
          <p className="text-slate-500 text-sm">Vui lòng nhập thông tin để truy cập quản trị</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              ID hoặc mật khẩu không đúng
            </motion.div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">ID Admin</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all text-slate-700"
                  placeholder="admin"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Mật khẩu</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all text-slate-700"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-[0.98] transition-all"
          >
            Đăng nhập
          </button>
        </form>
      </motion.div>
    </div>
  );
}
