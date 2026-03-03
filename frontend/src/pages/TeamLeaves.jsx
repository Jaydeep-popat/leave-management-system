import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function TeamLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);

  useEffect(() => {
    fetchTeamLeaves();
  }, []);

  const fetchTeamLeaves = async () => {
    try {
      const { data } = await api.get('/leave-requests?limit=50');
      setLeaves(data.data?.requests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    setActioningId(id);
    try {
      let payload = {};
      if (action === 'reject') {
        const reason = prompt("Enter Rejection Reason:");
        if (!reason) {
          setActioningId(null);
          return;
        }
        payload = { rejectionReason: reason };
      }
      await api.patch(`/leave-requests/${id}/${action}`, payload);
      fetchTeamLeaves();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.errors?.[0] || 'Error processing request');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 sm:p-8">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Team Leave Requests</h3>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="space-y-4">
          {leaves.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No leave requests found.</p>
          ) : (
            leaves.map(l => (
              <div key={l._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shadow-sm shrink-0">
                    {l.employee?.name?.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">{l.employee?.name} <span className="text-slate-400 font-normal text-sm">({l.employee?.designation})</span></h4>
                    <p className="text-sm font-medium mt-1">
                      {l.leaveType?.name || 'Leave'}: {new Date(l.fromDate).toLocaleDateString()} to {new Date(l.toDate).toLocaleDateString()} ({l.totalDays} days)
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Reason: {l.reason}</p>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${
                    l.status === 'approved' ? 'bg-green-100 text-green-700' :
                    l.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    l.status === 'cancelled' ? 'bg-slate-200 text-slate-600' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {l.status}
                  </span>
                  
                  {l.status === 'pending' && (
                    <div className="flex gap-2 mt-2">
                      <button 
                        onClick={() => handleAction(l._id, 'approve')}
                        disabled={actioningId === l._id}
                        className="text-xs px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white font-medium rounded shadow-sm transition-colors"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleAction(l._id, 'reject')}
                        disabled={actioningId === l._id}
                        className="text-xs px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded shadow-sm transition-colors"
                      >
                        Reject
                      </button>
                    </div>
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
