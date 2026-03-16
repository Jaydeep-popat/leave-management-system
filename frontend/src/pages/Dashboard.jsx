import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../api/axios';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [balances, setBalances] = useState([]);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Use /my endpoint for regular users to get their own balance
      const balRes = await api.get(`/leave-balances/my?year=${new Date().getFullYear()}`);
      const reqRes = await api.get('/leave-requests/my?limit=5');
      
      setBalances(balRes.data?.data || []);
      setRecentLeaves(reqRes.data?.data?.requests || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">Welcome back, {user?.name.split(' ')[0]}! 👋</h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg">Manage your time off and track your balance efficiently.</p>
        </div>
        <div className="flex gap-3">
          <button className="inline-flex items-center justify-center h-12 px-6 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200">
            <span className="material-symbols-outlined mr-2 text-[20px]">calendar_month</span>
            <span>View Calendar</span>
          </button>
          <button className="inline-flex items-center justify-center h-12 px-6 rounded-xl bg-primary text-white font-medium shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-[0.98]">
            <span className="material-symbols-outlined mr-2 text-[20px]">add_circle</span>
            <span>Quick Apply</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {loading ? (
          // Skeleton loaders for leave balance cards
          Array(4).fill(0).map((_, idx) => (
            <div key={idx} className="animate-pulse bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-start mb-4">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
              </div>
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16 mb-4"></div>
              <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full w-full mb-2"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
            </div>
          ))
        ) : balances.length > 0 ? (
          // Real data from API
          balances.map((balance, idx) => (
            <div key={balance._id} className="group relative bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <div className={`absolute top-6 right-6 p-2 rounded-lg 
                ${idx % 4 === 0 ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                  idx % 4 === 1 ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400' :
                  idx % 4 === 2 ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' :
                  'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'}`}>
                <span className="material-symbols-outlined text-2xl">
                  {['beach_access','medical_services','event_available','hourglass_bottom'][idx % 4]}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{balance.leaveType?.name || 'Leave'}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{balance.remaining}</span>
                <span className="text-sm font-medium text-slate-500">days available</span>
              </div>
              <div className="mt-4 w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                <div className={`h-1.5 rounded-full ${idx % 4 === 0 ? 'bg-blue-500' : idx % 4 === 1 ? 'bg-rose-500' : idx % 4 === 2 ? 'bg-purple-500' : 'bg-emerald-500'}`} 
                  style={{ width: `${(balance.remaining / balance.totalAllocated) * 100}%` }}></div>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Total {balance.totalAllocated} days/year • Used {balance.used}
              </p>
            </div>
          ))
        ) : (
          // No balances allocated
          <div className="col-span-full text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
            <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3">inbox</span>
            <p className="text-slate-500 dark:text-slate-400">No leave balances allocated yet</p>
            <p className="text-sm text-slate-400 mt-1">Contact HR to set up your leave allowances</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recent Activity</h3>
            <a href="#" className="text-sm font-medium text-primary hover:text-primary/80">View all history</a>
          </div>
          
          <div className="relative pl-4 sm:pl-6 border-l-2 border-slate-100 dark:border-slate-700 space-y-10">
            {loading ? (
              // Skeleton loaders for recent leaves
              Array(3).fill(0).map((_, idx) => (
                <div key={idx} className="relative animate-pulse">
                  <span className="absolute -left-[31px] sm:-left-[39px] flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-800 bg-slate-200 dark:bg-slate-700"></span>
                  <div className="space-y-3">
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-40"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : recentLeaves.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3">description</span>
                <p className="text-slate-500 text-sm">No recent leaves applied.</p>
              </div>
            ) : (
              recentLeaves.map((request) => (
                <div key={request._id} className="relative">
                  <span className={`absolute -left-[31px] sm:-left-[39px] flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-800 
                    ${request.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                      request.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                      'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                    <span className="material-symbols-outlined text-lg">
                      {request.status === 'approved' ? 'check_circle' : request.status === 'rejected' ? 'cancel' : 'hourglass_empty'}
                    </span>
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                    <div>
                      <h4 className="text-base font-semibold text-slate-900 dark:text-white capitalize">{request.leaveType?.name || 'Leave'} Request</h4>
                      <p className="text-sm text-slate-500 mt-1 capitalize">{request.status}</p>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-base text-slate-400">calendar_today</span>
                      <span>{new Date(request.fromDate).toLocaleDateString()} - {new Date(request.toDate).toLocaleDateString()} ({request.totalDays} days)</span>
                    </div>
                    <p className="text-xs text-slate-400">Reason: {request.reason}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
