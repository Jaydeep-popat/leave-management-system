import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function MyLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplyMod, setShowApplyMod] = useState(false);
  const [formData, setFormData] = useState({ leaveType: '', fromDate: '', toDate: '', reason: '' });

  useEffect(() => {
    fetchMyLeaves();
    fetchLeaveTypes();
  }, []);

  const fetchMyLeaves = async () => {
    try {
      const { data } = await api.get('/leave-requests/my');
      setLeaves(data.data?.leaveRequests || data.data?.requests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const { data } = await api.get('/leave-types');
      setLeaveTypes(data.data?.leaveTypes || data.data || []);
    } catch (err) {}
  };

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leave-requests/apply', formData);
      setShowApplyMod(false);
      fetchMyLeaves();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.errors?.[0] || 'Error applying');
    }
  };

  const handleCancel = async (id) => {
    if(!confirm("Are you sure you want to cancel this leave?")) return;
    try {
      await api.patch(`/leave-requests/${id}/cancel`);
      fetchMyLeaves();
    } catch (err) {
      alert(err.response?.data?.message || 'Error occurred');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 sm:p-8 relative">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">My Leave Requests</h3>
        <button onClick={() => setShowApplyMod(true)} className="bg-primary text-white flex items-center gap-1 px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-primary/90 transition">
          <span className="material-symbols-outlined text-[20px]">add</span> Apply Leave
        </button>
      </div>

      {showApplyMod && (
        <div className="absolute top-0 right-0 w-full sm:w-96 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-200 z-10 transition-transform">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-lg dark:text-white">Apply for Leave</h4>
            <button onClick={() => setShowApplyMod(false)} className="text-slate-500 hover:text-slate-700">✕</button>
          </div>
          <form onSubmit={handleApply} className="space-y-4">
            <label className="flex flex-col">
              <span className="text-sm">Leave Type</span>
              <select required className="form-select rounded mt-1 dark:bg-slate-700 disabled:opacity-50"
                onChange={e => setFormData({...formData, leaveType: e.target.value})}
              >
                <option value="">Select Type</option>
                {Array.isArray(leaveTypes) && leaveTypes.map(lt => (
                  <option key={lt._id} value={lt._id}>{lt.name}</option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col">
                <span className="text-sm">From Date</span>
                <input required type="date" className="form-input rounded mt-1 dark:bg-slate-700"
                  onChange={e => setFormData({...formData, fromDate: e.target.value})} />
              </label>
              <label className="flex flex-col">
                <span className="text-sm">To Date</span>
                <input required type="date" className="form-input rounded mt-1 dark:bg-slate-700" 
                  onChange={e => setFormData({...formData, toDate: e.target.value})} />
              </label>
            </div>
            <label className="flex flex-col">
              <span className="text-sm">Reason</span>
              <textarea required rows="3" className="form-textarea rounded mt-1 dark:bg-slate-700"
                onChange={e => setFormData({...formData, reason: e.target.value})} />
            </label>
            <button type="submit" className="w-full bg-primary text-white py-2 rounded shadow">Submit Request</button>
          </form>
        </div>
      )}

      {loading ? <p>Loading...</p> : (
        <div className="space-y-4">
          {leaves.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No leave requests found.</p>
          ) : (
            leaves.map(l => (
              <div key={l._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full ring-4 ring-white dark:ring-slate-800 ${
                    l.status === 'approved' ? 'bg-green-100 text-green-600' :
                    l.status === 'rejected' ? 'bg-red-100 text-red-600' :
                    'bg-amber-100 text-amber-600'
                  }`}>
                    <span className="material-symbols-outlined">
                      {l.status === 'approved' ? 'check_circle' : l.status === 'rejected' ? 'cancel' : 'schedule'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">{l.leaveType?.name || 'Leave'}</h4>
                    <p className="text-sm text-slate-500">
                      {new Date(l.fromDate).toLocaleDateString()} to {new Date(l.toDate).toLocaleDateString()} ({l.totalDays} days)
                    </p>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 flex gap-4 items-center">
                  <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${
                    l.status === 'approved' ? 'bg-green-100 text-green-700' :
                    l.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    l.status === 'cancelled' ? 'bg-slate-200 text-slate-600' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {l.status}
                  </span>
                  {l.status === 'pending' && (
                    <button onClick={() => handleCancel(l._id)} className="text-xs text-red-500 hover:text-white hover:bg-red-500 border border-red-500 px-2 py-1 rounded transition">Cancel</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
