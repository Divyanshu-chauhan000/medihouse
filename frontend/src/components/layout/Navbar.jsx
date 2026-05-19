import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { 
  HiOutlineShoppingCart, 
  HiOutlineHeart, 
  HiOutlineUser, 
  HiOutlineSearch,
  HiOutlineMenuAlt3,
  HiX
} from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useSelector((state) => state.auth);
  const { items: cartItems } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userName = user?.name || 'User';
  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/medicines?search=${searchQuery}`);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-white text-2xl font-bold">+</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              MediHouse
            </span>
          </Link>

          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-8 relative">
            <input
              type="text"
              placeholder="Search medicines, healthcare products..."
              className="w-full bg-slate-50 border-none rounded-full py-2.5 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
          </form>

          {/* Desktop Nav Actions */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/medicines" className="text-slate-600 hover:text-primary font-medium transition-colors">
              Medicines
            </Link>
            <Link to="/wishlist" className="relative text-slate-600 hover:text-primary transition-colors">
              <HiOutlineHeart className="text-2xl" />
            </Link>
            <Link to="/cart" className="relative text-slate-600 hover:text-primary transition-colors">
              <HiOutlineShoppingCart className="text-2xl" />
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-secondary text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {cartItems.length}
                </span>
              )}
            </Link>
            
            {user ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 text-slate-600 hover:text-primary font-medium">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <HiOutlineUser />
                  </div>
                  <span>{userName.split(' ')[0]}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link to="/orders" className="block px-4 py-2 hover:bg-slate-50">My Orders</Link>
                  {user.role === 'admin' && <Link to="/admin" className="block px-4 py-2 hover:bg-slate-50">Admin Panel</Link>}
                  {user.role === 'vendor' && <Link to="/vendor" className="block px-4 py-2 hover:bg-slate-50">Vendor Dashboard</Link>}
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50">Logout</button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="btn-primary py-2 px-6">
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-slate-600 p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <HiX size={28} /> : <HiOutlineMenuAlt3 size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-slate-100 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
              </form>
              <Link to="/medicines" className="block text-slate-600 font-medium py-2">Medicines</Link>
              <Link to="/wishlist" className="block text-slate-600 font-medium py-2">Wishlist</Link>
              <Link to="/cart" className="block text-slate-600 font-medium py-2">Cart ({cartItems.length})</Link>
              {user ? (
                <>
                  <Link to="/orders" className="block text-slate-600 font-medium py-2">My Orders</Link>
                  <button onClick={handleLogout} className="block text-red-500 font-medium py-2">Logout</button>
                </>
              ) : (
                <Link to="/login" className="btn-primary block text-center">Login</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
