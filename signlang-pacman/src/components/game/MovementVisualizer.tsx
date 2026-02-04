import React from 'react';
import { ArrowRight, RotateCw, MoveRight, ArrowUp, Repeat } from 'lucide-react';

interface MovementVisualizerProps {
    type: string;
    direction?: string;
    className?: string;
}

export const MovementVisualizer: React.FC<MovementVisualizerProps> = ({ type, direction, className = '' }) => {
    // Map movement types to visual elements
    const renderVisual = () => {
        switch (type) {
            case 'circular':
                return (
                    <div className="relative flex flex-col items-center justify-center p-4">
                        <div className="absolute inset-0 border-4 border-dashed border-blue-200 rounded-full animate-spin-slow opacity-50"
                            style={{ animationDuration: '3s' }}></div>
                        <RotateCw className="h-12 w-12 text-blue-600 animate-spin" style={{ animationDuration: '2s' }} />
                        <span className="mt-2 text-xs font-bold text-blue-600 uppercase tracking-wider">Circular</span>
                    </div>
                );
            case 'arc':
                return (
                    <div className="relative flex flex-col items-center justify-center p-4">
                        <svg width="100" height="60" viewBox="0 0 100 60" className="stroke-blue-600 fill-none stroke-[4]">
                            <path d="M 10 50 Q 50 0 90 50" className="animate-dash" strokeDasharray="10" />
                            <circle cx="90" cy="50" r="4" fill="currentColor" />
                        </svg>
                        <span className="mt-2 text-xs font-bold text-blue-600 uppercase tracking-wider">Arc Motion</span>
                    </div>
                );
            case 'forward':
                return (
                    <div className="relative flex flex-col items-center justify-center p-4">
                        <div className="flex items-center gap-1">
                            <div className="h-3 w-3 rounded-full bg-blue-300"></div>
                            <ArrowRight className="h-10 w-10 text-blue-600 animate-pulse" />
                            <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                        </div>
                        <span className="mt-2 text-xs font-bold text-blue-600 uppercase tracking-wider">Push Forward</span>
                    </div>
                );
            case 'shake':
                return (
                    <div className="relative flex flex-col items-center justify-center p-4">
                        <div className="flex items-center">
                            <ArrowRight className="h-8 w-8 text-orange-500 rotate-180 transform translate-x-2 animate-bounce-x-reverse" />
                            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center mx-1">
                                <span className="text-2xl">👋</span>
                            </div>
                            <ArrowRight className="h-8 w-8 text-orange-500 -translate-x-2 animate-bounce-x" />
                        </div>
                        <span className="mt-2 text-xs font-bold text-orange-600 uppercase tracking-wider">Shake</span>
                    </div>
                );
            case 'tap':
                return (
                    <div className="relative flex flex-col items-center justify-center p-4">
                        <div className="flex flex-col items-center relative h-16 w-16">
                            <div className="absolute top-0 animate-ping h-8 w-8 rounded-full bg-sky-200 opacity-75"></div>
                            <div className="h-4 w-4 rounded-full bg-sky-500 mt-6"></div>
                            <ArrowUp className="h-6 w-6 text-sky-600 transform rotate-180 mt-1" />
                        </div>
                        <span className="mt-2 text-xs font-bold text-sky-600 uppercase tracking-wider">Tap</span>
                    </div>
                );
            case 'twist':
                return (
                    <div className="relative flex flex-col items-center justify-center p-4">
                        <div className="relative">
                            <Repeat className="h-10 w-10 text-purple-600 animate-spin" />
                        </div>
                        <span className="mt-2 text-xs font-bold text-purple-600 uppercase tracking-wider">Twist Wrist</span>
                    </div>
                );
            default:
                return (
                    <div className="flex flex-col items-center">
                        <MoveRight className="h-8 w-8 text-slate-400 animate-pulse" />
                        <span className="text-xs text-slate-500">Move</span>
                    </div>
                );
        }
    };

    return (
        <div className={`bg-white/50 rounded-xl border-2 border-slate-200 aspect-square flex items-center justify-center ${className}`}>
            {renderVisual()}
        </div>
    );
};
