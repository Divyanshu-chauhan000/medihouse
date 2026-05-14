import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchCart, removeFromCart, updateQuantity } from '../store/slices/cartSlice';
import { HiOutlineTrash, HiOutlineArrowLeft, HiOutlineShieldCheck } from 'react-icons/hi';
import { motion } from 'framer-motion';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, loading } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      dispatch(fetchCart());
    }
  }, [dispatch, user]);

  const subtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const shipping = subtotal > 500 ? 0 : 50;
  const total = subtotal + shipping;

  const handleRemove = (id) => {
    dispatch(removeFromCart(id));
  };

  const handleQtyChange = (productId, quantity) => {
    if (quantity < 1) return;
    dispatch(updateQuantity({ productId, quantity }));
  };

  const handleCheckout = () => {
    // Check for prescription requirement
    const needsPrescription = items.some(item => item.product.requiresPrescription);
    if (needsPrescription) {
      navigate('/prescriptions/upload');
    } else {
      navigate('/checkout');
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Please login to view your cart</h2>
        <Link to="/login" className="btn-primary">Login Now</Link>
      </div>
    );
  }

  if (loading && items.length === 0) {
    return <div className="container mx-auto px-4 py-20 text-center">Loading cart...</div>;
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-black text-slate-900 mb-12">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="bg-white rounded-[3rem] p-20 text-center shadow-sm border border-slate-100">
            <div className="text-8xl mb-8">🛒</div>
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Your cart is empty</h2>
            <p className="text-slate-500 mb-10 text-lg">Looks like you haven't added anything yet.</p>
            <Link to="/medicines" className="btn-primary py-4 px-12 text-lg">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {items.map((item) => (
                <motion.div 
                  layout
                  key={item.product._id} 
                  className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-center"
                >
                  <div className="w-32 h-32 bg-slate-50 rounded-2xl p-4 flex items-center justify-center shrink-0">
                    <img src={item.product.image || 'https://via.placeholder.com/150'} alt={item.product.name} className="max-h-full object-contain" />
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-slate-800">{item.product.name}</h3>
                      {item.product.requiresPrescription && (
                        <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit mx-auto md:mx-0">Rx Required</span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm mb-4">Manufacturer: {item.product.manufacturer}</p>
                    <div className="flex items-center justify-center md:justify-start gap-4">
                      <div className="flex items-center bg-slate-100 rounded-full px-3 py-1">
                        <button onClick={() => handleQtyChange(item.product._id, item.quantity - 1)} className="w-8 h-8 font-bold text-lg">-</button>
                        <span className="w-10 text-center font-bold">{item.quantity}</span>
                        <button onClick={() => handleQtyChange(item.product._id, item.quantity + 1)} className="w-8 h-8 font-bold text-lg">+</button>
                      </div>
                      <span className="text-2xl font-black text-slate-900">${item.product.price * item.quantity}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleRemove(item.product._id)}
                    className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <HiOutlineTrash size={20} />
                  </button>
                </motion.div>
              ))}

              <Link to="/medicines" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
                <HiOutlineArrowLeft /> Continue Shopping
              </Link>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl sticky top-28">
                <h3 className="text-2xl font-bold text-slate-900 mb-8">Order Summary</h3>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-900">${subtotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Shipping</span>
                    <span className="font-bold text-slate-900">{shipping === 0 ? 'FREE' : `$${shipping}`}</span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded-lg">
                      Add ${500 - subtotal} more for free shipping
                    </p>
                  )}
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xl font-bold text-slate-900">Total</span>
                    <span className="text-3xl font-black text-primary">${total}</span>
                  </div>
                </div>

                <button 
                  onClick={handleCheckout}
                  className="w-full btn-primary py-5 text-xl mb-6 shadow-blue-200 shadow-2xl"
                >
                  Proceed to Checkout
                </button>

                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-3 text-slate-500 text-sm">
                    <HiOutlineShieldCheck className="text-secondary text-xl" />
                    <span>Safe & Secure Payments</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
