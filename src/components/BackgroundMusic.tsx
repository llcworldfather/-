import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';

const STORAGE_KEY = 'tarot-music-settings';

interface MusicSettings {
    volume: number;
    isMuted: boolean;
}

const getStoredSettings = (): MusicSettings => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.warn('Failed to load music settings:', e);
    }
    return { volume: 0.5, isMuted: false };
};

const saveSettings = (settings: MusicSettings) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
        console.warn('Failed to save music settings:', e);
    }
};

export function BackgroundMusic() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(() => getStoredSettings().volume);
    const [isMuted, setIsMuted] = useState(() => getStoredSettings().isMuted);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);

    // Initialize audio element
    useEffect(() => {
        // Only create new audio if not already exists
        if (!audioRef.current) {
            const audio = new Audio('/audio/background-music.mp3');
            audio.loop = true;
            audio.preload = 'auto';
            audio.volume = isMuted ? 0 : volume;

            // Add error handling
            audio.addEventListener('error', (e) => {
                console.error('Audio load error:', e);
                console.error('Audio error code:', audio.error?.code);
                console.error('Audio error message:', audio.error?.message);
            });

            audio.addEventListener('canplaythrough', () => {
                console.log('Audio ready to play');
            });

            audioRef.current = audio;
        }

        // Cleanup on unmount - only pause, don't clear src
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    // Update volume when changed
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
        }
        saveSettings({ volume, isMuted });
    }, [volume, isMuted]);

    // 第一次用户交互时自动播放BGM
    useEffect(() => {
        const handleFirstInteraction = async () => {
            if (audioRef.current && !isPlaying) {
                try {
                    await audioRef.current.play();
                    setIsPlaying(true);
                    console.log('BGM auto-started on first interaction');
                } catch (error) {
                    console.warn('Auto-play failed:', error);
                }
            }
            // 移除监听器，只需要触发一次
            document.removeEventListener('click', handleFirstInteraction);
            document.removeEventListener('touchstart', handleFirstInteraction);
            document.removeEventListener('keydown', handleFirstInteraction);
        };

        document.addEventListener('click', handleFirstInteraction);
        document.addEventListener('touchstart', handleFirstInteraction);
        document.addEventListener('keydown', handleFirstInteraction);

        return () => {
            document.removeEventListener('click', handleFirstInteraction);
            document.removeEventListener('touchstart', handleFirstInteraction);
            document.removeEventListener('keydown', handleFirstInteraction);
        };
    }, [isPlaying]);

    const togglePlay = async () => {
        if (!audioRef.current) {
            console.error('Audio element not initialized');
            return;
        }

        try {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                console.log('Attempting to play audio...', audioRef.current.src);
                await audioRef.current.play();
                console.log('Audio playing successfully');
                setIsPlaying(true);
            }
        } catch (error) {
            console.error('Audio playback failed:', error);
            alert('音频播放失败，请检查浏览器控制台');
        }
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (newVolume > 0 && isMuted) {
            setIsMuted(false);
        }
    };

    return (
        <div
            className="fixed top-4 left-4 z-50 flex items-center gap-2"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
        >
            {/* Play/Pause Button - Now first (leftmost) */}
            <button
                onClick={togglePlay}
                className={`
          p-2.5 rounded-full
          bg-purple-900/80 backdrop-blur-sm
          border border-purple-500/30
          text-purple-200 hover:text-white
          hover:bg-purple-800/80 hover:border-purple-400/50
          transition-all duration-200
          shadow-lg shadow-purple-900/30
          ${isPlaying ? 'ring-2 ring-purple-400/50 ring-offset-2 ring-offset-transparent' : ''}
        `}
                title={isPlaying ? '暂停音乐' : '播放音乐'}
            >
                <Music className={`w-5 h-5 ${isPlaying ? 'animate-pulse' : ''}`} />
            </button>

            {/* Volume Slider - Shows on hover, expands to the right */}
            <div
                className={`
          flex items-center gap-2 px-3 py-2 
          bg-purple-900/80 backdrop-blur-sm rounded-full
          border border-purple-500/30
          transition-all duration-300 ease-out
          ${showVolumeSlider ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}
        `}
            >
                {/* Mute Button */}
                <button
                    onClick={toggleMute}
                    className="p-1 text-purple-200 hover:text-white transition-colors"
                    title={isMuted ? '取消静音' : '静音'}
                >
                    {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4" />
                    ) : (
                        <Volume2 className="w-4 h-4" />
                    )}
                </button>

                {/* Volume Slider */}
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1.5 bg-purple-700/50 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-3
            [&::-webkit-slider-thumb]:h-3
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-purple-300
            [&::-webkit-slider-thumb]:hover:bg-white
            [&::-webkit-slider-thumb]:transition-colors
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-3
            [&::-moz-range-thumb]:h-3
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-purple-300
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:hover:bg-white
            [&::-moz-range-thumb]:cursor-pointer"
                    title={`音量: ${Math.round(volume * 100)}%`}
                />

                {/* Volume Percentage */}
                <span className="text-xs text-purple-200 w-8 text-right">
                    {Math.round(volume * 100)}%
                </span>
            </div>
        </div>
    );
}
