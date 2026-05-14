import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearCartLocal } from '../store/slices/cartSlice';
import API from '../api/client';
import { HiOutlineCreditCard, HiOutlineCash, HiOutlineCheckCircle } from 'react-icons/hi';
import { motion } from 'framer-motion';

const Checkout = () => {
  const { items } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA'
  });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const subtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const shipping = subtotal > 500 ? 0 : 50;
  const total = subtotal + shipping;

  const handleInputChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const placeOrderDB = async (paymentId = null) => {
    try {
      const orderData = {
        orderItems: items.map(item => ({
          product: item.product._id,
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          image: item.product.image
        })),
        shippingAddress,
        paymentMethod,
        totalPrice: total,
        isPaid: paymentMethod === 'card',
        paidAt: paymentMethod === 'card' ? new Date() : undefined
      };

      await API.post('/orders', orderData);
      setSuccess(true);
      dispatch(clearCartLocal());
      setTimeout(() => navigate('/orders'), 3000);
    } catch (error) {
      console.error('Order creation failed:', error);
      alert('Order failed. Please try again.');
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    const res = await loadRazorpayScript();
    if (!res) {
      alert('Razorpay SDK failed to load. Are you online?');
      setLoading(false);
      return;
    }

    try {
      const result = await API.post('/orders/razorpay', { amount: total });
      if (!result.data.success) {
        alert('Server error. Are you online?');
        setLoading(false);
        return;
      }

      const { amount, id: order_id, currency } = result.data.order;
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'YOUR_KEY_ID', 
        amount: amount.toString(),
        currency: currency,
        name: 'MediHouse',
        description: 'Order Payment',
        order_id: order_id,
        handler: async function (response) {
          try {
            const verifyResult = await API.post('/orders/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyResult.data.success) {
               await placeOrderDB(response.razorpay_payment_id);
            } else {
               alert('Payment verification failed');
               setLoading(false);
            }
          } catch (err) {
            alert('Payment verification failed');
            setLoading(false);
          }
        },
        prefill: {
          name: user?.name || 'Customer',
          email: user?.email || 'customer@example.com',
        },
        theme: {
          color: '#3b82f6', 
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
      paymentObject.on('payment.failed', function (response) {
        alert(response.error.description);
        setLoading(false);
      });
    } catch (error) {
       console.error(error);
       setLoading(false);
       alert('Something went wrong');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (paymentMethod === 'card') {
      await handlePayment();
    } else {
      await placeOrderDB();
    }
  };

  if (items.length === 0 && !success) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <button onClick={() => navigate('/medicines')} className="btn-primary">Shop Now</button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-16 rounded-[4rem] shadow-2xl text-center max-w-lg mx-4"
        >
          <div className="w-24 h-24 bg-secondary text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-100">
            <HiOutlineCheckCircle size={60} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-4">Order Confirmed!</h1>
          <p className="text-slate-500 text-lg mb-10">Thank you for choosing MediHouse. We've received your order and will notify you once it's shipped.</p>
          <button onClick={() => navigate('/orders')} className="btn-primary w-full py-4 text-lg">
            View My Orders
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-black text-slate-900 mb-12">Checkout</h1>
        
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-12">
          {/* Left - Shipping & Payment */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <span className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm">1</span>
                Shipping Address
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-slate-700">Street Address</label>
                  <input 
                    name="street" 
                    required 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="123 Health Ave"
                    value={shippingAddress.street}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">City</label>
                  <input 
                    name="city" 
                    required 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="New York"
                    value={shippingAddress.city}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">State</label>
                  <input 
                    name="state" 
                    required 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="NY"
                    value={shippingAddress.state}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Zip Code</label>
                  <input 
                    name="zipCode" 
                    required 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="10001"
                    value={shippingAddress.zipCode}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Country</label>
                  <input 
                    name="country" 
                    disabled 
                    className="w-full bg-slate-100 border border-slate-100 rounded-2xl py-4 px-6 outline-none"
                    value="USA"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <span className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm">2</span>
                Payment Method
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <label className={`flex items-center gap-4 p-6 rounded-3xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'card' ? 'border-primary bg-blue-50 text-primary' : 'border-slate-100 hover:border-slate-200'
                }`}>
                  <input 
                    type="radio" 
                    className="hidden" 
                    name="payment" 
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                  />
                  <HiOutlineCreditCard size={32} />
                  <div>
                    <p className="font-bold">Credit/Debit Card</p>
                    <p className="text-xs opacity-60">Visa, Mastercard, Amex</p>
                  </div>
                </label>
                
                <label className={`flex items-center gap-4 p-6 rounded-3xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'cod' ? 'border-primary bg-blue-50 text-primary' : 'border-slate-100 hover:border-slate-200'
                }`}>
                  <input 
                    type="radio" 
                    className="hidden" 
                    name="payment" 
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                  />
                  <HiOutlineCash size={32} />
                  <div>
                    <p className="font-bold">Cash on Delivery</p>
                    <p className="text-xs opacity-60">Pay when you receive</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl sticky top-28">
              <h3 className="text-2xl font-bold text-slate-900 mb-8">Final Review</h3>
              
              <div className="space-y-4 mb-8">
                {items.map(item => (
                  <div key={item.product._id} className="flex justify-between text-sm">
                    <span className="text-slate-500">{item.product.name} x {item.quantity}</span>
                    <span className="font-bold">${item.product.price * item.quantity}</span>
                  </div>
                ))}
                
                <div className="pt-6 mt-6 border-t border-slate-100 space-y-4">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-900">${subtotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Shipping</span>
                    <span className="font-bold text-slate-900">${shipping}</span>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xl font-bold text-slate-900">Total</span>
                    <span className="text-3xl font-black text-primary">${total}</span>
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-5 text-xl shadow-blue-200 shadow-2xl disabled:opacity-50"
              >
                {loading ? 'Processing...' : (paymentMethod === 'card' ? 'Pay Now' : 'Place Order')}
              </button>
              
              <p className="text-center text-xs text-slate-400 mt-6 px-4 leading-relaxed">
                By placing this order, you agree to MediHouse's Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
