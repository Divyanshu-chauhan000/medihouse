import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchProducts } from '../store/slices/productSlice';
import ProductCard from '../components/product/ProductCard';
import { HiOutlineFilter, HiOutlineSearch, HiX } from 'react-icons/hi';

const Medicines = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, loading, pagination } = useSelector((state) => state.products);
  
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    search: searchParams.get('search') || '',
    requiresPrescription: searchParams.get('requiresPrescription') || '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'newest'
  });

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    const params = {
      page: searchParams.get('page') || 1,
      limit: 12,
      category: filters.category,
      search: filters.search,
      requiresPrescription: filters.requiresPrescription === 'true' ? true : filters.requiresPrescription === 'false' ? false : undefined,
      sortBy: filters.sortBy
    };
    dispatch(fetchProducts(params));
  }, [dispatch, searchParams, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const categories = [
    'Pain Relief', 'Antibiotics', 'Vitamins', 'Cold & Flu', 'Digestive', 'Skin Care', 'Supplements', 'First Aid'
  ];

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-12 mb-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-black text-slate-900 mb-4">All Medicines & Healthcare</h1>
          <p className="text-slate-500">Showing {products.length} products</p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-72 space-y-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <HiOutlineFilter className="text-primary" /> Filters
              </h3>

              {/* Categories */}
              <div className="mb-8">
                <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4">Categories</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="category" 
                      value="" 
                      checked={filters.category === ''}
                      onChange={handleFilterChange}
                      className="w-4 h-4 text-primary focus:ring-primary border-slate-300"
                    />
                    <span className={`group-hover:text-primary transition-colors ${filters.category === '' ? 'text-primary font-bold' : 'text-slate-600'}`}>
                      All Categories
                    </span>
                  </label>
                  {categories.map((cat) => (
                    <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="category" 
                        value={cat} 
                        checked={filters.category === cat}
                        onChange={handleFilterChange}
                        className="w-4 h-4 text-primary focus:ring-primary border-slate-300"
                      />
                      <span className={`group-hover:text-primary transition-colors ${filters.category === cat ? 'text-primary font-bold' : 'text-slate-600'}`}>
                        {cat}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Prescription */}
              <div className="mb-8">
                <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4">Prescription</h4>
                <div className="space-y-3">
                  {[
                    { label: 'All', value: '' },
                    { label: 'Rx Required', value: 'true' },
                    { label: 'No Rx Needed', value: 'false' }
                  ].map((opt) => (
                    <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="requiresPrescription" 
                        value={opt.value} 
                        checked={filters.requiresPrescription === opt.value}
                        onChange={handleFilterChange}
                        className="w-4 h-4 text-primary focus:ring-primary border-slate-300"
                      />
                      <span className={`group-hover:text-primary transition-colors ${filters.requiresPrescription === opt.value ? 'text-primary font-bold' : 'text-slate-600'}`}>
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div>
                <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4">Sort By</h4>
                <select 
                  name="sortBy"
                  value={filters.sortBy}
                  onChange={handleFilterChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-primary/20"
                >
                  <option value="newest">Newest First</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <main className="flex-1">
            {/* Search and Mobile Filter Toggle */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex-1 relative">
                <input
                  type="text"
                  name="search"
                  placeholder="Search for medicines..."
                  className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-primary/20"
                  value={filters.search}
                  onChange={handleFilterChange}
                />
                <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-2xl" />
              </div>
              <button 
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden flex items-center justify-center gap-2 bg-white border border-slate-200 rounded-2xl py-4 px-6 shadow-sm font-bold text-slate-700"
              >
                <HiOutlineFilter /> Filters
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white h-[400px] rounded-2xl animate-pulse"></div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-white p-20 rounded-[3rem] text-center border border-slate-100 shadow-sm">
                <div className="text-6xl mb-6">🔍</div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">No products found</h2>
                <p className="text-slate-500 mb-8">Try adjusting your filters or search terms</p>
                <button 
                  onClick={() => setFilters({ category: '', search: '', requiresPrescription: '', minPrice: '', maxPrice: '', sortBy: 'newest' })}
                  className="btn-primary"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Pagination Placeholder */}
            {pagination.pages > 1 && (
              <div className="mt-12 flex justify-center gap-2">
                {[...Array(pagination.pages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: i + 1 })}
                    className={`w-12 h-12 rounded-xl font-bold transition-all ${
                      pagination.page === i + 1 
                        ? 'bg-primary text-white shadow-lg' 
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)}></div>
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold">Filters</h3>
              <button onClick={() => setShowMobileFilters(false)} className="text-slate-400 hover:text-slate-900">
                <HiX size={24} />
              </button>
            </div>
            {/* Same filter content as desktop sidebar */}
            <div className="space-y-8 overflow-y-auto max-h-[calc(100vh-150px)]">
               {/* Categories */}
              <div>
                <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4">Categories</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input type="radio" name="category_m" value="" checked={filters.category === ''} onChange={(e) => setFilters(p => ({...p, category: ''}))} />
                    <span>All</span>
                  </label>
                  {categories.map(cat => (
                    <label key={cat} className="flex items-center gap-3">
                      <input type="radio" name="category_m" value={cat} checked={filters.category === cat} onChange={(e) => setFilters(p => ({...p, category: e.target.value}))} />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowMobileFilters(false)}
              className="w-full btn-primary mt-8"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Medicines;
