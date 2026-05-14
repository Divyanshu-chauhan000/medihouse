import { motion } from 'framer-motion';
import { HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker, HiOutlineSupport } from 'react-icons/hi';

const Contact = () => {
  return (
    <div className="bg-slate-50 min-h-screen py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-black text-slate-900 mb-4">Contact Our Team</h1>
            <p className="text-xl text-slate-500">We're here to help you with your healthcare needs 24/7.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              { icon: HiOutlinePhone, title: 'Call Us', detail: '+1 (234) 567-890', color: 'bg-blue-500' },
              { icon: HiOutlineMail, title: 'Email Us', detail: 'support@medihouse.com', color: 'bg-emerald-500' },
              { icon: HiOutlineLocationMarker, title: 'Visit Us', detail: '123 Medical Plaza, NY', color: 'bg-purple-500' }
            ].map((item, i) => (
              <div key={i} className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 text-center">
                <div className={`w-16 h-16 ${item.color} text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-100`}>
                  <item.icon size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-slate-500">{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-[4rem] shadow-xl border border-slate-100 overflow-hidden grid md:grid-cols-2">
            <div className="p-12 md:p-20">
              <h2 className="text-3xl font-black mb-8">Send us a message</h2>
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Name</label>
                    <input className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-primary/20" placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Email</label>
                    <input className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-primary/20" placeholder="john@example.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Subject</label>
                  <input className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-primary/20" placeholder="How can we help?" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Message</label>
                  <textarea rows="4" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-primary/20" placeholder="Your message here..."></textarea>
                </div>
                <button className="w-full btn-primary py-4 text-lg">Send Message</button>
              </form>
            </div>
            <div className="bg-primary relative hidden md:block">
              <img src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-50" alt="Contact" />
              <div className="absolute inset-0 flex items-center justify-center p-20">
                <div className="text-white">
                  <HiOutlineSupport size={80} className="mb-8" />
                  <h3 className="text-4xl font-black mb-4">Dedicated Support</h3>
                  <p className="text-blue-100 text-lg">Our medical experts are available to guide you through your health journey.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
