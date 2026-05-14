import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchProducts } from '../store/slices/productSlice';
import ProductCard from '../components/product/ProductCard';
import CategoryCard from '../components/category/CategoryCard';
import { motion } from 'framer-motion';
import { HiOutlineArrowRight, HiOutlineShieldCheck, HiOutlineTruck, HiOutlineThumbUp } from 'react-icons/hi';

const Home = () => {
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.products);

  useEffect(() => {
    dispatch(fetchProducts({ limit: 8 }));
  }, [dispatch]);

  const categories = [
    { name: 'Medicines', icon: '💊', color: 'bg-blue-100', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80' },
    { name: 'Wellness', icon: '🧘', color: 'bg-emerald-100', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&q=80' },
    { name: 'Skincare', icon: '✨', color: 'bg-pink-100', image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500&q=80' },
    { name: 'Devices', icon: '🌡️', color: 'bg-amber-100', image: 'https://images.unsplash.com/photo-1583324113626-70df0f4deaab?w=500&q=80' },
    { name: 'Personal Care', icon: '🧴', color: 'bg-purple-100', image: 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=500&q=80' },
    { name: 'Vitamins', icon: '🍎', color: 'bg-orange-100', image: 'https://images.unsplash.com/photo-1577401239170-897940026e7a?w=500&q=80' },
  ];

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1587854680352-936b22b91030?q=80&w=2069&auto=format&fit=crop" 
            alt="Pharmacy" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl text-white"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary/20 text-primary border border-primary/30 font-bold text-sm mb-6 uppercase tracking-widest">
              Certified Online Pharmacy
            </span>
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              Your Health, <br />
              <span className="text-secondary">Our Priority.</span>
            </h1>
            <p className="text-xl text-slate-300 mb-10 leading-relaxed max-w-lg">
              Get authentic medicines, healthcare products and medical equipment delivered safely to your doorstep.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/medicines" className="btn-primary py-4 px-10 text-lg flex items-center gap-2">
                Shop Now <HiOutlineArrowRight />
              </Link>
              <Link to="/prescriptions/upload" className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white py-4 px-10 text-lg font-bold rounded-full transition-all border border-white/20">
                Upload Prescription
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="container mx-auto px-4 -mt-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: HiOutlineShieldCheck, title: '100% Authentic', desc: 'Sourced directly from manufacturers' },
            { icon: HiOutlineTruck, title: 'Express Delivery', desc: 'Get your medicines within 24 hours' },
            { icon: HiOutlineThumbUp, title: 'Best Prices', desc: 'Guaranteed savings on every order' }
          ].map((feature, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl shadow-xl flex items-center gap-6 border border-slate-50">
              <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                <feature.icon size={32} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800">{feature.title}</h4>
                <p className="text-slate-500">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 container mx-auto px-4">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">Shop by Category</h2>
            <p className="text-slate-500">Explore our wide range of healthcare products</p>
          </div>
          <Link to="/medicines" className="text-primary font-bold hover:underline">View All</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((cat, i) => (
              <CategoryCard
                key={i}
                name={cat.name}
                href={`/medicines?category=${cat.name}`}
                image={cat.image}
                bgColor={cat.color}
              />
            ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">Popular Medicines</h2>
              <p className="text-slate-500">Bestselling healthcare essentials this week</p>
            </div>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white h-[400px] rounded-2xl animate-pulse shadow-sm"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.slice(0, 4).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Prescription Banner */}
      <section className="py-24 container mx-auto px-4">
        <div className="bg-gradient-to-br from-primary to-blue-600 rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">Need medicines that require prescription?</h2>
              <p className="text-blue-100 text-lg mb-10">Upload your doctor's prescription and we'll take care of the rest. Simple, fast and verified.</p>
              <Link to="/prescriptions" className="bg-white text-primary hover:bg-blue-50 py-4 px-10 text-lg font-bold rounded-full transition-all inline-block shadow-lg">
                Upload Now
              </Link>
            </div>
            <div className="hidden md:block">
              <img 
                src="https://images.unsplash.com/photo-1550572017-ed2001594950?q=80&w=1974&auto=format&fit=crop" 
                alt="Prescription" 
                className="rounded-3xl shadow-2xl border-8 border-white/10 rotate-3"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
