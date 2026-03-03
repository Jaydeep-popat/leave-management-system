import { useContext } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-2xl">grid_view</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Leave Portal</h1>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors">Dashboard</Link>
              <Link to="/leaves/my" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors">My Leaves</Link>
              {['admin', 'hr', 'manager'].includes(user?.role) && (
                <Link to="/leaves" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors">Team Leaves</Link>
              )}
              {['admin', 'hr'].includes(user?.role) && (
                <>
                  <Link to="/departments" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors">Departments</Link>
                  <Link to="/leave-types" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors">Policies</Link>
                  <Link to="/balances" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors">Balances</Link>
                  <Link to="/users" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors">Users</Link>
                </>
              )}
            </nav>
            
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-slate-500 hover:text-primary transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                <span className="material-symbols-outlined text-xl">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
              </button>
              
              <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2"></div>
              
              <div className="flex items-center gap-3">
                <Link to="/profile" className="text-right hidden sm:block hover:opacity-80 transition cursor-pointer">
                  <p className="text-sm font-medium text-slate-900 dark:text-white leading-none">{user?.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{user?.designation}</p>
                </Link>
                <div 
                  className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shadow-sm cursor-pointer hover:bg-primary hover:text-white transition"
                  onClick={handleLogout} title="Click to logout"
                >
                  {user?.name?.charAt(0)}
                </div>
              </div>
            </div>

          </div>
        </div>
      </header>

      <main className="flex-grow py-8 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
