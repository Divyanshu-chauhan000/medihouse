import { useEffect, useState } from 'react';
import API from '../../api/client';
import { HiOutlineCheck, HiOutlineX, HiOutlineEye, HiOutlineClipboardList, HiOutlineUsers, HiOutlineCube } from 'react-icons/hi';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prescRes, statsRes] = await Promise.all([
          API.get('/prescriptions/pending'),
          API.get('/products/stats') // Mocking these stats
        ]);
        setPrescriptions(prescRes.data.prescriptions);
        // setStats(statsRes.data);
        setStats({ products: 124, orders: 85, users: 42 }); // Mock for now
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleApproval = async (id, status) => {
    try {
      await API.put(`/prescriptions/${id}`, { status });
      setPrescriptions(prescriptions.filter(p => p._id !== id));
    } catch (error) {
      alert('Action failed');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 bg-slate-900 lg:min-h-screen p-6 text-white">
          <div className="mb-12">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="text-primary">+</span> Admin Panel
            </h2>
          </div>
          <nav className="space-y-4">
            <button className="w-full text-left p-4 bg-primary rounded-2xl flex items-center gap-3">
              <HiOutlineClipboardList /> Dashboard
            </button>
            <button className="w-full text-left p-4 hover:bg-slate-800 rounded-2xl flex items-center gap-3 transition-all">
              <HiOutlineCube /> Products
            </button>
            <button className="w-full text-left p-4 hover:bg-slate-800 rounded-2xl flex items-center gap-3 transition-all">
              <HiOutlineShoppingBag /> Orders
            </button>
            <button className="w-full text-left p-4 hover:bg-slate-800 rounded-2xl flex items-center gap-3 transition-all">
              <HiOutlineUsers /> Users
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 md:p-12">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl font-black text-slate-900 mb-12">Dashboard Overview</h1>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {[
                { label: 'Total Products', value: stats.products, icon: HiOutlineCube, color: 'bg-blue-500' },
                { label: 'Active Orders', value: stats.orders, icon: HiOutlineClipboardList, color: 'bg-emerald-500' },
                { label: 'Total Users', value: stats.users, icon: HiOutlineUsers, color: 'bg-purple-500' }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                  <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-${stat.color.split('-')[1]}-100`}>
                    <stat.icon size={28} />
                  </div>
                  <p className="text-slate-400 font-bold text-sm uppercase tracking-wider">{stat.label}</p>
                  <h3 className="text-4xl font-black text-slate-900 mt-1">{stat.value}</h3>
                </div>
              ))}
            </div>

            {/* Prescription Approvals */}
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <h3 className="text-2xl font-bold text-slate-900">Pending Prescriptions</h3>
                <span className="bg-amber-100 text-amber-600 px-4 py-1 rounded-full text-sm font-bold">
                  {prescriptions.length} Pending
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-400 text-xs uppercase tracking-widest font-bold">
                    <tr>
                      <th className="px-8 py-4">Patient</th>
                      <th className="px-8 py-4">Doctor</th>
                      <th className="px-8 py-4">Date</th>
                      <th className="px-8 py-4">Image</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {prescriptions.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-8 py-12 text-center text-slate-400">
                          No pending prescriptions to review.
                        </td>
                      </tr>
                    ) : (
                      prescriptions.map((p) => (
                        <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-6">
                            <p className="font-bold text-slate-800">{p.patientName}</p>
                            <p className="text-xs text-slate-400">{p.user?.email}</p>
                          </td>
                          <td className="px-8 py-6 text-slate-600 font-medium">{p.doctorName}</td>
                          <td className="px-8 py-6 text-slate-600">{new Date(p.createdAt).toLocaleDateString()}</td>
                          <td className="px-8 py-6">
                            <button className="text-primary hover:underline flex items-center gap-1 font-bold">
                              <HiOutlineEye /> View
                            </button>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleApproval(p._id, 'Approved')}
                                className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all"
                              >
                                <HiOutlineCheck />
                              </button>
                              <button 
                                onClick={() => handleApproval(p._id, 'Rejected')}
                                className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                              >
                                <HiOutlineX />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
