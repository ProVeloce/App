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
                    <div className="logo-container">
                        <img
                            src="/logo-nobg.png"
                            alt="ProVeloce Connect"
                            className="logo-image"
                        />
                    </div>
                </div>

                {/* Pulse rings around logo */}
                <div className="loader-spinner">
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
