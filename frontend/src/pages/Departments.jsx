import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMod, setShowMod] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data } = await api.get('/departments');
      setDepartments(data.data?.departments || data.data || []);
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
        await api.patch(`/departments/${isEditing}`, formData);
      } else {
        await api.post('/departments', formData);
      }
      setShowMod(false);
      setIsEditing(null);
      setFormData({ name: '', description: '' });
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.errors?.[0] || 'Error saving department');
    }
  };

  const openEdit = (d) => {
    setIsEditing(d._id);
    setFormData({ name: d.name, description: d.description || '' });
    setShowMod(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    try {
      await api.delete(`/departments/${id}`);
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.errors?.[0] || 'Error deleting. Ensure no users are assigned.');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 sm:p-8 relative">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Departments Management</h3>
        <button onClick={() => { setIsEditing(null); setFormData({name:'', description:''}); setShowMod(true); }} className="bg-primary text-white flex items-center px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-primary/90 transition">
          <span className="material-symbols-outlined mr-2">add</span> Add Dept
        </button>
      </div>

      {showMod && (
        <div className="absolute top-0 right-0 w-full sm:w-96 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-200 z-10 transition-transform">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-lg dark:text-white">{isEditing ? 'Edit Department' : 'New Department'}</h4>
            <button onClick={() => setShowMod(false)} className="text-slate-500 hover:text-slate-700">✕</button>
          </div>
          <form onSubmit={handleSub} className="space-y-4">
            <label className="flex flex-col">
              <span className="text-sm">Name</span>
              <input required type="text" className="form-input rounded mt-1 dark:bg-slate-700"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </label>
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
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {departments.length === 0 ? (
                <tr><td colSpan="3" className="px-4 py-4 text-center">No departments found</td></tr>
              ) : (
                departments.map(d => (
                  <tr key={d._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">{d.name}</td>
                    <td className="px-4 py-3">{d.description || 'N/A'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(d)} className="text-primary hover:bg-primary/10 px-2 py-1 rounded mr-2">Edit</button>
                      <button onClick={() => handleDelete(d._id)} className="text-red-500 hover:bg-red-50 px-2 py-1 rounded">Delete</button>
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
