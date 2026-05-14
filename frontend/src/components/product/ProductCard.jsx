import { Link } from 'react-router-dom';
import { HiOutlineShoppingCart, HiOutlineHeart, HiHeart } from 'react-icons/hi';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../store/slices/cartSlice';
import { toggleWishlist } from '../../store/slices/wishlistSlice';
import { motion } from 'framer-motion';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const { items: wishlistItems } = useSelector((state) => state.wishlist);
  const isInWishlist = wishlistItems.some(item => item._id === product._id);

  const handleAddToCart = (e) => {
    e.preventDefault();
    dispatch(addToCart({ productId: product._id, quantity: 1 }));
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    dispatch(toggleWishlist(product._id));
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="card group"
    >
      <Link to={`/product/${product._id}`} className="block relative aspect-square overflow-hidden bg-slate-50">
        <img 
          src={product.image || 'https://placehold.co/400x400/EEE/31343C?text=Medicine'} 
          alt={product.name}
          onError={(e) => { e.target.src = 'https://placehold.co/400x400/EEE/31343C?text=Medicine'; e.target.onerror = null; }}
          className="w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.requiresPrescription && (
            <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider border border-red-200">
              Rx Required
            </span>
          )}
          {product.stock <= 0 && (
            <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
              Out of Stock
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button 
          onClick={handleWishlist}
          className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            isInWishlist ? 'bg-red-50 text-red-500' : 'bg-white/80 text-slate-400 hover:text-red-500'
          }`}
        >
          {isInWishlist ? <HiHeart size={20} /> : <HiOutlineHeart size={20} />}
        </button>
      </Link>

      <div className="p-5">
        <Link to={`/product/${product._id}`} className="block">
          <p className="text-xs text-slate-400 mb-1 uppercase font-semibold tracking-wide">
            {product.category}
          </p>
          <h3 className="text-lg font-bold text-slate-800 mb-2 truncate group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex items-center justify-between mt-4">
          <div>
            <span className="text-2xl font-black text-slate-900">${product.price}</span>
            {product.mrp && (
              <span className="ml-2 text-sm text-slate-400 line-through">${product.mrp}</span>
            )}
          </div>
          
          <button 
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              product.stock <= 0 
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
            }`}
          >
            <HiOutlineShoppingCart size={22} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
