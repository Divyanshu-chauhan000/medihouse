export const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export const razorpayOptions = (order, user, callback) => {
  return {
    key: import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_placeholder',
    amount: order.totalAmount * 100, // in paise
    currency: 'USD',
    name: 'MediHouse',
    description: 'Medical Purchase',
    order_id: order.razorpayOrderId,
    handler: function (response) {
      callback(response);
    },
    prefill: {
      name: user.name,
      email: user.email,
      contact: user.phone
    },
    theme: {
      color: '#1e40af'
    }
  };
};
