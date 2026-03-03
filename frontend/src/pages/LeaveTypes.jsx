import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function LeaveTypes() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMod, setShowMod] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '', maxDaysPerYear: 0, carryForwardAllowed: false, description: '' });

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  const fetchLeaveTypes = async () => {
    try {
      const { data } = await api.get('/leave-types?isActive=false');
      setLeaveTypes(data.data?.leaveTypes || data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSub = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.patch(`/leave-types/${isEditing}`, formData);
      } else {
        await api.post('/leave-types', formData);
      }
      setShowMod(false);
      setIsEditing(null);
      setFormData({ name: '', maxDaysPerYear: 0, carryForwardAllowed: false, description: '' });
      fetchLeaveTypes();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.errors?.[0] || 'Error saving type');
    }
  };

  const openEdit = (lt) => {
    setIsEditing(lt._id);
    setFormData({ name: lt.name, maxDaysPerYear: lt.maxDaysPerYear, carryForwardAllowed: lt.carryForwardAllowed, description: lt.description || '' });
    setShowMod(true);
  };

  const handleToggle = async (id) => {
    try {
      await api.patch(`/leave-types/${id}/toggle-status`);
      fetchLeaveTypes();
    } catch (err) {
      alert(err.response?.data?.message || 'Error toggling');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this leave type permanently?")) return;
    try {
      await api.delete(`/leave-types/${id}`);
      fetchLeaveTypes();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 sm:p-8 relative">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Leave Policies & Types</h3>
        <button onClick={() => { setIsEditing(null); setFormData({name:'', maxDaysPerYear:0, carryForwardAllowed:false, description:''}); setShowMod(true); }} className="bg-primary text-white flex items-center px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-primary/90 transition">
          <span className="material-symbols-outlined mr-2">add</span> Add Policy
        </button>
      </div>

      {showMod && (
        <div className="absolute top-0 right-0 w-full sm:w-96 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-200 z-10 transition-transform">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-lg dark:text-white">{isEditing ? 'Edit Leave Type' : 'New Leave Type'}</h4>
            <button onClick={() => setShowMod(false)} className="text-slate-500 hover:text-slate-700">✕</button>
          </div>
          <form onSubmit={handleSub} className="space-y-4">
            <label className="flex flex-col">
              <span className="text-sm">Name</span>
              <input required type="text" className="form-input rounded mt-1 dark:bg-slate-700"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col">
                <span className="text-sm">Days / Year</span>
                <input required type="number" min="1" className="form-input rounded mt-1 dark:bg-slate-700"
                  value={formData.maxDaysPerYear} onChange={e => setFormData({...formData, maxDaysPerYear: parseInt(e.target.value)})} />
              </label>
              <label className="flex flex-col items-start justify-center mt-4">
                <span className="text-sm flex items-center gap-2">
                  <input type="checkbox" className="form-checkbox rounded text-primary"
                    checked={formData.carryForwardAllowed} onChange={e => setFormData({...formData, carryForwardAllowed: e.target.checked})} />
                  Carry Forward
                </span>
              </label>
            </div>
            <label className="flex flex-col">
              <span className="text-sm">Description</span>
              <textarea rows="3" className="form-textarea rounded mt-1 dark:bg-slate-700"
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </label>
            <button type="submit" className="w-full bg-primary text-white py-2 rounded shadow">
              {isEditing ? 'Save Changes' : 'Submit'}
            </button>
          </form>
        </div>
      )}

      {loading ? <p>Loading...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 font-medium border-b border-slate-200 dark:border-slate-700 uppercase">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Days/Year</th>
                <th className="px-4 py-3">Carry Forward</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {leaveTypes.length === 0 ? (
                <tr><td colSpan="5" className="px-4 py-4 text-center">No leave types defined</td></tr>
              ) : (
                leaveTypes.map(lt => (
                  <tr key={lt._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="px-4 py-3">
                      <p className="text-slate-900 dark:text-white font-medium">{lt.name}</p>
                      <p className="text-xs text-slate-500">{lt.description}</p>
                    </td>
                    <td className="px-4 py-3 font-bold">{lt.maxDaysPerYear}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${lt.carryForwardAllowed ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                        {lt.carryForwardAllowed ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${lt.isActive ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                        {lt.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(lt)} className="text-primary hover:bg-primary/10 px-2 py-1 rounded mr-2">Edit</button>
                      <button onClick={() => handleToggle(lt._id)} className="text-slate-500 hover:bg-slate-100 px-2 py-1 rounded mr-2">Toggle</button>
                      <button onClick={() => handleDelete(lt._id)} className="text-red-500 hover:bg-red-50 px-2 py-1 rounded">Delete</button>
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
