import { motion } from 'framer-motion';
import { HiOutlineUserGroup, HiOutlineShieldCheck, HiOutlineSparkles, HiOutlineGlobe } from 'react-icons/hi';

const About = () => {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="bg-slate-900 py-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full">
           <img src="https://images.unsplash.com/photo-1512678080530-7760d81faba6?q=80&w=2074&auto=format&fit=crop" className="w-full h-full object-cover opacity-30" alt="Laboratory" />
           <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-transparent"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-6xl font-black text-white mb-8">Revolutionizing <br /><span className="text-secondary">Healthcare Access</span></h1>
            <p className="text-xl text-slate-400 leading-relaxed">
              MediHouse is more than just an online pharmacy. We are a technology-driven healthcare platform dedicated to making quality medicine and medical equipment accessible to everyone, everywhere.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-20 items-center">
          <div>
            <span className="text-primary font-bold uppercase tracking-widest text-sm">Our Mission</span>
            <h2 className="text-4xl font-black text-slate-900 mt-4 mb-8">Reliable. Rapid. <br />Responsible.</h2>
            <div className="space-y-6">
               {[
                 { icon: HiOutlineShieldCheck, title: 'Quality Assurance', desc: 'Every product on our platform undergoes rigorous quality checks and comes from certified manufacturers.' },
                 { icon: HiOutlineSparkles, title: 'Modern Solutions', desc: 'We leverage AI and advanced logistics to ensure your medicines reach you in perfect condition.' },
                 { icon: HiOutlineGlobe, title: 'Global Standards', desc: 'Operating with international healthcare standards to provide the best possible care.' }
               ].map((item, i) => (
                 <div key={i} className="flex gap-6">
                   <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shrink-0">
                     <item.icon size={24} />
                   </div>
                   <div>
                     <h4 className="text-lg font-bold text-slate-800">{item.title}</h4>
                     <p className="text-slate-500">{item.desc}</p>
                   </div>
                 </div>
               ))}
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square bg-slate-100 rounded-[4rem] overflow-hidden rotate-3">
               <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover" alt="Health Tech" />
            </div>
            <div className="absolute -bottom-10 -left-10 bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-50 hidden lg:block">
              <h3 className="text-4xl font-black text-primary">10+ Years</h3>
              <p className="text-slate-500 font-bold">of Medical Excellence</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-slate-50 py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { val: '1M+', label: 'Happy Customers' },
              { val: '50k+', label: 'Medicines Available' },
              { val: '500+', label: 'Partner Hospitals' },
              { val: '24/7', label: 'Support Available' }
            ].map((stat, i) => (
              <div key={i}>
                <h3 className="text-5xl font-black text-slate-900 mb-2">{stat.val}</h3>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
