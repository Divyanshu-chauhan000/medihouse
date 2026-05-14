import { useEffect, useState } from 'react';
import API from '../../api/client';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineChartBar, HiOutlineCube } from 'react-icons/hi';
import { motion } from 'framer-motion';

const VendorDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    description: '',
    category: 'Medicines',
    stock: '',
    requiresPrescription: false
  });

  useEffect(() => {
    const fetchVendorProducts = async () => {
      try {
        const response = await API.get('/products/vendor'); // Backend needs this route
        setProducts(response.data.products);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVendorProducts();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await API.post('/products', newProduct);
      setProducts([...products, response.data.product]);
      setShowAddModal(false);
      setNewProduct({ name: '', price: '', description: '', category: 'Medicines', stock: '', requiresPrescription: false });
    } catch (error) {
      alert('Failed to add product');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
       <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 bg-emerald-900 lg:min-h-screen p-6 text-white">
          <div className="mb-12">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="text-emerald-400">✚</span> Vendor Portal
            </h2>
          </div>
          <nav className="space-y-4">
            <button className="w-full text-left p-4 bg-emerald-700 rounded-2xl flex items-center gap-3">
              <HiOutlineCube /> Inventory
            </button>
            <button className="w-full text-left p-4 hover:bg-emerald-800 rounded-2xl flex items-center gap-3 transition-all">
              <HiOutlineChartBar /> Sales Report
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 md:p-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-12">
              <h1 className="text-4xl font-black text-slate-900">Manage Inventory</h1>
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-secondary text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
              >
                <HiOutlinePlus /> Add New Product
              </button>
            </div>

            {/* Product Table */}
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-400 text-xs uppercase tracking-widest font-bold">
                    <tr>
                      <th className="px-8 py-4">Product</th>
                      <th className="px-8 py-4">Category</th>
                      <th className="px-8 py-4">Price</th>
                      <th className="px-8 py-4">Stock</th>
                      <th className="px-8 py-4">Status</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      <tr><td colSpan="6" className="p-12 text-center text-slate-400">Loading products...</td></tr>
                    ) : products.length === 0 ? (
                      <tr><td colSpan="6" className="p-12 text-center text-slate-400">No products in your inventory.</td></tr>
                    ) : (
                      products.map((p) => (
                        <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                                <img src={p.image || 'https://via.placeholder.com/50'} className="max-h-full" />
                              </div>
                              <span className="font-bold text-slate-800">{p.name}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-slate-500">{p.category}</td>
                          <td className="px-8 py-6 font-bold text-slate-900">${p.price}</td>
                          <td className="px-8 py-6">
                            <span className={`font-bold ${p.stock < 10 ? 'text-red-500' : 'text-slate-600'}`}>
                              {p.stock} units
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            {p.requiresPrescription ? (
                              <span className="bg-red-50 text-red-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase">Rx</span>
                            ) : (
                              <span className="bg-blue-50 text-blue-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase">OTC</span>
                            )}
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex justify-end gap-2">
                              <button className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                                <HiOutlinePencil size={18} />
                              </button>
                              <button className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                                <HiOutlineTrash size={18} />
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

      {/* Add Product Modal (Simple) */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[3rem] p-10 w-full max-w-2xl relative z-10"
          >
            <h2 className="text-3xl font-black mb-8">Add Product</h2>
            <form onSubmit={handleAddProduct} className="grid grid-cols-2 gap-6">
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-bold text-slate-700">Product Name</label>
                <input required className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Price ($)</label>
                <input type="number" required className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Stock</label>
                <input type="number" required className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6" value={newProduct.stock} onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})} />
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <input type="checkbox" id="rx" className="w-5 h-5 rounded" checked={newProduct.requiresPrescription} onChange={(e) => setNewProduct({...newProduct, requiresPrescription: e.target.checked})} />
                <label htmlFor="rx" className="font-bold text-slate-700">Requires Prescription (Rx)</label>
              </div>
              <div className="col-span-2 flex gap-4 mt-4">
                <button type="submit" className="flex-1 btn-secondary py-4">Save Product</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-100 text-slate-500 font-bold rounded-2xl">Cancel</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;
