import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../api/axios';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'employee', department: '', designation: ''
  });
  const [departments, setDepartments] = useState([]);
  const { registerUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const { data } = await api.get('/departments');
        setDepartments(data.data || []);
      } catch (err) {
        console.error('Forgot to fetch departments or failed', err);
      }
    };
    fetchDepartments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await registerUser(formData);
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.errors?.[0] || 'Registration failed';
      setError(errorMsg);
      toast.error(errorMsg);
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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Employee Registration</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Create a new account to manage your leaves.</p>
        </div>
        
        {error && <div className="mb-4 p-3 bg-red-100 text-red-600 rounded">{error}</div>}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="flex flex-col">
              <span className="text-slate-700 dark:text-slate-300 text-sm font-medium mb-1">Full Name</span>
              <input required type="text" placeholder="e.g. John Doe"
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="form-input w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-primary focus:ring-primary h-12 px-4 placeholder:text-slate-400" 
              />
            </label>
            <label className="flex flex-col">
              <span className="text-slate-700 dark:text-slate-300 text-sm font-medium mb-1">Email Address</span>
              <input required type="email" placeholder="john.doe@company.com"
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="form-input w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-primary focus:ring-primary h-12 px-4 placeholder:text-slate-400" 
              />
            </label>
            <label className="flex flex-col">
              <span className="text-slate-700 dark:text-slate-300 text-sm font-medium mb-1">Password</span>
              <input required type="password" placeholder="••••••••"
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="form-input w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-primary focus:ring-primary h-12 px-4 placeholder:text-slate-400" 
              />
            </label>
            <label className="flex flex-col">
              <span className="text-slate-700 dark:text-slate-300 text-sm font-medium mb-1">Designation</span>
              <input required type="text" placeholder="e.g. Software Engineer"
                onChange={e => setFormData({...formData, designation: e.target.value})}
                className="form-input w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-primary focus:ring-primary h-12 px-4 placeholder:text-slate-400" 
              />
            </label>
            <label className="flex flex-col">
              <span className="text-slate-700 dark:text-slate-300 text-sm font-medium mb-1">Department</span>
              <select required onChange={e => setFormData({...formData, department: e.target.value})}
                className="form-select w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-primary focus:ring-primary h-12 px-4">
                <option value="" disabled selected>Select Department</option>
                {departments.map(d => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col">
              <span className="text-slate-700 dark:text-slate-300 text-sm font-medium mb-1">Role</span>
              <select required onChange={e => setFormData({...formData, role: e.target.value})} value={formData.role}
                className="form-select w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-primary focus:ring-primary h-12 px-4">
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="hr">HR Admin</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          </div>
          <div className="pt-4">
            <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200">
              Register Account
            </button>
          </div>
        </form>
        <div className="mt-6 text-center">
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Already have an account? 
            <Link to="/login" className="text-primary hover:text-primary/80 font-medium ml-1 transition-colors duration-200">Log in here</Link>
          </p>
        </div>
      </div>
    </div>
    </div>
  );
}
