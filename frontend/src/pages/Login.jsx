import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4 sm:p-8">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row">
        <div className="hidden md:flex md:w-5/12 bg-primary/10 relative items-center justify-center p-8">
        <div className="absolute inset-0 bg-cover bg-center opacity-50 dark:opacity-20 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop')]"></div>
        <div className="relative z-10 text-center">
          <span className="material-symbols-outlined text-primary text-6xl mb-4">account_circle</span>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Leave Management System</h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm">Streamline your leave requests and approvals efficiently.</p>
        </div>
      </div>
      <div className="w-full md:w-7/12 p-8 lg:p-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome Back!</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Log in to manage your leaves.</p>
        </div>
        
        {error && <div className="mb-4 p-3 bg-red-100 text-red-600 rounded">{error}</div>}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <label className="flex flex-col">
            <span className="text-slate-700 dark:text-slate-300 text-sm font-medium mb-1">Email Address</span>
            <input 
              required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="john.doe@company.com"
              className="form-input w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-primary focus:ring-primary h-12 px-4 placeholder:text-slate-400" 
            />
          </label>
          <label className="flex flex-col">
            <span className="text-slate-700 dark:text-slate-300 text-sm font-medium mb-1">Password</span>
            <input 
              required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="form-input w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-primary focus:ring-primary h-12 px-4 placeholder:text-slate-400" 
            />
          </label>
          
          <div className="pt-4">
            <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200">
              Log In
            </button>
          </div>
        </form>
        <div className="mt-6 text-center">
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Don't have an account? 
            <Link to="/register" className="text-primary hover:text-primary/80 font-medium ml-1 transition-colors duration-200">Register here</Link>
          </p>
        </div>
      </div>
    </div>
    </div>
  );
}
