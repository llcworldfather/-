import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Upload, Camera, X, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../i18n/translations';
import { getImageDivination } from '../services/api';

interface ImageDivinationProps {
    onReset: () => void;
}

export const ImageDivination: React.FC<ImageDivinationProps> = ({ onReset }) => {
    const { language } = useLanguage();
    const [imageData, setImageData] = useState<{ base64: string; mimeType: string; preview: string } | null>(null);
    const [reading, setReading] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (file: File) => {
        if (!file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            // Remove data URL prefix to get pure base64
            const base64 = result.split(',')[1];
            setImageData({
                base64,
                mimeType: file.type,
                preview: result
            });
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const startDivination = async () => {
        if (!imageData) return;

        setIsLoading(true);
        setReading('');

        await getImageDivination(
            imageData.base64,
            imageData.mimeType,
            language,
            (chunk) => {
                setReading(prev => prev + chunk);
            }
        );

        setIsLoading(false);
    };

    const clearImage = () => {
        setImageData(null);
        setReading('');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl flex flex-col items-center gap-6 px-4"
        >
            {/* Header */}
            <div className="text-center space-y-2">
                <h2 className="text-4xl md:text-5xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-purple-200 to-emerald-200 drop-shadow-sm">
                    ✨ {t('imageDivinationTitle', language)} ✨
                </h2>
                <p className="text-purple-200/80 text-lg">
                    {t('uploadImagePrompt', language)}
                </p>
            </div>

            {/* Upload Area or Image Preview */}
            {!imageData ? (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        relative w-full max-w-md aspect-square rounded-2xl border-2 border-dashed 
                        flex flex-col items-center justify-center gap-4 cursor-pointer
                        transition-all duration-300
                        ${isDragging
                            ? 'border-emerald-400 bg-emerald-500/10 scale-105'
                            : 'border-purple-400/50 bg-purple-900/20 hover:border-purple-400 hover:bg-purple-800/30'
                        }
                    `}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                        className="hidden"
                    />

                    <div className="p-6 rounded-full bg-purple-500/20 backdrop-blur-sm">
                        {isDragging ? (
                            <Upload className="w-12 h-12 text-emerald-400 animate-bounce" />
                        ) : (
                            <Camera className="w-12 h-12 text-purple-300" />
                        )}
                    </div>

                    <div className="text-center space-y-1">
                        <p className="text-purple-200 font-medium">
                            {language === 'zh' ? '点击或拖拽上传图片' : 'Click or drag to upload'}
                        </p>
                        <p className="text-purple-300/60 text-sm">
                            {language === 'zh' ? '支持 JPG、PNG、GIF 格式' : 'Supports JPG, PNG, GIF'}
                        </p>
                    </div>

                    {/* Decorative corners */}
                    <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-purple-400/50 rounded-tl-lg" />
                    <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-purple-400/50 rounded-tr-lg" />
                    <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-purple-400/50 rounded-bl-lg" />
                    <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-purple-400/50 rounded-br-lg" />
                </div>
            ) : (
                <div className="relative w-full max-w-md">
                    {/* Image Preview */}
                    <div className="relative rounded-2xl overflow-hidden border-2 border-purple-400/30">
                        <img
                            src={imageData.preview}
                            alt="Uploaded"
                            className="w-full object-contain max-h-80"
                        />
                        {!reading && !isLoading && (
                            <button
                                onClick={clearImage}
                                className="absolute top-3 right-3 p-2 rounded-full bg-black/50 hover:bg-red-500/80 transition-colors"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        )}
                    </div>

                    {/* Divine Button */}
                    {!reading && !isLoading && (
                        <button
                            onClick={startDivination}
                            className="w-full mt-4 relative group overflow-hidden rounded-full py-4 px-8 transition-all duration-300"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-800 via-purple-700 to-emerald-800 opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="absolute inset-0 border border-emerald-400/30 rounded-full group-hover:border-emerald-400/60 transition-colors duration-300" />

                            <span className="relative z-10 font-serif text-lg tracking-[0.15em] text-emerald-100 flex items-center justify-center gap-3">
                                <span className="text-xl">🔮</span>
                                {t('startDivination', language)}
                                <span className="text-xl">🔮</span>
                            </span>

                            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        </button>
                    )}
                </div>
            )}

            {/* Loading State */}
            {isLoading && !reading && (
                <div className="flex flex-col items-center gap-4 py-8">
                    <div className="w-16 h-16 rounded-full border-2 border-t-emerald-400 border-r-transparent border-b-purple-400 border-l-transparent animate-spin" />
                    <p className="text-purple-200 tracking-widest animate-pulse">
                        {language === 'zh' ? '水晶球正在解读图像能量...' : 'The crystal ball is reading the image...'}
                    </p>
                </div>
            )}

            {/* Reading Display */}
            {reading && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel w-full rounded-2xl p-6 md:p-8"
                >
                    <div className="max-w-none text-slate-200 leading-loose font-serif tracking-wide custom-markdown">
                        <ReactMarkdown
                            components={{
                                h2: ({ node, ...props }) => <h2 className="text-2xl font-serif text-emerald-200 mb-4 mt-8 flex items-center gap-2" {...props} />,
                                h3: ({ node, ...props }) => <h3 className="text-xl font-serif text-purple-200 mb-3 mt-6" {...props} />,
                                p: ({ node, ...props }) => <p className="mb-4 text-slate-300 leading-relaxed" {...props} />,
                                strong: ({ node, ...props }) => <strong className="text-amber-400 font-semibold" {...props} />,
                                ul: ({ node, ...props }) => <ul className="space-y-2 mb-4 ml-4" {...props} />,
                                li: ({ node, children, ...props }) => (
                                    <li className="flex gap-3 text-slate-300" {...props}>
                                        <span className="text-emerald-400 mt-1.5 text-xs">✦</span>
                                        <span>{children}</span>
                                    </li>
                                ),
                            }}
                        >
                            {reading}
                        </ReactMarkdown>
                    </div>
                </motion.div>
            )}

            {/* Back Button */}
            <button
                onClick={onReset}
                className="group flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 hover:border-purple-400/50 bg-white/5 hover:bg-white/10 transition-all duration-300"
            >
                <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-purple-300 group-hover:-translate-x-1 transition-all" />
                <span className="text-sm uppercase tracking-[0.15em] text-slate-400 group-hover:text-purple-200">
                    {t('backButton', language)}
                </span>
            </button>
        </motion.div>
    );
};
