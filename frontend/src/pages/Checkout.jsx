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
    country: 'India',
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
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const buildOrderPayload = () => ({
    orderItems: items.map((item) => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.product.price,
      requiresPrescription: item.requiresPrescription,
      prescriptionId: item.prescriptionId,
    })),
    shippingAddress,
    paymentMethod,
    shippingCost: shipping,
    discount: 0,
  });

  const placeCodOrder = async () => {
    await API.post('/orders/create', {
      ...buildOrderPayload(),
      paymentMethod: 'cod',
    });
    setSuccess(true);
    dispatch(clearCartLocal());
    setTimeout(() => navigate('/orders'), 3000);
  };

  const handleRazorpayPayment = async () => {
    const scriptOk = await loadRazorpayScript();
    if (!scriptOk) {
      alert('Razorpay checkout failed to load. Check your connection.');
      setLoading(false);
      return;
    }

    const createRes = await API.post('/orders/create', {
      ...buildOrderPayload(),
      paymentMethod: 'card',
    });

    if (!createRes.data.success || !createRes.data.order?._id) {
      alert(createRes.data.message || 'Could not create order');
      setLoading(false);
      return;
    }

    const mongoOrderId = createRes.data.order._id;

    const rpRes = await API.post('/orders/razorpay/create', {
      orderId: mongoOrderId,
    });

    if (!rpRes.data.success || !rpRes.data.razorpayOrder?.id) {
      alert(rpRes.data.message || 'Could not start payment');
      setLoading(false);
      return;
    }

    const rzOrder = rpRes.data.razorpayOrder;
    const keyId = rpRes.data.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!keyId) {
      alert('Missing Razorpay key. Set VITE_RAZORPAY_KEY_ID in frontend .env');
      setLoading(false);
      return;
    }

    const options = {
      key: keyId,
      amount: rzOrder.amount,
      currency: rzOrder.currency,
      order_id: rzOrder.id,
      name: 'MediHouse',
      description: 'Order payment',
      handler: async function (response) {
        try {
          const verifyResult = await API.post('/orders/razorpay/verify', {
            orderId: mongoOrderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            paymentMethod: 'card',
          });

          if (verifyResult.data.success) {
            setSuccess(true);
            dispatch(clearCartLocal());
            setLoading(false);
            setTimeout(() => navigate('/orders'), 2500);
          } else {
            alert(verifyResult.data.message || 'Payment verification failed');
            setLoading(false);
          }
        } catch (err) {
          console.error(err);
          alert(err.response?.data?.message || 'Payment verification failed');
          setLoading(false);
        }
      },
      prefill: {
        name: user?.name || 'Customer',
        email: user?.email || '',
        contact: user?.phone || '',
      },
      theme: { color: '#3b82f6' },
      modal: {
        ondismiss: () => setLoading(false),
      },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.on('payment.failed', function (response) {
      alert(response.error?.description || 'Payment failed');
      setLoading(false);
    });
    paymentObject.open();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (paymentMethod === 'card') {
        await handleRazorpayPayment();
      } else {
        await placeCodOrder();
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Something went wrong');
      setLoading(false);
    }
  };

  if (items.length === 0 && !success) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <button type="button" onClick={() => navigate('/medicines')} className="btn-primary">
          Shop Now
        </button>
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
          <p className="text-slate-500 text-lg mb-10">
            Thank you for choosing MediHouse. We have received your order and will notify you once it is shipped.
          </p>
          <button type="button" onClick={() => navigate('/orders')} className="btn-primary w-full py-4 text-lg">
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
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <span className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm">
                  1
                </span>
                Shipping Address
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-slate-700">Street Address</label>
                  <input
                    name="street"
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Street, area"
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
                    placeholder="City"
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
                    placeholder="State"
                    value={shippingAddress.state}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">PIN code</label>
                  <input
                    name="zipCode"
                    required
                    pattern="[0-9]{6}"
                    title="6-digit PIN"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="400001"
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
                    value="India"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <span className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm">
                  2
                </span>
                Payment Method
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <label
                  className={`flex items-center gap-4 p-6 rounded-3xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'card'
                      ? 'border-primary bg-blue-50 text-primary'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    className="hidden"
                    name="payment"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                  />
                  <HiOutlineCreditCard size={32} />
                  <div>
                    <p className="font-bold">UPI / Card / Netbanking</p>
                    <p className="text-xs opacity-60">Secured by Razorpay (INR)</p>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-4 p-6 rounded-3xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-primary bg-blue-50 text-primary'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
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

          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl sticky top-28">
              <h3 className="text-2xl font-bold text-slate-900 mb-8">Final Review</h3>

              <div className="space-y-4 mb-8">
                {items.map((item) => (
                  <div key={item.product._id} className="flex justify-between text-sm">
                    <span className="text-slate-500">
                      {item.product.name} × {item.quantity}
                    </span>
                    <span className="font-bold">₹{item.product.price * item.quantity}</span>
                  </div>
                ))}

                <div className="pt-6 mt-6 border-t border-slate-100 space-y-4">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-900">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Shipping</span>
                    <span className="font-bold text-slate-900">₹{shipping}</span>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xl font-bold text-slate-900">Total</span>
                    <span className="text-3xl font-black text-primary">₹{total}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-5 text-xl shadow-blue-200 shadow-2xl disabled:opacity-50"
              >
                {loading ? 'Processing...' : paymentMethod === 'card' ? 'Pay with Razorpay' : 'Place Order'}
              </button>

              <p className="text-center text-xs text-slate-400 mt-6 px-4 leading-relaxed">
                By placing this order, you agree to MediHouse&apos;s Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
