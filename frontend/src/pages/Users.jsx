import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users?limit=50');
      setUsers(data.data?.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await api.patch(`/users/${id}/status`, { status: newStatus });
      toast.success(`User status updated to ${newStatus}`);
      fetchUsers(); // Refresh
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error occurred');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 sm:p-8">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">User Management</h3>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 font-medium border-b border-slate-200 dark:border-slate-700 uppercase">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role & Dept</th>
                <th className="px-4 py-3">Designation</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {users.length === 0 ? (
                <tr><td colSpan="5" className="px-4 py-4 text-center">No users found</td></tr>
              ) : (
                users.map(u => (
                  <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="px-4 py-3">
                      <p className="text-slate-900 dark:text-white font-medium">{u.name}</p>
                      <p className="text-xs">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {u.role} <br />
                      <span className="text-xs text-slate-500">{u.department?.name || 'No Dept'}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">{u.designation}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => toggleStatus(u._id, u.status)}
                        className={`text-xs px-3 py-1 rounded font-medium border ${u.status === 'active' ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                      >
                        Set {u.status === 'active' ? 'Inactive' : 'Active'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
