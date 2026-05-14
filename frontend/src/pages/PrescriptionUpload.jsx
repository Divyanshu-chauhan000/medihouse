import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineCloudUpload, HiOutlineCheckCircle, HiOutlineDocumentText, HiOutlineExclamationCircle } from 'react-icons/hi';
import API from '../api/client';
import { motion } from 'framer-motion';

const PrescriptionUpload = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [patientName, setPatientName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError('Please select a prescription image');

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('prescription', file);
    formData.append('patientName', patientName);
    formData.append('doctorName', doctorName);

    try {
      await API.post('/prescriptions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(true);
      setTimeout(() => navigate('/checkout'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Left Side - Info */}
            <div className="bg-primary p-12 text-white">
              <h2 className="text-3xl font-black mb-8 leading-tight">Prescription Verification</h2>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">1</div>
                  <p className="text-blue-100">Upload a clear photo of your original doctor's prescription.</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">2</div>
                  <p className="text-blue-100">Our pharmacists will verify the prescription details.</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">3</div>
                  <p className="text-blue-100">Once approved, your order will be processed immediately.</p>
                </div>
              </div>

              <div className="mt-16 p-6 bg-white/10 rounded-3xl border border-white/20">
                <h4 className="font-bold flex items-center gap-2 mb-2">
                  <HiOutlineExclamationCircle /> Important
                </h4>
                <p className="text-sm text-blue-100">Make sure the doctor's name, patient name, and medicines are clearly visible.</p>
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="p-12">
              {success ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }}
                    className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center text-white mb-6"
                  >
                    <HiOutlineCheckCircle size={48} />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Upload Successful!</h3>
                  <p className="text-slate-500">Redirecting to checkout...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-sm border border-red-100">
                      {error}
                    </div>
                  )}

                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">Prescription Image</label>
                    <div className="relative group">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange}
                        className="hidden" 
                        id="prescription-file"
                      />
                      <label 
                        htmlFor="prescription-file"
                        className="cursor-pointer block aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl overflow-hidden hover:border-primary transition-all group-hover:bg-slate-100"
                      >
                        {preview ? (
                          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <HiOutlineCloudUpload size={48} className="mb-2" />
                            <span className="font-bold">Click to upload image</span>
                            <span className="text-xs">JPG, PNG, WebP up to 10MB</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">Patient Details</label>
                    <input 
                      type="text" 
                      placeholder="Full Name of Patient"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-primary/20"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      required
                    />
                    <input 
                      type="text" 
                      placeholder="Doctor's Name"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-primary/20"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading || !file}
                    className="w-full btn-primary py-5 text-xl flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {loading ? 'Uploading...' : (
                      <>
                        <HiOutlineDocumentText size={24} /> Submit Prescription
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionUpload;
