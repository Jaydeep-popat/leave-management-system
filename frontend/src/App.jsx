import { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Departments from './pages/Departments';
import LeaveTypes from './pages/LeaveTypes';
import MyLeaves from './pages/MyLeaves';
import TeamLeaves from './pages/TeamLeaves';
import LeaveBalances from './pages/LeaveBalances';
import Users from './pages/Users';
import Profile from './pages/Profile';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/leave-types" element={<LeaveTypes />} />
            <Route path="/leaves/my" element={<MyLeaves />} />
            <Route path="/leaves" element={<TeamLeaves />} />
            <Route path="/balances" element={<LeaveBalances />} />
            <Route path="/users" element={<Users />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
