import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { HiOutlineShoppingBag, HiOutlineClock, HiOutlineCheckCircle, HiOutlineTruck, HiOutlineExclamationCircle } from 'react-icons/hi';
import API from '../api/client';
import { motion } from 'framer-motion';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await API.get('/orders/myorders');
        setOrders(response.data.orders);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchOrders();
  }, [user]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <HiOutlineClock className="text-amber-500" />;
      case 'Processing': return <HiOutlineShoppingBag className="text-blue-500" />;
      case 'Shipped': return <HiOutlineTruck className="text-primary" />;
      case 'Delivered': return <HiOutlineCheckCircle className="text-secondary" />;
      case 'Cancelled': return <HiOutlineExclamationCircle className="text-red-500" />;
      default: return null;
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'Pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Processing': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Shipped': return 'bg-blue-50 text-primary border-blue-100';
      case 'Delivered': return 'bg-emerald-50 text-secondary border-emerald-100';
      case 'Cancelled': return 'bg-red-50 text-red-600 border-red-100';
      default: return '';
    }
  };

  if (loading) return <div className="container mx-auto px-4 py-20 text-center">Loading orders...</div>;

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-4xl font-black text-slate-900 mb-12">Order History</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-[3rem] p-20 text-center shadow-sm border border-slate-100">
            <div className="text-8xl mb-8">📦</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">No orders yet</h2>
            <p className="text-slate-500 mb-8">Your health journey starts with your first order.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={order._id} 
                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden"
              >
                <div className="p-8 md:p-10">
                  <div className="flex flex-col md:flex-row justify-between gap-6 mb-8 border-b border-slate-50 pb-8">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Order ID</p>
                      <p className="text-lg font-black text-slate-800">#{order._id.slice(-8).toUpperCase()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Placed On</p>
                      <p className="font-bold text-slate-700">{new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Amount</p>
                      <p className="text-xl font-black text-primary">${order.totalPrice}</p>
                    </div>
                    <div>
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border ${getStatusBg(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {order.orderItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-slate-50 rounded-2xl p-2 shrink-0 flex items-center justify-center border border-slate-100">
                          <img src={item.image || 'https://via.placeholder.com/100'} alt={item.name} className="max-h-full object-contain" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800">{item.name}</h4>
                          <p className="text-sm text-slate-400">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">${item.price * item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 pt-8 border-t border-slate-50 flex flex-wrap gap-4 justify-between items-center">
                    <div className="text-sm text-slate-500">
                      <span className="font-bold text-slate-700">Shipping to: </span>
                      {order.shippingAddress.street}, {order.shippingAddress.city}
                    </div>
                    <button className="text-primary font-bold hover:underline">Track Shipment</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
