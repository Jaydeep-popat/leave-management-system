import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

export default function Profile() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('details');

  const [details, setDetails] = useState({ name: user?.name, designation: user?.designation });
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '' });

  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    try {
      await api.patch('/users/update', details);
      alert('Details updated successfully. Reload to see changes.');
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating details');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await api.patch('/users/change-password', passwords);
      setPasswords({ oldPassword: '', newPassword: '' });
      alert('Password updated successfully');
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.errors?.[0] || 'Error changing password');
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 sm:p-8">
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Account Settings</h3>

      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
        <button onClick={() => setActiveTab('details')} className={`pb-2 px-4 font-medium ${activeTab === 'details' ? 'border-b-2 border-primary text-primary' : 'text-slate-500'}`}>Profile Details</button>
        <button onClick={() => setActiveTab('password')} className={`pb-2 px-4 font-medium ${activeTab === 'password' ? 'border-b-2 border-primary text-primary' : 'text-slate-500'}`}>Security</button>
      </div>

      {activeTab === 'details' ? (
        <form onSubmit={handleUpdateDetails} className="space-y-4">
          <label className="flex flex-col">
            <span className="text-sm">Name</span>
            <input type="text" className="form-input rounded mt-1 dark:bg-slate-700"
              value={details.name} onChange={e => setDetails({...details, name: e.target.value})} />
          </label>
          <label className="flex flex-col">
            <span className="text-sm">Designation</span>
            <input type="text" className="form-input rounded mt-1 dark:bg-slate-700" 
              value={details.designation} onChange={e => setDetails({...details, designation: e.target.value})} />
          </label>
          <label className="flex flex-col opacity-50">
            <span className="text-sm">Email (Cannot be changed)</span>
            <input type="email" disabled className="form-input rounded mt-1 dark:bg-slate-800" value={user?.email} />
          </label>
          <button type="submit" className="bg-primary text-white py-2 px-6 rounded shadow">Save Changes</button>
        </form>
      ) : (
        <form onSubmit={handleChangePassword} className="space-y-4">
          <label className="flex flex-col">
            <span className="text-sm">Current Password</span>
            <input type="password" required className="form-input rounded mt-1 dark:bg-slate-700"
              value={passwords.oldPassword} onChange={e => setPasswords({...passwords, oldPassword: e.target.value})} />
          </label>
          <label className="flex flex-col">
            <span className="text-sm">New Password</span>
            <input type="password" required className="form-input rounded mt-1 dark:bg-slate-700"
              value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})} />
          </label>
          <button type="submit" className="bg-primary text-white py-2 px-6 rounded shadow">Update Password</button>
        </form>
      )}
    </div>
  );
}
