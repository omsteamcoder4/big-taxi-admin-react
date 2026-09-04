// admin/src/pages/GeoSeo.jsx - Generative Engine Optimization - FIXED
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../api/axiosConfig';
import { Save, AlertCircle, Mic, HelpCircle, Sparkles, Shield, Database, Globe, Plus, Trash2, Volume2, Zap } from 'lucide-react';

const GeoSeo = () => {
    const { logout } = useAuth();
    const [selectedPage, setSelectedPage] = useState('homepage');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [formData, setFormData] = useState({
        speakableText: '',
        speakableTextTitle: '',
        quickAnswer: '',
        quickAnswerQuestions: '',
        voicePhrasesText: '',
        faqsText: '',
        aiSummary: '',
        aiSummaryBullets: '',
        structuredDataRaw: '',
        trustSignalsText: '',
        recommendedFor: '',
        intents: '',
        conversationalKeywords: '',
        relatedEntities: '',
        authorityScore: 5,
        active: true
    });
    
    const [voicePhrasesList, setVoicePhrasesList] = useState([]);
    const [faqsList, setFaqsList] = useState([]);
    const [trustSignalsList, setTrustSignalsList] = useState([]);
    
    const [newVoicePhrase, setNewVoicePhrase] = useState({ phrase: '', intent: 'general' });
    const [newFaq, setNewFaq] = useState({ question: '', answer: '', category: 'general' });
    const [newTrustSignal, setNewTrustSignal] = useState({ type: 'rating', value: '', source: '', isVisible: true });

    const pageTypes = [
        { value: 'homepage', label: 'Homepage', icon: '🏠' },
        { value: 'about', label: 'About Page', icon: '👥' },
        { value: 'services', label: 'Services Page', icon: '⚙️' },
        { value: 'fleet', label: 'Fleet Page', icon: '🚗' },
        { value: 'contact', label: 'Contact Page', icon: '📄' },
        { value: 'booking', label: 'Booking Page', icon: '📅' }
    ];

    const intentOptions = [
        { value: 'booking', label: 'Booking Intent' },
        { value: 'pricing', label: 'Pricing Inquiry' },
        { value: 'availability', label: 'Availability Check' },
        { value: 'location', label: 'Location Based' },
        { value: 'general', label: 'General Information' }
    ];

    const trustSignalTypes = [
        { value: 'rating', label: 'Rating (e.g., 4.8/5)' },
        { value: 'reviews', label: 'Review Count (e.g., 500+ reviews)' },
        { value: 'customers', label: 'Customer Count (e.g., 10,000+ customers)' },
        { value: 'years', label: 'Years in Business (e.g., 10+ years)' },
        { value: 'certification', label: 'Certification (e.g., Licensed, Insured)' },
        { value: 'badge', label: 'Badge (e.g., Verified Drivers)' },
        { value: 'award', label: 'Award (e.g., Best Taxi Service 2024)' },
        { value: 'experience', label: 'Experience (e.g., 10+ years experience)' },
        { value: 'satisfaction', label: 'Satisfaction Rate (e.g., 98% satisfaction)' }
    ];

    // Define fetchGeoSettings BEFORE using it in useEffect
    const fetchGeoSettings = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            console.log('Fetching GEO settings for page:', selectedPage);
            const response = await api.get(`/geo/${selectedPage}`);
            console.log('API Response:', response.data);
            
            if (response.data && response.data.success) {
                const data = response.data.data;
                
                setFormData({
                    speakableText: data.speakableText || '',
                    speakableTextTitle: data.speakableTextTitle || '',
                    quickAnswer: data.quickAnswer || '',
                    quickAnswerQuestions: (data.quickAnswerQuestions || []).join(', '),
                    voicePhrasesText: data.voicePhrasesText || '',
                    faqsText: data.faqsText || '',
                    aiSummary: data.aiSummary || '',
                    aiSummaryBullets: (data.aiSummaryBullets || []).join('\n'),
                    structuredDataRaw: data.structuredDataRaw || '',
                    trustSignalsText: data.trustSignalsText || '',
                    recommendedFor: (data.recommendedFor || []).join(', '),
                    intents: (data.intents || []).join(', '),
                    conversationalKeywords: (data.conversationalKeywords || []).join(', '),
                    relatedEntities: (data.relatedEntities || []).join(', '),
                    authorityScore: data.authorityScore || 5,
                    active: data.active !== false
                });
                
                setVoicePhrasesList(data.voicePhrases || []);
                setFaqsList(data.faqs || []);
                setTrustSignalsList(data.trustSignals || []);
            } else {
                setError('Failed to load GEO settings');
            }
        } catch {
            console.error('Error fetching GEO settings:');
            setError('Failed to load GEO settings');
        } finally {
            setLoading(false);
        }
    }, [selectedPage]);

    // Fetching GEO settings from the server whenever the selected page
    // changes is a genuine sync with an external system (the API), which is
    // exactly what an effect is for. We intentionally suppress
    // set-state-in-effect here rather than restructure the fetch away.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchGeoSettings();
    }, [fetchGeoSettings]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const addVoicePhrase = () => {
        if (newVoicePhrase.phrase.trim()) {
            setVoicePhrasesList(prev => [...prev, { ...newVoicePhrase }]);
            setNewVoicePhrase({ phrase: '', intent: 'general' });
        }
    };

    const removeVoicePhrase = (index) => {
        setVoicePhrasesList(prev => prev.filter((_, i) => i !== index));
    };

    const addFaq = () => {
        if (newFaq.question.trim() && newFaq.answer.trim()) {
            setFaqsList(prev => [...prev, { ...newFaq }]);
            setNewFaq({ question: '', answer: '', category: 'general' });
        }
    };

    const removeFaq = (index) => {
        setFaqsList(prev => prev.filter((_, i) => i !== index));
    };

    const addTrustSignal = () => {
        if (newTrustSignal.value.trim()) {
            setTrustSignalsList(prev => [...prev, { ...newTrustSignal }]);
            setNewTrustSignal({ type: 'rating', value: '', source: '', isVisible: true });
        }
    };

    const removeTrustSignal = (index) => {
        setTrustSignalsList(prev => prev.filter((_, i) => i !== index));
    };

    const toggleTrustSignalVisibility = (index) => {
        setTrustSignalsList(prev => prev.map((ts, i) => 
            i === index ? { ...ts, isVisible: !ts.isVisible } : ts
        ));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const submitData = {
                ...formData,
                quickAnswerQuestions: formData.quickAnswerQuestions ? formData.quickAnswerQuestions.split(',').map(q => q.trim()).filter(q => q) : [],
                aiSummaryBullets: formData.aiSummaryBullets ? formData.aiSummaryBullets.split('\n').filter(b => b.trim()) : [],
                recommendedFor: formData.recommendedFor ? formData.recommendedFor.split(',').map(r => r.trim()).filter(r => r) : [],
                intents: formData.intents ? formData.intents.split(',').map(i => i.trim()).filter(i => i) : [],
                conversationalKeywords: formData.conversationalKeywords ? formData.conversationalKeywords.split(',').map(k => k.trim()).filter(k => k) : [],
                relatedEntities: formData.relatedEntities ? formData.relatedEntities.split(',').map(e => e.trim()).filter(e => e) : [],
                voicePhrases: voicePhrasesList,
                faqs: faqsList,
                trustSignals: trustSignalsList
            };
            
            console.log('Saving GEO settings for page:', selectedPage);
            console.log('Submit data:', submitData);
            
            const response = await api.put(`/geo/${selectedPage}`, submitData);
            
            if (response.data && response.data.success) {
                setSuccess('GEO settings saved successfully!');
                setTimeout(() => setSuccess(''), 3000);
                // Refresh the data
                await fetchGeoSettings();
            } else {
                setError(response.data?.message || 'Failed to save GEO settings');
            }
        } catch {
            console.error('Error saving GEO settings:');
            setError('Failed to save GEO settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f96b06] mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading GEO settings...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 w-full">
                <header className="bg-white shadow">
                    <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-2">
                            <Zap className="text-[#f96b06]" />
                            <h1 className="text-xl font-bold text-gray-800">GEO - Generative Engine Optimization</h1>
                        </div>
                        <button onClick={logout} className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg text-sm">
                            Logout
                        </button>
                    </div>
                </header>

                <main className="p-4 sm:p-6">
                    <div className="mb-6">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-700">Generative Engine Optimization</h2>
                        <p className="text-gray-500 text-sm mt-1">Optimize your content for AI assistants like ChatGPT, Gemini, Copilot, and voice search</p>
                    </div>

                    {/* Page Selector */}
                    <div className="mb-6 bg-white p-4 rounded-lg shadow">
                        <label className="block text-xs font-medium text-gray-600 mb-2">Select Page to Configure</label>
                        <div className="flex flex-wrap gap-2">
                            {pageTypes.map(page => (
                                <button
                                    key={page.value}
                                    type="button"
                                    onClick={() => setSelectedPage(page.value)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${selectedPage === page.value ? 'bg-[#f96b06] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    {page.icon} {page.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                        {error && (
                            <div className="mx-6 mt-6 px-4 py-3 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-lg flex items-center gap-2">
                                <AlertCircle size={16} />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}
                        {success && (
                            <div className="mx-6 mt-6 px-4 py-3 bg-green-50 border-l-4 border-green-400 text-green-700 rounded-lg">
                                <span className="text-sm">{success}</span>
                            </div>
                        )}

                        <div className="p-6 space-y-8">
                            {/* 1. Speakable Text */}
                            <div className="border-b pb-6">
                                <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <Volume2 size={18} className="text-blue-600" /> 1. Speakable Text (For Voice Assistants)
                                </h3>
                                <div className="mb-3">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Section Title</label>
                                    <input type="text" name="speakableTextTitle" value={formData.speakableTextTitle} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g., About Our Service" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Speakable Content (Will be read aloud by voice assistants)</label>
                                    <textarea name="speakableText" value={formData.speakableText} onChange={handleChange} rows="4" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Write natural, conversational content that sounds good when read aloud..." />
                                    <p className="text-xs text-gray-400 mt-1">This text will be prioritized by voice assistants like Alexa, Siri, and Google Assistant</p>
                                </div>
                            </div>

                            {/* 2. Quick Answer */}
                            <div className="border-b pb-6">
                                <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <Sparkles size={18} className="text-yellow-600" /> 2. Quick Answer (For Featured Snippets)
                                </h3>
                                <div className="mb-3">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Related Questions (comma separated)</label>
                                    <input type="text" name="quickAnswerQuestions" value={formData.quickAnswerQuestions} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="How to book a taxi?, What is the fare?" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Quick Answer (30-50 words)</label>
                                    <textarea name="quickAnswer" value={formData.quickAnswer} onChange={handleChange} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Concise answer that AI can extract for featured snippets..." />
                                </div>
                            </div>

                            {/* 3. Voice Phrases */}
                            <div className="border-b pb-6">
                                <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <Mic size={18} className="text-green-600" /> 3. Voice Phrases (Natural Language Queries)
                                </h3>
                                <div className="mb-4">
                                    <div className="flex gap-2 mb-2">
                                        <input type="text" placeholder="Voice phrase (e.g., I need a taxi)" value={newVoicePhrase.phrase} onChange={(e) => setNewVoicePhrase({ ...newVoicePhrase, phrase: e.target.value })} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                        <select value={newVoicePhrase.intent} onChange={(e) => setNewVoicePhrase({ ...newVoicePhrase, intent: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                                            {intentOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                        <button type="button" onClick={addVoicePhrase} className="px-3 py-2 bg-[#f96b06] text-white rounded-lg text-sm hover:bg-[#bf4040]">Add</button>
                                    </div>
                                </div>
                                {voicePhrasesList.length > 0 && (
                                    <div className="space-y-2">
                                        {voicePhrasesList.map((vp, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                                                <div>
                                                    <span className="text-sm font-medium">"{vp.phrase}"</span>
                                                    <span className="text-xs text-gray-500 ml-2">({vp.intent})</span>
                                                </div>
                                                <button type="button" onClick={() => removeVoicePhrase(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="mt-3">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Or paste phrases (one per line)</label>
                                    <textarea name="voicePhrasesText" value={formData.voicePhrasesText} onChange={handleChange} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="book a taxi near me&#10;need a cab to the airport&#10;how much for one way trip" />
                                </div>
                            </div>

                            {/* 4. FAQs */}
                            <div className="border-b pb-6">
                                <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <HelpCircle size={18} className="text-purple-600" /> 4. FAQs (For AI Training)
                                </h3>
                                <div className="mb-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                                        <input type="text" placeholder="Question" value={newFaq.question} onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                        <div className="flex gap-2">
                                            <input type="text" placeholder="Answer" value={newFaq.answer} onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                            <button type="button" onClick={addFaq} className="px-3 py-2 bg-[#f96b06] text-white rounded-lg text-sm hover:bg-[#bf4040]">Add</button>
                                        </div>
                                    </div>
                                </div>
                                {faqsList.length > 0 && (
                                    <div className="space-y-2">
                                        {faqsList.map((faq, idx) => (
                                            <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                                                <div className="flex justify-between">
                                                    <p className="font-medium text-sm"><strong>Q:</strong> {faq.question}</p>
                                                    <button type="button" onClick={() => removeFaq(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1"><strong>A:</strong> {faq.answer}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="mt-3">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Or paste FAQs (JSON format)</label>
                                    <textarea name="faqsText" value={formData.faqsText} onChange={handleChange} rows="4" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono" placeholder='[{"question": "Do you offer one-way trips?", "answer": "Yes"}]' />
                                </div>
                            </div>

                            {/* 5. AI Summary */}
                            <div className="border-b pb-6">
                                <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <Database size={18} className="text-indigo-600" /> 5. AI Summary (For Generative Engines)
                                </h3>
                                <div className="mb-3">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Comprehensive Summary</label>
                                    <textarea name="aiSummary" value={formData.aiSummary} onChange={handleChange} rows="5" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Key Bullet Points (one per line)</label>
                                    <textarea name="aiSummaryBullets" value={formData.aiSummaryBullets} onChange={handleChange} rows="4" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                </div>
                            </div>

                            {/* 6. Trust Signals */}
                            <div className="border-b pb-6">
                                <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <Shield size={18} className="text-green-600" /> 6. Trust Signals (Build Credibility)
                                </h3>
                                <div className="mb-4">
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        <select value={newTrustSignal.type} onChange={(e) => setNewTrustSignal({ ...newTrustSignal, type: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                                            {trustSignalTypes.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                        <input type="text" placeholder="Value" value={newTrustSignal.value} onChange={(e) => setNewTrustSignal({ ...newTrustSignal, value: e.target.value })} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                        <input type="text" placeholder="Source" value={newTrustSignal.source} onChange={(e) => setNewTrustSignal({ ...newTrustSignal, source: e.target.value })} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                        <button type="button" onClick={addTrustSignal} className="px-3 py-2 bg-[#f96b06] text-white rounded-lg text-sm hover:bg-[#bf4040]">Add</button>
                                    </div>
                                </div>
                                {trustSignalsList.length > 0 && (
                                    <div className="space-y-2">
                                        {trustSignalsList.map((ts, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <button type="button" onClick={() => toggleTrustSignalVisibility(idx)} className={`text-sm ${ts.isVisible ? 'text-green-600' : 'text-gray-400'}`}>{ts.isVisible ? '👁️' : '👁️‍🗨️'}</button>
                                                    <span className="text-sm font-medium">{ts.type}:</span>
                                                    <span className="text-sm">{ts.value}</span>
                                                    {ts.source && <span className="text-xs text-gray-500">({ts.source})</span>}
                                                </div>
                                                <button type="button" onClick={() => removeTrustSignal(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 7. Advanced GEO Settings */}
                            <div className="border-b pb-6">
                                <h3 className="text-md font-semibold text-gray-800 mb-4">Advanced GEO Settings</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Recommended For</label>
                                        <input type="text" name="recommendedFor" value={formData.recommendedFor} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="one-way trips, airport transfers" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">User Intents</label>
                                        <input type="text" name="intents" value={formData.intents} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="book taxi, get price" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Conversational Keywords</label>
                                        <input type="text" name="conversationalKeywords" value={formData.conversationalKeywords} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="book a cab, need a taxi" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Related Entities</label>
                                        <input type="text" name="relatedEntities" value={formData.relatedEntities} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Salem, Coimbatore, Ooty" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Authority Score (1-10)</label>
                                        <input type="number" name="authorityScore" value={formData.authorityScore} onChange={handleChange} min="1" max="10" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                    </div>
                                    <div className="flex items-center gap-3 pt-6">
                                        <label className="block text-xs font-medium text-gray-600">Enable GEO for this page</label>
                                        <input type="checkbox" name="active" checked={formData.active} onChange={handleChange} className="w-4 h-4 text-[#f96b06]" />
                                    </div>
                                </div>
                            </div>

                            {/* Structured Data */}
                            <div className="border-b pb-6">
                                <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <Globe size={18} className="text-blue-600" /> Structured Data (JSON-LD)
                                </h3>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Custom JSON-LD Markup</label>
                                    <textarea name="structuredDataRaw" value={formData.structuredDataRaw} onChange={handleChange} rows="6" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono" />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-6 flex justify-end gap-3">
                                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#f96b06] to-[#bf4040] rounded-lg hover:from-[#bf4040] hover:to-[#a03535] disabled:opacity-50">
                                    <Save size={15} />
                                    {saving ? 'Saving...' : 'Save GEO Settings'}
                                </button>
                            </div>
                        </div>
                    </form>
                </main>
            </div>
        </div>
    );
};

export default GeoSeo;