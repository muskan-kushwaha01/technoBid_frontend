import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const AddParticipant = () => {
  const [formData, setFormData] = useState({
    enrollmentNumber: '',
    name: '',
    phone: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [participants, setParticipants] = useState([]);
  const MAX_PARTICIPANTS = 80;

  // Fetch participants
  useEffect(() => {
    const q = query(collection(db, 'participants'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const participantsList = [];
      querySnapshot.forEach((doc) => {
        participantsList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setParticipants(participantsList);
    }, (error) => {
      console.error("Error fetching participants: ", error);
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.enrollmentNumber || !formData.name || !formData.phone) {
      setMessage({ text: 'All fields are required', type: 'error' });
      return;
    }

    // Validate phone number format
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      setMessage({ text: 'Please enter a valid 10-digit phone number', type: 'error' });
      return;
    }

    // Prevent adding beyond max when creating new
    if (!editingId && participants.length >= MAX_PARTICIPANTS) {
      setMessage({ text: `Maximum of ${MAX_PARTICIPANTS} participants reached.`, type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      if (editingId) {
        // Update existing participant
        const docRef = doc(db, 'participants', editingId);
        await updateDoc(docRef, {
          enrollmentNumber: formData.enrollmentNumber,
          name: formData.name,
          phone: formData.phone
        });
        setMessage({ text: 'Participant updated successfully!', type: 'success' });
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'participants'), {
          enrollmentNumber: formData.enrollmentNumber,
          name: formData.name,
          phone: formData.phone,
          createdAt: new Date().toISOString()
        });
        setMessage({ text: 'Registration successful!', type: 'success' });
      }

      // Reset form
      setFormData({ enrollmentNumber: '', name: '', phone: '' });
    } catch (error) {
      console.error('Registration error:', error);
      setMessage({ 
        text: 'Error in registration. Please try again.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (participant) => {
    setFormData({
      enrollmentNumber: participant.enrollmentNumber || '',
      name: participant.name || '',
      phone: participant.phone || ''
    });
    setEditingId(participant.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this participant?')) return;
    try {
      await deleteDoc(doc(db, 'participants', id));
      setMessage({ text: 'Participant deleted.', type: 'success' });
    } catch (err) {
      console.error('Delete error:', err);
      setMessage({ text: 'Could not delete participant.', type: 'error' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
            Participant Registration
          </h1>
          <p className="text-slate-400 mt-2">
            Manage auction participants and their details.
          </p>
        </div>
        <div className="text-sm font-medium px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
          Registered: <span className="text-violet-400">{participants.length}</span> / {MAX_PARTICIPANTS}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Registration Form */}
        <div className="lg:col-span-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm sticky top-6">
            <h2 className="text-xl font-semibold mb-6 text-slate-200 flex items-center gap-2">
              {editingId ? '✏️ Edit Participant' : '➕ New Participant'}
            </h2>
            
            {message.text && (
              <div 
                className={`p-4 mb-6 rounded-xl text-sm font-medium border ${
                  message.type === 'error' 
                    ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}
              >
                {message.text}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="enrollmentNumber" className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Enrollment Number *
                </label>
                <input
                  type="text"
                  id="enrollmentNumber"
                  name="enrollmentNumber"
                  value={formData.enrollmentNumber}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors placeholder-slate-600"
                  placeholder="e.g. 0201..."
                  required
                />
              </div>
              
              <div>
                <label htmlFor="name" className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors placeholder-slate-600"
                  placeholder="Enter full name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors placeholder-slate-600"
                  placeholder="10-digit number"
                  pattern="[0-9]{10}"
                  required
                />
              </div>
              
              <div className="pt-4 space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-sm shadow-lg transition-all duration-200 ${
                    loading
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-500/25 active:scale-[0.98]'
                  }`}
                >
                  {loading ? (editingId ? 'Updating...' : 'Registering...') : (editingId ? 'Save Changes' : 'Register Participant')}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ enrollmentNumber: '', name: '', phone: '' });
                      setMessage({ text: '', type: '' });
                    }}
                    className="w-full py-2.5 px-4 rounded-lg font-medium text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Participants List */}
        <div className="lg:col-span-8">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-200">Registered List</h2>
            </div>
            
            {participants.length === 0 ? (
              <div className="text-center py-12 text-slate-500 bg-slate-950/30 rounded-xl border border-slate-800/50 border-dashed">
                <p>No participants registered yet.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/30">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-800">
                    <thead className="bg-slate-950/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Enrollment</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {participants.map((participant) => (
                        <tr key={participant.id} className="hover:bg-slate-800/30 transition-colors group">
                          <td className="px-6 py-4 text-sm font-medium text-slate-200 font-mono">{participant.enrollmentNumber}</td>
                          <td className="px-6 py-4 text-sm text-slate-300">{participant.name}</td>
                          <td className="px-6 py-4 text-sm text-slate-400">{participant.phone}</td>
                          <td className="px-6 py-4 text-right text-sm space-x-2">
                            <button 
                              onClick={() => handleEdit(participant)} 
                              className="text-sky-400 hover:text-sky-300 transition-colors p-1.5 hover:bg-sky-500/10 rounded-md"
                              title="Edit"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                            </button>
                            <button 
                              onClick={() => handleDelete(participant.id)} 
                              className="text-red-400 hover:text-red-300 transition-colors p-1.5 hover:bg-red-500/10 rounded-md"
                              title="Delete"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddParticipant;
