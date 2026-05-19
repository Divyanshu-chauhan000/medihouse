import { useEffect, useState } from 'react';
import API from '../../api/client';
import { 
  HiOutlinePlus, 
  HiOutlinePencil, 
  HiOutlineTrash, 
  HiOutlineChartBar, 
  HiOutlineCube, 
  HiOutlineShoppingCart,
  HiOutlineUpload,
  HiOutlineRefresh,
  HiOutlineUserCircle,
  HiCheckCircle,
  HiClock,
  HiCurrencyRupee,
  HiTag
} from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ['Antibiotics', 'Pain Relief', 'Cold & Flu', 'Digestive', 'Skin Care', 'Supplements', 'Vitamins', 'First Aid', 'Others'];
const FORMULATIONS = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Suspension', 'Powder', 'Spray', 'Drops'];

const VendorDashboard = () => {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'orders', 'sales'
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Image preview state
  const [imagePreview, setImagePreview] = useState(null);
  
  // Product Form State
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: 'Antibiotics',
    manufacturer: '',
    batchNo: '',
    expiryDate: '',
    requiresPrescription: false,
    prescriptionType: 'OTC',
    dosage: '',
    strength: '',
    formulation: 'Tablet',
    image: null
  });

  const resetForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      stock: '',
      category: 'Antibiotics',
      manufacturer: '',
      batchNo: '',
      expiryDate: '',
      requiresPrescription: false,
      prescriptionType: 'OTC',
      dosage: '',
      strength: '',
      formulation: 'Tablet',
      image: null
    });
    setImagePreview(null);
    setEditingProduct(null);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [prodRes, orderRes] = await Promise.all([
        API.get('/products/vendor'),
        API.get('/orders/vendor')
      ]);
      setProducts(prodRes.data.products || []);
      setOrders(orderRes.data.orders || []);
    } catch (error) {
      console.error('Failed to fetch vendor data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductForm({
      ...productForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductForm({ ...productForm, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    // Format date for input field type="date" (YYYY-MM-DD)
    const formattedDate = product.expiryDate 
      ? new Date(product.expiryDate).toISOString().split('T')[0] 
      : '';
      
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      stock: product.stock || '',
      category: product.category || 'Antibiotics',
      manufacturer: product.manufacturer || '',
      batchNo: product.batchNo || '',
      expiryDate: formattedDate,
      requiresPrescription: product.requiresPrescription || false,
      prescriptionType: product.prescriptionType || 'OTC',
      dosage: product.dosage || '',
      strength: product.strength || '',
      formulation: product.formulation || 'Tablet',
      image: null // Keep image null unless vendor uploads a new one
    });

    if (product.image) {
      setImagePreview(product.image.startsWith('http') || product.image.startsWith('/')
        ? `${API.defaults.baseURL.replace('/api', '')}${product.image}`
        : product.image
      );
    } else {
      setImagePreview(null);
    }
    
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    Object.keys(productForm).forEach((key) => {
      if (key === 'image') {
        if (productForm.image) {
          formData.append('image', productForm.image);
        }
      } else {
        formData.append(key, productForm[key]);
      }
    });

    try {
      setLoading(true);
      let response;
      if (editingProduct) {
        response = await API.put(`/products/${editingProduct._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setProducts(products.map(p => p._id === editingProduct._id ? response.data.product : p));
      } else {
        response = await API.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setProducts([...products, response.data.product]);
      }
      setShowModal(false);
      resetForm();
      fetchDashboardData();
    } catch (error) {
      console.error('Error saving product:', error);
      alert(error.response?.data?.message || 'Failed to save product. Please check the fields.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }
    try {
      setLoading(true);
      await API.delete(`/products/${productId}`);
      setProducts(products.filter(p => p._id !== productId));
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      await API.put(`/orders/${orderId}`, { status: newStatus });
      setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status');
    }
  };

  // Calculations for Sales tab
  const getProductSalesDetails = () => {
    let totalRevenue = 0;
    let unitsSold = 0;
    
    // Filter to only count revenue from items belonging to this vendor
    const vendorProductIds = products.map(p => p._id);
    
    orders.forEach(order => {
      if (order.paymentStatus === 'Completed' || order.paymentMethod === 'COD') {
        order.items.forEach(item => {
          const itemProdId = item.product?._id || item.product;
          if (vendorProductIds.includes(itemProdId)) {
            totalRevenue += (item.price * item.quantity);
            unitsSold += item.quantity;
          }
        });
      }
    });

    const pendingOrdersCount = orders.filter(o => o.status === 'Pending' || o.status === 'Confirmed').length;
    
    return {
      revenue: totalRevenue,
      units: unitsSold,
      pending: pendingOrdersCount,
      totalOrdersCount: orders.length
    };
  };

  const stats = getProductSalesDetails();

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans flex flex-col lg:flex-row">
      
      {/* Sidebar */}
      <aside className="w-full lg:w-72 bg-emerald-950 lg:min-h-screen p-6 text-white flex flex-col justify-between shadow-2xl">
        <div>
          <div className="mb-10 mt-4 px-2">
            <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight">
              <span className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-emerald-400/30">✚</span> 
              <span>MediPortal</span>
            </h2>
            <p className="text-emerald-400/60 text-xs mt-1.5 font-bold uppercase tracking-widest">Vendor Dashboard</p>
          </div>
          
          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('inventory')}
              className={`w-full text-left py-4 px-5 rounded-2xl flex items-center gap-4 font-bold transition-all duration-300 ${
                activeTab === 'inventory' 
                  ? 'bg-emerald-50 text-emerald-950 font-black shadow-xl shadow-emerald-500/20 scale-[1.02]' 
                  : 'hover:bg-emerald-900/60 text-emerald-100/70 hover:text-white'
              }`}
            >
              <HiOutlineCube className="text-xl" /> 
              <span>My Inventory</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left py-4 px-5 rounded-2xl flex items-center gap-4 font-bold transition-all duration-300 ${
                activeTab === 'orders' 
                  ? 'bg-emerald-50 text-emerald-950 font-black shadow-xl shadow-emerald-500/20 scale-[1.02]' 
                  : 'hover:bg-emerald-900/60 text-emerald-100/70 hover:text-white'
              }`}
            >
              <HiOutlineShoppingCart className="text-xl" /> 
              <span className="flex-1">Client Orders</span>
              {stats.pending > 0 && (
                <span className="bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-full font-black animate-pulse">
                  {stats.pending}
                </span>
              )}
            </button>
            
            <button 
              onClick={() => setActiveTab('sales')}
              className={`w-full text-left py-4 px-5 rounded-2xl flex items-center gap-4 font-bold transition-all duration-300 ${
                activeTab === 'sales' 
                  ? 'bg-emerald-50 text-emerald-950 font-black shadow-xl shadow-emerald-500/20 scale-[1.02]' 
                  : 'hover:bg-emerald-900/60 text-emerald-100/70 hover:text-white'
              }`}
            >
              <HiOutlineChartBar className="text-xl" /> 
              <span>Analytics & Sales</span>
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-emerald-900 mt-10">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-emerald-800 rounded-full flex items-center justify-center text-emerald-300 font-bold border border-emerald-700">
              V
            </div>
            <div>
              <p className="font-bold text-sm text-white truncate">Authorized Seller</p>
              <button 
                onClick={fetchDashboardData}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 mt-0.5 transition-colors"
              >
                <HiOutlineRefresh className={`${loading ? 'animate-spin' : ''}`} /> Refresh Portal
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-6 md:p-10 lg:p-12 overflow-x-hidden">
        
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex items-center gap-5">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center text-2xl">
              <HiCurrencyRupee />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Est. Revenue</p>
              <h3 className="text-2xl font-black text-slate-800">₹{stats.revenue.toLocaleString('en-IN')}</h3>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex items-center gap-5">
            <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center text-2xl">
              <HiOutlineCube />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Items</p>
              <h3 className="text-2xl font-black text-slate-800">{products.length} Products</h3>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex items-center gap-5">
            <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-2xl">
              <HiClock />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Fulfillment</p>
              <h3 className="text-2xl font-black text-slate-800">{stats.pending} Pending</h3>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex items-center gap-5">
            <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center text-2xl">
              <HiCheckCircle />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Units Dispensed</p>
              <h3 className="text-2xl font-black text-slate-800">{stats.units} units</h3>
            </div>
          </div>
        </div>

        {/* Tab Content: Inventory */}
        {activeTab === 'inventory' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Product Inventory</h1>
                <p className="text-slate-500 mt-1 font-medium">Manage and upload medical items, prescription checks, and batch detail sheets.</p>
              </div>
              <button 
                onClick={() => { resetForm(); setShowModal(true); }}
                className="bg-emerald-500 text-white px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all duration-300"
              >
                <HiOutlinePlus size={20} /> Add New Medicine
              </button>
            </div>

            {/* Inventory Table Container */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-400 text-xs uppercase tracking-widest font-extrabold border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-5">Product Details</th>
                      <th className="px-8 py-5">Category & Formulation</th>
                      <th className="px-8 py-5">Price</th>
                      <th className="px-8 py-5">Stock & Expiry</th>
                      <th className="px-8 py-5">Rx Requirement</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="p-16 text-center text-slate-400 font-bold">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <HiOutlineRefresh className="animate-spin text-3xl text-emerald-500" />
                            Loading products database...
                          </div>
                        </td>
                      </tr>
                    ) : products.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-16 text-center text-slate-400">
                          <div className="max-w-md mx-auto py-6">
                            <p className="text-lg font-black text-slate-600 mb-2">No medicines registered yet</p>
                            <p className="text-sm text-slate-400">Get started by clicking the "Add New Medicine" button above to populate your inventory.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      products.map((p) => {
                        const imgUrl = p.image 
                          ? (p.image.startsWith('http') || p.image.startsWith('/') ? `${API.defaults.baseURL.replace('/api', '')}${p.image}` : p.image)
                          : 'https://via.placeholder.com/150?text=Medicine';

                        return (
                          <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 overflow-hidden flex-shrink-0">
                                  <img 
                                    src={imgUrl} 
                                    alt={p.name}
                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Medicine'; }}
                                    className="max-h-full max-w-full object-cover" 
                                  />
                                </div>
                                <div>
                                  <span className="font-extrabold text-slate-800 text-base hover:text-emerald-600 transition-colors block">{p.name}</span>
                                  <span className="text-slate-400 text-xs block mt-0.5">Mfg: <strong className="text-slate-500 font-semibold">{p.manufacturer || 'N/A'}</strong></span>
                                  <span className="text-slate-400 text-xs block">Batch: <strong className="text-slate-500 font-semibold">{p.batchNo || 'N/A'}</strong></span>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex flex-col gap-1">
                                <span className="bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-xl text-xs w-fit">{p.category}</span>
                                <span className="text-slate-500 text-xs font-medium ml-1">{p.formulation} | {p.strength || 'N/A'}</span>
                              </div>
                            </td>
                            <td className="px-8 py-5 font-black text-slate-800 text-base">
                              ₹{p.price}
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex flex-col">
                                <span className={`font-black text-sm ${p.stock < 15 ? 'text-red-500' : 'text-slate-700'}`}>
                                  {p.stock} units
                                </span>
                                <span className="text-slate-400 text-xs mt-1">
                                  Exp: {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              {p.requiresPrescription ? (
                                <div className="flex items-center gap-1.5 text-rose-500 font-bold text-xs uppercase tracking-wider bg-rose-50 px-3 py-1.5 rounded-full w-fit">
                                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
                                  Requires Rx
                                </div>
                              ) : (
                                <span className="text-blue-500 font-bold text-xs uppercase tracking-wider bg-blue-50 px-3 py-1.5 rounded-full w-fit">
                                  OTC (General)
                                </span>
                              )}
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => handleEditClick(p)}
                                  className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all duration-300"
                                  title="Edit Medicine Details"
                                >
                                  <HiOutlinePencil size={18} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteClick(p._id)}
                                  className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-300"
                                  title="Delete Item"
                                >
                                  <HiOutlineTrash size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Client Orders */}
        {activeTab === 'orders' && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Client Orders</h1>
              <p className="text-slate-500 mt-1 font-medium">Verify prescription checks, manage payment confirmations, and dispatch medicine products.</p>
            </div>

            {/* Orders Feed */}
            <div className="space-y-6">
              {loading ? (
                <div className="bg-white rounded-[2.5rem] p-16 text-center text-slate-400 shadow-sm border border-slate-100">
                  <HiOutlineRefresh className="animate-spin text-4xl text-emerald-500 mx-auto mb-4" />
                  Loading client orders feed...
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-16 text-center text-slate-400 shadow-sm border border-slate-100 max-w-2xl mx-auto">
                  <HiOutlineShoppingCart className="text-5xl text-slate-300 mx-auto mb-4" />
                  <p className="text-lg font-black text-slate-600 mb-2">No client orders yet</p>
                  <p className="text-sm text-slate-400">When customers order medicines uploaded by your store, the details will appear here instantly for processing.</p>
                </div>
              ) : (
                orders.map((order) => {
                  // Filter order items to only show the ones belonging to this vendor's catalogue
                  const vendorProductIds = products.map(p => p._id);
                  const vendorItems = order.items.filter(item => {
                    const itemProdId = item.product?._id || item.product;
                    return vendorProductIds.includes(itemProdId);
                  });

                  if (vendorItems.length === 0) return null; // Fallback filter just in case

                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={order._id} 
                      className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden"
                    >
                      {/* Header bar of the order */}
                      <div className="bg-slate-50/70 px-8 py-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Order ID:</span>
                            <span className="font-extrabold text-slate-800 text-sm">{order._id}</span>
                            <span className="bg-slate-200 text-slate-600 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                              {order.paymentMethod}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">Placed on: <span className="font-medium text-slate-500">{new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}</span></p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-slate-400 font-bold text-xs uppercase tracking-wider block text-left md:text-right">Fulfillment Status</span>
                            <select 
                              value={order.status} 
                              onChange={(e) => handleOrderStatusUpdate(order._id, e.target.value)}
                              className={`mt-1 font-bold text-xs rounded-xl py-1.5 px-3 border outline-none cursor-pointer transition-all ${
                                order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                order.status === 'Cancelled' ? 'bg-rose-50 text-rose-500 border-rose-200' :
                                order.status === 'Shipped' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                'bg-amber-50 text-amber-600 border-amber-200 animate-pulse'
                              }`}
                            >
                              <option value="Pending">Pending Approval</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Shipped">Dispatched</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Content of the order */}
                      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Order Items belonging to this Vendor */}
                        <div className="lg:col-span-2 space-y-4">
                          <h4 className="font-bold text-slate-500 text-xs uppercase tracking-widest mb-3">Order Items (From your stock)</h4>
                          {vendorItems.map((item, idx) => {
                            const prodName = item.product?.name || 'Unknown Product';
                            const prodCategory = item.product?.category || 'General';
                            
                            return (
                              <div key={idx} className="flex items-center justify-between border-b border-slate-50 pb-4 last:border-b-0 last:pb-0">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 font-extrabold">
                                    💊
                                  </div>
                                  <div>
                                    <h5 className="font-bold text-slate-800 text-sm">{prodName}</h5>
                                    <p className="text-xs text-slate-400">{prodCategory} | Price: ₹{item.price}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="font-extrabold text-slate-800 text-sm block">Qty: {item.quantity}</span>
                                  <span className="font-black text-emerald-600 text-sm mt-0.5 block">₹{item.price * item.quantity}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Customer & Shipping Detail Panel */}
                        <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-50">
                          <h4 className="font-bold text-slate-500 text-xs uppercase tracking-widest mb-4 flex items-center gap-1.5">
                            <HiOutlineUserCircle size={16} /> Customer Details
                          </h4>
                          
                          <div className="space-y-4">
                            <div>
                              <p className="text-xs text-slate-400 font-bold uppercase">Name</p>
                              <p className="text-sm font-extrabold text-slate-700 mt-0.5">{order.user?.name || 'Guest User'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 font-bold uppercase">Contact</p>
                              <p className="text-sm font-bold text-slate-600 mt-0.5">{order.user?.email || 'N/A'}</p>
                              <p className="text-sm font-bold text-slate-600">{order.user?.phone || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 font-bold uppercase">Shipping Address</p>
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                {order.shippingAddress?.street}, {order.shippingAddress?.city},<br />
                                {order.shippingAddress?.state} - {order.shippingAddress?.zipCode},<br />
                                {order.shippingAddress?.country}
                              </p>
                            </div>
                            <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                              <div>
                                <p className="text-xs text-slate-400 font-bold uppercase">Payment Status</p>
                                <span className={`text-[10px] font-black uppercase tracking-wider block mt-1 ${
                                  order.paymentStatus === 'Completed' ? 'text-emerald-600' : 'text-amber-500'
                                }`}>
                                  ● {order.paymentStatus}
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-slate-400 font-bold uppercase">Order Total</p>
                                <p className="text-base font-black text-slate-800 mt-0.5">₹{order.totalAmount}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab Content: Analytics & Sales */}
        {activeTab === 'sales' && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Analytics & Reports</h1>
              <p className="text-slate-500 mt-1 font-medium">Real-time statistics regarding your store's items, dispensing activity, and cumulative earnings.</p>
            </div>

            {/* Sales Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-between h-56">
                <div>
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Aggregate Sales</span>
                  <h2 className="text-4xl font-black text-slate-800 mt-4">₹{stats.revenue.toLocaleString('en-IN')}</h2>
                </div>
                <p className="text-xs text-emerald-500 font-bold">↑ 100% organic vendor metrics</p>
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-between h-56">
                <div>
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Orders Received</span>
                  <h2 className="text-4xl font-black text-slate-800 mt-4">{stats.totalOrdersCount} Orders</h2>
                </div>
                <p className="text-xs text-blue-500 font-bold">Across OTC & prescription items</p>
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-between h-56">
                <div>
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Medicine Units Sold</span>
                  <h2 className="text-4xl font-black text-slate-800 mt-4">{stats.units} Units</h2>
                </div>
                <p className="text-xs text-amber-500 font-bold">Avg. price/item: ₹{(stats.revenue / (stats.units || 1)).toFixed(2)}</p>
              </div>
            </div>

            {/* Sales Breakdown Graph (CSS based) */}
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-8 mt-10">
              <h3 className="text-lg font-black text-slate-800 mb-6">Stock Status vs Sales Activity</h3>
              <div className="space-y-6">
                {products.map((p, idx) => {
                  const stockPct = Math.min(100, (p.stock / 100) * 100);
                  
                  return (
                    <div key={idx} className="flex items-center justify-between gap-4">
                      <div className="w-1/3">
                        <span className="font-bold text-slate-800 text-sm block truncate">{p.name}</span>
                        <span className="text-slate-400 text-xs">{p.category}</span>
                      </div>
                      <div className="w-1/2 bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            p.stock < 15 ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${stockPct}%` }}
                        ></div>
                      </div>
                      <div className="w-1/6 text-right">
                        <span className="font-bold text-slate-700 text-xs block">{p.stock} in stock</span>
                        <span className="text-slate-400 text-[10px]">₹{p.price} / unit</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Add / Edit Product Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            ></motion.div>
            
            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[3.5rem] p-10 w-full max-w-3xl relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                    {editingProduct ? 'Edit Medicine' : 'Add New Medicine'}
                  </h2>
                  <p className="text-slate-400 text-xs mt-1 font-medium uppercase tracking-wider">Product Inventory Database Sheet</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center font-bold text-sm transition-all"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Image Upload Row */}
                <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col md:flex-row items-center gap-6">
                  <div className="w-28 h-28 bg-white border border-slate-100 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
                    {imagePreview ? (
                      <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <span className="text-slate-300 text-3xl">💊</span>
                    )}
                  </div>
                  <div className="flex-grow space-y-2">
                    <h4 className="font-bold text-slate-700 text-sm">Medicine Image Source File</h4>
                    <p className="text-xs text-slate-400 leading-normal">Provide a JPG/PNG/WEBP clear preview image. Minimum size 300x300 recommended.</p>
                    <label className="bg-white border border-slate-200 text-slate-600 text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 active:scale-95 transition-all w-fit mt-2">
                      <HiOutlineUpload className="text-sm text-emerald-500" />
                      Upload File
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageChange} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Medicine Name</label>
                    <input 
                      required 
                      type="text"
                      name="name"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all font-semibold" 
                      placeholder="Paracetamol, Amoxicillin, etc."
                      value={productForm.name} 
                      onChange={handleInputChange} 
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Therapeutic Category</label>
                    <select
                      name="category"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all font-semibold"
                      value={productForm.category}
                      onChange={handleInputChange}
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Price */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Sales Price (₹)</label>
                    <input 
                      required 
                      type="number"
                      name="price"
                      min="1"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all font-semibold" 
                      placeholder="Price per unit strip"
                      value={productForm.price} 
                      onChange={handleInputChange} 
                    />
                  </div>

                  {/* Stock */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Initial Stock Units</label>
                    <input 
                      required 
                      type="number"
                      name="stock"
                      min="0"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all font-semibold" 
                      placeholder="Available inventory count"
                      value={productForm.stock} 
                      onChange={handleInputChange} 
                    />
                  </div>

                  {/* Formulation */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Dosage Form / Formulation</label>
                    <select
                      name="formulation"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all font-semibold"
                      value={productForm.formulation}
                      onChange={handleInputChange}
                    >
                      {FORMULATIONS.map(form => (
                        <option key={form} value={form}>{form}</option>
                      ))}
                    </select>
                  </div>

                  {/* Strength */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Strength (e.g. 500mg, 10ml)</label>
                    <input 
                      required
                      type="text"
                      name="strength"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all font-semibold" 
                      placeholder="Active ingredient strength"
                      value={productForm.strength} 
                      onChange={handleInputChange} 
                    />
                  </div>

                  {/* Manufacturer */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Pharmaceutical Manufacturer</label>
                    <input 
                      required
                      type="text"
                      name="manufacturer"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all font-semibold" 
                      placeholder="Cipla, Sun Pharma, etc."
                      value={productForm.manufacturer} 
                      onChange={handleInputChange} 
                    />
                  </div>

                  {/* Batch Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Batch Number</label>
                    <input 
                      required
                      type="text"
                      name="batchNo"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all font-semibold" 
                      placeholder="Manufacturing Batch ID"
                      value={productForm.batchNo} 
                      onChange={handleInputChange} 
                    />
                  </div>

                  {/* Expiry Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Expiry Date</label>
                    <input 
                      required
                      type="date"
                      name="expiryDate"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all font-semibold" 
                      value={productForm.expiryDate} 
                      onChange={handleInputChange} 
                    />
                  </div>

                  {/* Dosage */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Recommended Dosage Info</label>
                    <input 
                      type="text"
                      name="dosage"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all font-semibold" 
                      placeholder="Once daily, post meal, etc."
                      value={productForm.dosage} 
                      onChange={handleInputChange} 
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Product Description / Indications</label>
                  <textarea 
                    required
                    name="description"
                    rows="3"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all font-semibold resize-none" 
                    placeholder="Provide details about therapeutic use, warnings, and safe storage instructions."
                    value={productForm.description} 
                    onChange={handleInputChange} 
                  />
                </div>

                {/* Prescription Status */}
                <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      id="requiresPrescription" 
                      name="requiresPrescription"
                      className="w-5 h-5 accent-emerald-500 rounded cursor-pointer" 
                      checked={productForm.requiresPrescription} 
                      onChange={handleInputChange} 
                    />
                    <label htmlFor="requiresPrescription" className="font-bold text-slate-700 text-sm cursor-pointer select-none">
                      Requires Doctor Prescription (Rx)
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-slate-500 uppercase select-none">Prescription Type</label>
                    <select
                      name="prescriptionType"
                      className="bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs font-bold outline-none cursor-pointer"
                      value={productForm.prescriptionType}
                      onChange={handleInputChange}
                    >
                      <option value="OTC">OTC (Over the Counter)</option>
                      <option value="Rx">Rx (Prescription Only)</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button 
                    type="submit" 
                    className="flex-1 bg-emerald-500 text-white font-extrabold py-4 rounded-2xl text-base shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95 transition-all duration-300"
                  >
                    Save Product
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)} 
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 font-extrabold py-4 rounded-2xl text-base transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default VendorDashboard;
