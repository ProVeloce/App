import React from 'react';
import './PremiumLoader.css';

interface PremiumLoaderProps {
    message?: string;
    fullScreen?: boolean;
}

const PremiumLoader: React.FC<PremiumLoaderProps> = ({
    message = 'Loading ProVeloce Connect',
    fullScreen = true
}) => {
    return (
        <div className={`premium-loader ${fullScreen ? 'fullscreen' : ''}`}>
            {/* Animated background */}
            <div className="loader-background">
                <div className="gradient-orb orb-1"></div>
                <div className="gradient-orb orb-2"></div>
                <div className="gradient-orb orb-3"></div>
            </div>

            {/* Main content */}
            <div className="loader-content">
                {/* Logo with glow effect */}
                <div className="loader-logo">
                    <div className="logo-glow"></div>
                    <div className="logo-icon">
                        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M24 4L6 14v20l18 10 18-10V14L24 4z"
                                fill="url(#logoGradient)"
                                stroke="rgba(255,255,255,0.3)"
                                strokeWidth="1"
                            />
                            <path
                                d="M24 4v40M6 14l18 10 18-10M6 34l18-10 18 10"
                                stroke="rgba(255,255,255,0.5)"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                            <defs>
                                <linearGradient id="logoGradient" x1="6" y1="4" x2="42" y2="44">
                                    <stop offset="0%" stopColor="#818cf8" />
                                    <stop offset="100%" stopColor="#6366f1" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <span className="logo-text">ProVeloce</span>
                </div>

                {/* Animated progress ring */}
                <div className="loader-spinner">
                    <svg className="progress-ring" viewBox="0 0 100 100">
                        <circle className="ring-bg" cx="50" cy="50" r="40" />
                        <circle className="ring-progress" cx="50" cy="50" r="40" />
                    </svg>
                    <div className="pulse-ring"></div>
                    <div className="pulse-ring delay-1"></div>
                    <div className="pulse-ring delay-2"></div>
                </div>

                {/* Loading text with animated dots */}
                <div className="loader-text">
                    <span className="text-main">{message}</span>
                    <span className="text-dots">
                        <span className="dot">.</span>
                        <span className="dot">.</span>
                        <span className="dot">.</span>
                    </span>
                </div>
            </div>

            {/* Bottom branding */}
            <div className="loader-branding">
                <span>Enterprise Solutions Platform</span>
            </div>
        </div>
    );
};

export default PremiumLoader;
