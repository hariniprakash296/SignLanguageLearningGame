
import React, { useState } from 'react';
import { Languages, ArrowRight, CheckCircle, HelpCircle, Activity, LayoutGrid, Quote, Sparkles } from 'lucide-react';
import CameraView from './CameraView';
import { Region, TranslationResult } from './types';
import { REGIONS } from './constants';
import { translateSign, generateMultipleSignVisuals } from '@/lib/geminiService';

export const SignTranslator: React.FC = () => {
    const [sourceRegion, setSourceRegion] = useState<Region>(Region.ASL);
    const [targetRegion, setTargetRegion] = useState<Region>(Region.BSL);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<TranslationResult | null>(null);
    // Changed to map for multiple visuals
    const [visuals, setVisuals] = useState<Map<string, string | null>>(new Map());
    const [error, setError] = useState<string | null>(null);

    const handleCapture = async (frames: string[]) => {
        setIsProcessing(true);
        setError(null);
        setResult(null);
        setVisuals(new Map());

        try {
            const translation = await translateSign(frames, sourceRegion, targetRegion);
            setResult(translation);

            // Generate visuals for each sign in the gloss
            if (translation.gloss) {
                const glossWords = translation.gloss.split(' ');
                const generatedVisuals = await generateMultipleSignVisuals(glossWords, targetRegion);
                setVisuals(generatedVisuals);
            }
        } catch (err: any) {
            setError(err.message || "Something went wrong during translation.");
        } finally {
            setIsProcessing(false);
        }
    };

    const getGrammarColor = (type: string) => {
        switch (type) {
            case 'subject': return 'bg-blue-600 text-white border-blue-700 shadow-[0_4px_0_rgb(30,58,138)]';
            case 'verb': return 'bg-amber-500 text-white border-amber-600 shadow-[0_4px_0_rgb(180,83,9)]';
            case 'object': return 'bg-rose-600 text-white border-rose-700 shadow-[0_4px_0_rgb(159,18,57)]';
            case 'pronoun': return 'bg-indigo-600 text-white border-indigo-700 shadow-[0_4px_0_rgb(49,46,129)]';
            default: return 'bg-slate-700 text-white border-slate-800 shadow-[0_4px_0_rgb(30,41,59)]';
        }
    };

    return (
        <div className="flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900 bg-[#eef2f6] min-h-screen">
            <div className="max-w-7xl mx-auto w-full p-6 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7 flex flex-col gap-8">
                    <section className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-slate-300/50 border border-white">
                        <div className="flex flex-col md:flex-row gap-8 mb-10">
                            <div className="flex-1">
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Native Input</label>
                                <div className="relative">
                                    <select
                                        value={sourceRegion}
                                        onChange={(e) => setSourceRegion(e.target.value as Region)}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-6 py-5 text-sm font-black text-slate-800 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer"
                                    >
                                        {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center justify-center pt-8">
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                                    <ArrowRight className="text-slate-400" size={20} />
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Target Output</label>
                                <select
                                    value={targetRegion}
                                    onChange={(e) => setTargetRegion(e.target.value as Region)}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-6 py-5 text-sm font-black text-slate-800 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer"
                                >
                                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                        </div>

                        <CameraView onCaptureComplete={handleCapture} isProcessing={isProcessing} />

                        <div className="mt-8 p-6 bg-indigo-900 rounded-[2.5rem] text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
                                <LayoutGrid size={80} />
                            </div>
                            <div className="flex gap-6 relative z-10">
                                <div className="w-12 h-12 shrink-0 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                    <Activity className="text-indigo-300" size={24} />
                                </div>
                                <div>
                                    <h4 className="font-black text-lg mb-1 tracking-tight">Full-Sentence Syntax Parsing</h4>
                                    <p className="text-sm text-indigo-100/70 leading-relaxed font-medium">
                                        Our model is optimized for sequences like <span className="text-white font-bold">MAN HE HAVE CAR</span>.
                                        It identifies subjects, doubling pronouns, and multiple objects in a single take.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="lg:col-span-5 flex flex-col gap-8">
                    {error && (
                        <div className="bg-white border-2 border-rose-100 p-8 rounded-[2.5rem] text-rose-700 shadow-xl flex items-start gap-5 animate-in slide-in-from-top-4">
                            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center shrink-0">
                                <HelpCircle className="text-rose-500" size={28} />
                            </div>
                            <div>
                                <h4 className="font-black text-lg mb-1">Recognition Note</h4>
                                <p className="text-sm font-medium opacity-80 leading-relaxed">{error}</p>
                            </div>
                        </div>
                    )}

                    {!result && !isProcessing && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center bg-white/50 border-4 border-dashed border-slate-200 rounded-[3rem] p-12 group hover:border-indigo-300 transition-colors">
                            <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center text-slate-200 mb-8 shadow-sm group-hover:shadow-xl transition-all">
                                <Quote size={48} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Linguistic Feed</h3>
                            <p className="text-sm text-slate-400 max-w-[280px] leading-relaxed font-medium">
                                Please sign your sentence. We capture 5 seconds of movement to ensure every word is parsed.
                            </p>
                        </div>
                    )}

                    {isProcessing && (
                        <div className="flex-1 flex flex-col items-center justify-center bg-white border border-slate-100 rounded-[3rem] p-12 shadow-2xl">
                            <div className="relative mb-10">
                                <div className="w-24 h-24 border-[8px] border-slate-50 border-t-indigo-600 rounded-full animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles className="text-indigo-600 animate-pulse" size={32} />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Deep Frame Scan</h3>
                            <p className="text-sm text-slate-500 text-center font-bold tracking-tight px-4">
                                MAPING SUBJECTS, VERBS, AND SPATIAL REFERENCES...
                            </p>
                        </div>
                    )}

                    {result && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-12 duration-1000">
                            <section className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-indigo-900/10 border border-white">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                                            <CheckCircle size={16} />
                                        </div>
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Sequence Resolved</span>
                                    </div>
                                </div>

                                <div className="mb-10">
                                    <div className="text-[10px] font-black text-indigo-500 uppercase mb-3 tracking-widest flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                        Linguistic Gloss (Literal)
                                    </div>
                                    <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none mb-6 italic break-words">
                                        "{result.gloss}"
                                    </h2>

                                    {/* Enhanced Grammar Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                                        {result.grammarStructure.map((part, i) => (
                                            <div key={i} className={`flex flex-col border-2 border-white px-4 py-3 rounded-2xl transition-transform hover:scale-105 ${getGrammarColor(part.type)}`}>
                                                <span className="text-[9px] font-black uppercase opacity-70 leading-none mb-1.5 tracking-tighter">{part.label}</span>
                                                <span className="text-sm font-black uppercase">{part.word}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-10">
                                    <div className="text-[10px] font-black text-emerald-500 uppercase mb-3 tracking-widest flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Conceptual Translation
                                    </div>
                                    <div className="bg-slate-950 p-8 rounded-[2.5rem] text-white shadow-2xl border-l-8 border-indigo-600">
                                        <p className="text-3xl font-black mb-4 leading-tight tracking-tight">{result.sourceText}</p>
                                        <div className="flex items-center gap-2 text-indigo-400 font-black text-[10px] uppercase tracking-widest">
                                            <span>{sourceRegion}</span>
                                            <ArrowRight size={10} />
                                            <span className="text-white">{targetRegion}</span>
                                        </div>
                                        <p className="mt-4 text-indigo-100/90 font-bold text-xl leading-relaxed">{result.targetText}</p>
                                    </div>
                                </div>

                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Analysis Logs</h4>
                                    <p className="text-xs text-slate-600 font-bold leading-relaxed italic">
                                        "{result.explanation}"
                                    </p>
                                </div>
                            </section>

                            {visuals.size > 0 && (
                                <section className="bg-white p-8 rounded-[3rem] shadow-xl border border-white animate-in zoom-in-95 duration-700 delay-300">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase mb-5 tracking-widest">Visual Reference ({targetRegion})</h4>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {Array.from(visuals.entries()).map(([word, url], idx) => (
                                            <div key={`${word}-${idx}`} className="flex flex-col gap-2">
                                                <div className="aspect-square rounded-[2rem] overflow-hidden bg-slate-100 border-4 border-slate-50 shadow-inner group relative">
                                                    {url ? (
                                                        <img src={url} alt={`${word} sign`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                            <Activity size={24} className="animate-pulse" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/50 to-transparent">
                                                        <p className="text-white text-[10px] font-black text-center uppercase tracking-widest text-shadow">{word}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-6 p-6 bg-indigo-50/50 rounded-3xl">
                                        <p className="text-sm text-indigo-900 font-black leading-relaxed text-center">
                                            {result.visualDescription}
                                        </p>
                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
