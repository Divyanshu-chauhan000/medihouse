import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductById, clearProduct } from '../store/slices/productSlice';
import { addToCart } from '../store/slices/cartSlice';
import { HiOutlineShoppingCart, HiOutlineHeart, HiOutlineShieldCheck, HiOutlineTruck, HiOutlineClock } from 'react-icons/hi';
import { motion } from 'framer-motion';

const ProductDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { product, loading, error } = useSelector((state) => state.products);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    dispatch(fetchProductById(id));
    return () => dispatch(clearProduct());
  }, [dispatch, id]);

  const handleAddToCart = () => {
    dispatch(addToCart({ productId: product._id, quantity }));
  };

  if (loading) return <div className="container mx-auto px-4 py-20 text-center">Loading product...</div>;
  if (error) return <div className="container mx-auto px-4 py-20 text-center text-red-500">{error}</div>;
  if (!product) return null;

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="flex mb-8 text-sm text-slate-400">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/medicines" className="hover:text-primary transition-colors">Medicines</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-600 font-medium">{product.name}</span>
        </nav>

        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="grid md:grid-cols-2 gap-12 p-8 md:p-16">
            {/* Image Section */}
            <div className="space-y-6">
              <div className="aspect-square bg-slate-50 rounded-[2rem] overflow-hidden p-12 flex items-center justify-center">
                <motion.img 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={product.image || 'https://via.placeholder.com/600x600?text=Medicine'} 
                  alt={product.name}
                  className="max-h-full object-contain"
                />
              </div>
              <div className="grid grid-cols-4 gap-4">
                 {[...Array(4)].map((_, i) => (
                   <div key={i} className="aspect-square bg-slate-50 rounded-2xl border border-slate-100 p-2 cursor-pointer hover:border-primary transition-all">
                     <img src={product.image || 'https://via.placeholder.com/150x150?text=Alt'} className="w-full h-full object-contain" />
                   </div>
                 ))}
              </div>
            </div>

            {/* Info Section */}
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase">
                    {product.category}
                  </span>
                  {product.requiresPrescription && (
                    <span className="bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full uppercase">
                      Rx Required
                    </span>
                  )}
                </div>
                <h1 className="text-4xl font-black text-slate-900 mb-2">{product.name}</h1>
                <p className="text-slate-400">Manufacturer: <span className="text-slate-700 font-medium">{product.manufacturer}</span></p>
              </div>

              <div className="flex items-end gap-4">
                <span className="text-5xl font-black text-slate-900">${product.price}</span>
                {product.mrp && (
                  <span className="text-xl text-slate-400 line-through mb-1">${product.mrp}</span>
                )}
                <span className="text-secondary font-bold mb-1">Save 15%</span>
              </div>

              <p className="text-slate-600 leading-relaxed text-lg">
                {product.description}
              </p>

              {/* Product Specs */}
              <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50 rounded-3xl">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Dosage</p>
                  <p className="font-bold">{product.dosage || 'As directed by physician'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Expiry Date</p>
                  <p className="font-bold text-red-500">{new Date(product.expiryDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Formulation</p>
                  <p className="font-bold">{product.formulation || 'Tablet'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Availability</p>
                  <p className={`font-bold ${product.stock > 0 ? 'text-secondary' : 'text-red-500'}`}>
                    {product.stock > 0 ? `In Stock (${product.stock} units)` : 'Out of Stock'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center bg-slate-100 rounded-full px-4 py-2">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center font-bold text-xl hover:text-primary"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-bold">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                    className="w-10 h-10 flex items-center justify-center font-bold text-xl hover:text-primary"
                  >
                    +
                  </button>
                </div>
                <button 
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className="flex-1 btn-primary py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <HiOutlineShoppingCart size={24} /> Add to Cart
                </button>
                <button className="w-16 h-16 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                  <HiOutlineHeart size={28} />
                </button>
              </div>

              {/* Badges */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-100">
                <div className="flex flex-col items-center text-center gap-2">
                  <HiOutlineShieldCheck className="text-primary text-2xl" />
                  <span className="text-[10px] font-bold uppercase text-slate-400">100% Genuine</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <HiOutlineTruck className="text-primary text-2xl" />
                  <span className="text-[10px] font-bold uppercase text-slate-400">Free Delivery</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <HiOutlineClock className="text-primary text-2xl" />
                  <span className="text-[10px] font-bold uppercase text-slate-400">7 Days Return</span>
                </div>
              </div>

              {/* Reviews Section */}
              <div className="pt-12 mt-12 border-t border-slate-100">
                <h3 className="text-2xl font-bold text-slate-900 mb-8">Customer Reviews</h3>
                <div className="space-y-6">
                  {product.reviews?.length > 0 ? (
                    product.reviews.map((review, i) => (
                      <div key={i} className="bg-slate-50 p-6 rounded-2xl">
                        <div className="flex justify-between mb-2">
                          <p className="font-bold">{review.name}</p>
                          <div className="flex text-amber-400">
                            {[...Array(5)].map((_, j) => (
                              <span key={j}>{j < review.rating ? '★' : '☆'}</span>
                            ))}
                          </div>
                        </div>
                        <p className="text-slate-600 text-sm">{review.comment}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 italic">No reviews yet. Be the first to review this product!</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
