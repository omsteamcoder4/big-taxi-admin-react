// admin/src/pages/AeoSeo.jsx - FIXED
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../api/axiosConfig';
import { Save, AlertCircle, HelpCircle, BookOpen, Mic, Plus, Trash2 } from 'lucide-react';

const AeoSeo = () => {
    const { logout } = useAuth();
    const [selectedPage, setSelectedPage] = useState('homepage');
    const [formData, setFormData] = useState({
        faqQuestions: [],
        howToSteps: [],
        articleBody: '',
        articleHeadline: '',
        articleSection: '',
        featuredSnippetText: '',
        featuredSnippetQuestion: '',
        voiceSearchKeywords: '',
        voiceSearchQuestions: '',
        naturalLanguagePhrases: '',
        semanticKeywords: '',
        schemaType: 'None',
        active: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
    const [newStep, setNewStep] = useState({ name: '', text: '' });

    const pageTypes = [
        { value: 'homepage', label: 'Homepage', icon: '🏠' },
        { value: 'about', label: 'About Page', icon: '👥' },
        { value: 'services', label: 'Services Page', icon: '⚙️' },
        { value: 'fleet', label: 'Fleet Page', icon: '🚗' },
        { value: 'contact', label: 'Contact Page', icon: '📄' },
        { value: 'booking', label: 'Booking Page', icon: '📅' }
    ];

    // Define fetchAeoSettings BEFORE using it in useEffect. Wrapped in
    // useCallback (keyed on selectedPage) so it has a stable identity we
    // can safely and completely list as an effect dependency below.
    const fetchAeoSettings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/aeo/${selectedPage}`);
            const data = res.data.data;
            setFormData({
                faqQuestions: data.faqQuestions || [],
                howToSteps: data.howToSteps || [],
                articleBody: data.articleBody || '',
                articleHeadline: data.articleHeadline || '',
                articleSection: data.articleSection || '',
                featuredSnippetText: data.featuredSnippetText || '',
                featuredSnippetQuestion: data.featuredSnippetQuestion || '',
                voiceSearchKeywords: (data.voiceSearchKeywords || []).join(', '),
                voiceSearchQuestions: (data.voiceSearchQuestions || []).join(', '),
                naturalLanguagePhrases: (data.naturalLanguagePhrases || []).join(', '),
                semanticKeywords: (data.semanticKeywords || []).join(', '),
                schemaType: data.schemaType || 'None',
                active: data.active !== false
            });
        } catch {
            console.error('Error fetching AEO settings:');
            setError('Failed to load AEO settings');
        } finally {
            setLoading(false);
        }
    }, [selectedPage]);

    // Fetching AEO settings from the server is a genuine sync with an
    // external system (the API) whenever the selected page changes — that's
    // exactly what an effect is for, so we intentionally suppress
    // set-state-in-effect here rather than restructure the fetch away.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchAeoSettings();
    }, [fetchAeoSettings]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const addFaq = () => {
        if (newFaq.question && newFaq.answer) {
            setFormData(prev => ({
                ...prev,
                faqQuestions: [...prev.faqQuestions, { ...newFaq, upvoteCount: 0, dateCreated: new Date() }]
            }));
            setNewFaq({ question: '', answer: '' });
        }
    };

    const removeFaq = (index) => {
        setFormData(prev => ({
            ...prev,
            faqQuestions: prev.faqQuestions.filter((_, i) => i !== index)
        }));
    };

    const addHowToStep = () => {
        if (newStep.name && newStep.text) {
            setFormData(prev => ({
                ...prev,
                howToSteps: [...prev.howToSteps, { ...newStep }]
            }));
            setNewStep({ name: '', text: '' });
        }
    };

    const removeHowToStep = (index) => {
        setFormData(prev => ({
            ...prev,
            howToSteps: prev.howToSteps.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const submitData = {
                ...formData,
                voiceSearchKeywords: formData.voiceSearchKeywords.split(',').map(k => k.trim()),
                voiceSearchQuestions: formData.voiceSearchQuestions.split(',').map(q => q.trim()),
                naturalLanguagePhrases: formData.naturalLanguagePhrases.split(',').map(p => p.trim()),
                semanticKeywords: formData.semanticKeywords.split(',').map(k => k.trim())
            };
            await api.put(`/aeo/${selectedPage}`, submitData);
            setSuccess('AEO settings saved successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch {
            setError('Failed to save AEO settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f96b06]"></div>
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
                            <Mic className="text-[#f96b06]" />
                            <h1 className="text-xl font-bold text-gray-800">AEO SEO Settings (Answer Engine Optimization)</h1>
                        </div>
                        <button onClick={logout} className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg text-sm">
                            Logout
                        </button>
                    </div>
                </header>

                <main className="p-4 sm:p-6">
                    <div className="mb-6">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-700">Answer Engine Optimization</h2>
                        <p className="text-gray-500 text-sm mt-1">Optimize for voice search, featured snippets, and AI-powered search engines</p>
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
                            {/* FAQ Section */}
                            <div className="border-b pb-6">
                                <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <HelpCircle size={18} /> FAQ Schema (For Voice Search & Featured Snippets)
                                </h3>
                                <div className="mb-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                        <input type="text" placeholder="Question" value={newFaq.question} onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                        <div className="flex gap-2">
                                            <input type="text" placeholder="Answer" value={newFaq.answer} onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                            <button type="button" onClick={addFaq} className="px-3 py-2 bg-[#f96b06] text-white rounded-lg text-sm hover:bg-[#bf4040]">Add</button>
                                        </div>
                                    </div>
                                </div>
                                {formData.faqQuestions.length > 0 && (
                                    <div className="space-y-2">
                                        {formData.faqQuestions.map((faq, idx) => (
                                            <div key={idx} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm"><strong>Q:</strong> {faq.question}</p>
                                                    <p className="text-sm text-gray-600 mt-1"><strong>A:</strong> {faq.answer}</p>
                                                </div>
                                                <button type="button" onClick={() => removeFaq(idx)} className="text-red-500 hover:text-red-700 ml-2"><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* HowTo Steps */}
                            <div className="border-b pb-6">
                                <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <BookOpen size={18} /> HowTo Schema (Step-by-Step Guides)
                                </h3>
                                <div className="mb-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                        <input type="text" placeholder="Step Name" value={newStep.name} onChange={(e) => setNewStep({ ...newStep, name: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                        <div className="flex gap-2">
                                            <input type="text" placeholder="Step Description" value={newStep.text} onChange={(e) => setNewStep({ ...newStep, text: e.target.value })} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                                            <button type="button" onClick={addHowToStep} className="px-3 py-2 bg-[#f96b06] text-white rounded-lg text-sm hover:bg-[#bf4040]">Add</button>
                                        </div>
                                    </div>
                                </div>
                                {formData.howToSteps.length > 0 && (
                                    <div className="space-y-2">
                                        {formData.howToSteps.map((step, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-sm"><strong>Step {idx + 1}:</strong> {step.name}</p>
                                                    <p className="text-sm text-gray-600 mt-1">{step.text}</p>
                                                </div>
                                                <button type="button" onClick={() => removeHowToStep(idx)} className="text-red-500 hover:text-red-700 ml-2"><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Voice Search Optimization */}
                            <div className="border-b pb-6">
                                <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <Mic size={18} /> Voice Search Optimization
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Voice Search Keywords (comma separated)</label>
                                        <textarea name="voiceSearchKeywords" value={formData.voiceSearchKeywords} onChange={handleChange} rows="2" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" placeholder="book taxi near me, cab service in Salem, airport taxi, outstation cab" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Voice Search Questions (comma separated)</label>
                                        <textarea name="voiceSearchQuestions" value={formData.voiceSearchQuestions} onChange={handleChange} rows="2" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" placeholder="How to book a taxi?, What is the fare to Chennai?, Do you provide airport service?" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Natural Language Phrases (comma separated)</label>
                                        <textarea name="naturalLanguagePhrases" value={formData.naturalLanguagePhrases} onChange={handleChange} rows="2" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" placeholder="I need a taxi, Can I book a cab, I want to go to Coimbatore" />
                                    </div>
                                </div>
                            </div>

                            {/* Featured Snippet */}
                            <div className="border-b pb-6">
                                <h3 className="text-md font-semibold text-gray-800 mb-4">Featured Snippet Optimization</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Featured Snippet Question</label>
                                        <input type="text" name="featuredSnippetQuestion" value={formData.featuredSnippetQuestion} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" placeholder="What is the best taxi service in Tamil Nadu?" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Featured Snippet Answer</label>
                                        <textarea name="featuredSnippetText" value={formData.featuredSnippetText} onChange={handleChange} rows="3" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" placeholder="Concise answer that search engines can extract for featured snippets..." />
                                    </div>
                                </div>
                            </div>

                            {/* Semantic & Article SEO */}
                            <div>
                                <h3 className="text-md font-semibold text-gray-800 mb-4">Semantic & Article SEO</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Semantic Keywords (comma separated)</label>
                                        <textarea name="semanticKeywords" value={formData.semanticKeywords} onChange={handleChange} rows="2" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" placeholder="taxi, cab, transportation, travel, outstation, airport transfer, local ride" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Article Headline</label>
                                        <input type="text" name="articleHeadline" value={formData.articleHeadline} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" placeholder="Your Complete Guide to Taxi Services in Tamil Nadu" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Article Body</label>
                                        <textarea name="articleBody" value={formData.articleBody} onChange={handleChange} rows="5" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" placeholder="Long-form content that search engines can use for featured snippets and rich results..." />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <label className="block text-xs font-medium text-gray-600">Enable AEO</label>
                                        <input type="checkbox" name="active" checked={formData.active} onChange={handleChange} className="w-4 h-4 text-[#f96b06]" />
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="border-t pt-6 flex justify-end gap-3">
                                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#f96b06] to-[#bf4040] rounded-lg hover:from-[#bf4040] hover:to-[#a03535] disabled:opacity-50">
                                    <Save size={15} />
                                    {saving ? 'Saving...' : 'Save AEO Settings'}
                                </button>
                            </div>
                        </div>
                    </form>
                </main>
            </div>
        </div>
    );
};

export default AeoSeo;