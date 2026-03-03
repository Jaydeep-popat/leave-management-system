import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function LeaveBalances() {
  const [balances, setBalances] = useState([]);
  const [users, setUsers] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ user: '', year: new Date().getFullYear(), leaveType: '', totalAllocated: 0 });

  useEffect(() => {
    fetchBalances();
    fetchUsersAndTypes();
  }, []);

  const fetchBalances = async () => {
    try {
      const { data } = await api.get('/leave-balances');
      setBalances(data.data?.balances || data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersAndTypes = async () => {
    try {
      const userRes = await api.get('/users?limit=100');
      const typeRes = await api.get('/leave-types');
      setUsers(userRes.data?.data?.users || []);
      setLeaveTypes(typeRes.data?.data?.leaveTypes || typeRes.data?.data || []);
    } catch (err) {}
  };

  const handleBulkAllocate = async (e) => {
    e.preventDefault();
    try {
      if(!formData.user) return alert("Select user");
      await api.post('/leave-balances/bulk', { user: formData.user, year: formData.year });
      alert("Bulk allocation successful!");
      fetchBalances();
    } catch (err) {
      alert(err.response?.data?.message || 'Error occurred');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 sm:p-8">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Leave Balances Directory</h3>
        
        {loading ? <p>Loading...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 font-medium border-b border-slate-200 dark:border-slate-700 uppercase">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3">Allocated</th>
                  <th className="px-4 py-3">Used</th>
                  <th className="px-4 py-3">Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {balances.length === 0 ? (
                  <tr><td colSpan="6" className="px-4 py-4 text-center">No balances found</td></tr>
                ) : (
                  balances.map(b => (
                    <tr key={b._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{b.user?.name}</td>
                      <td className="px-4 py-3 capitalize">{b.leaveType?.name}</td>
                      <td className="px-4 py-3">{b.year}</td>
                      <td className="px-4 py-3 font-bold">{b.totalAllocated}</td>
                      <td className="px-4 py-3 text-red-500 font-bold">{b.used}</td>
                      <td className="px-4 py-3 text-green-500 font-bold">{b.remaining}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
        <h4 className="font-bold text-lg mb-4 dark:text-white">Bulk Allocate Balance</h4>
        <form onSubmit={handleBulkAllocate} className="space-y-4">
          <label className="flex flex-col">
            <span className="text-sm">Employee</span>
            <select required className="form-select rounded mt-1 dark:bg-slate-700"
              onChange={e => setFormData({...formData, user: e.target.value})}
            >
              <option value="">Select Employee</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>{u.name} - {u.email}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col">
            <span className="text-sm">Year</span>
            <input required type="number" min="2020" max="2100" className="form-input rounded mt-1 dark:bg-slate-700" 
              value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} />
          </label>
          <button type="submit" className="w-full bg-primary text-white py-2 rounded shadow">Run Allocation Batch</button>
        </form>
      </div>
    </div>
  );
}
