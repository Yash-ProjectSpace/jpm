'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { signIn } from 'next-auth/react'; 

import signupAnimationData from '@/public/animations/signup-animation.json';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

export default function SignupPage() {
  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState(''); 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [terms, setTerms] = useState(false); 
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation & Loading States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formErrors, setFormErrors] = useState({
    name: false,
    email: false,
    department: false,
    password: false,
    confirmPassword: false,
    passwordMatch: false,
    terms: false,
  });

  const router = useRouter();

  const handleGoogleSignup = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation logic
    const newErrors = {
      name: name.trim() === '',
      email: email.trim() === '',
      department: department === '',
      password: password === '',
      confirmPassword: confirmPassword === '',
      passwordMatch: password !== '' && confirmPassword !== '' && password !== confirmPassword,
      terms: !terms,
    };

    setFormErrors(newErrors);

    const hasEmptyFields = newErrors.name || newErrors.email || newErrors.department || newErrors.password || newErrors.confirmPassword || newErrors.terms;

    if (hasEmptyFields) {
      setError("すべての必須項目を正しく入力してください。"); 
      setLoading(false);
      return;
    }

    if (newErrors.passwordMatch) {
      setError("パスワードが一致しません。"); 
      setLoading(false);
      return;
    }

    // --- REAL API CALL ADDED HERE ---
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          // Sending department as well to ensure it matches your DX requirement
          department: department.toUpperCase() 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "登録中にエラーが発生しました。");
      }

      // Success: Redirect to login
      alert("アカウントが作成されました！ログインしてください。");
      router.push('/login');
      
    } catch (err: any) {
      console.error("SIGNUP_CLIENT_ERROR:", err);
      setError(err.message || "登録中にエラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  const getInputClass = (isError: boolean) => {
    return `w-full px-4 py-3 h-12 rounded-xl border focus:bg-white focus:ring-2 outline-none transition-all font-medium ${
      isError 
        ? 'bg-rose-50 border-rose-500 focus:ring-rose-500 text-rose-900' 
        : 'bg-slate-50 border-slate-200 focus:ring-indigo-500 text-slate-900'
    }`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      
      <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] bg-indigo-200/40 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[30vw] h-[30vw] max-w-[500px] max-h-[500px] bg-emerald-200/40 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden md:flex flex-col items-center justify-center text-center"
        >
          <div className="w-full max-w-[400px]">
            <Lottie 
              animationData={signupAnimationData} 
              loop={true}
            />
          </div>
          <h1 className="text-4xl font-black text-indigo-600 tracking-tighter mt-4">JPM</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">JMC プロジェクト管理システム</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 border border-white p-8 lg:p-10"
        >
          <div className="mb-6 text-left">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">アカウント作成</h2>
            <p className="text-slate-500 font-medium text-sm mt-1">必要な情報を入力して、JMCを始めましょう。</p>
          </div>

          <div className="mb-5">
            <button 
              onClick={handleGoogleSignup}
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl shadow-sm hover:bg-slate-50 hover:shadow transition-all active:scale-[0.98]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="shrink-0">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Googleで登録
            </button>

            <div className="flex items-center gap-4 mt-6">
              <div className="flex-1 h-px bg-slate-200"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">またはメールで</p>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl flex items-start gap-3 text-sm font-bold"
              >
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </motion.div>
            )}

            <div>
              <label className={`block text-xs font-black uppercase tracking-widest ml-1 mb-1.5 ${formErrors.name ? 'text-rose-500' : 'text-slate-400'}`}>
                お名前
              </label>
              <input 
                type="text" 
                placeholder="山田 太郎" 
                value={name} 
                onChange={(e) => {
                  setName(e.target.value);
                  if (formErrors.name) setFormErrors({...formErrors, name: false});
                }}
                className={getInputClass(formErrors.name)}
              />
            </div>

            <div>
              <label className={`block text-xs font-black uppercase tracking-widest ml-1 mb-1.5 ${formErrors.email ? 'text-rose-500' : 'text-slate-400'}`}>
                メールアドレス
              </label>
              <input 
                type="email" 
                placeholder="example@jmc.com" 
                value={email} 
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formErrors.email) setFormErrors({...formErrors, email: false});
                }}
                className={getInputClass(formErrors.email)}
              />
            </div>

            <div>
              <label className={`block text-xs font-black uppercase tracking-widest ml-1 mb-1.5 ${formErrors.department ? 'text-rose-500' : 'text-slate-400'}`}>
                部署
              </label>
              <select 
                value={department} 
                onChange={(e) => {
                  setDepartment(e.target.value);
                  if (formErrors.department) setFormErrors({...formErrors, department: false});
                }}
                className={getInputClass(formErrors.department)}
              >
                <option value="" disabled>選択してください</option>
                <option value="Dx">DX事業推進室</option>
                <option value="HealthInformation">保健情報部</option>
                <option value="Beauty Payment">美容決済部門</option>
                <option value="hr">企画推進室・人材開発室</option>
                <option value="General Affairs">総務部</option>
              </select>
            </div>
            
            <div>
              <label className={`block text-xs font-black uppercase tracking-widest ml-1 mb-1.5 ${(formErrors.password || formErrors.passwordMatch) ? 'text-rose-500' : 'text-slate-400'}`}>
                パスワード
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (formErrors.password || formErrors.passwordMatch) setFormErrors({...formErrors, password: false, passwordMatch: false});
                  }}
                  className={`${getInputClass(formErrors.password || formErrors.passwordMatch)} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className={`block text-xs font-black uppercase tracking-widest ml-1 mb-1.5 ${(formErrors.confirmPassword || formErrors.passwordMatch) ? 'text-rose-500' : 'text-slate-400'}`}>
                確認用
              </label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={confirmPassword} 
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (formErrors.confirmPassword || formErrors.passwordMatch) setFormErrors({...formErrors, confirmPassword: false, passwordMatch: false});
                  }}
                  className={`${getInputClass(formErrors.confirmPassword || formErrors.passwordMatch)} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2 ml-1 mt-2">
              <input 
                type="checkbox" 
                id="terms" 
                checked={terms}
                onChange={(e) => {
                  setTerms(e.target.checked);
                  if (formErrors.terms) setFormErrors({...formErrors, terms: false});
                }}
                className={`mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer ${formErrors.terms ? 'border-rose-500 ring-1 ring-rose-500' : ''}`} 
              />
              <label htmlFor="terms" className={`text-xs font-medium cursor-pointer leading-tight ${formErrors.terms ? 'text-rose-500' : 'text-slate-600'}`}>
                <a href="#" className="font-bold underline underline-offset-2 hover:opacity-80 transition-opacity">利用規約</a> 
                {' '}および{' '} 
                <a href="#" className="font-bold underline underline-offset-2 hover:opacity-80 transition-opacity">プライバシーポリシー</a> 
                {' '}に同意します。
              </label>
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-full shadow-xl shadow-indigo-200 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : "アカウントを作成"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-slate-500 font-medium text-sm">
              すでにアカウントをお持ちですか？{' '}
              <Link href="/login" className="text-indigo-600 font-black hover:underline">
                サインイン
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}