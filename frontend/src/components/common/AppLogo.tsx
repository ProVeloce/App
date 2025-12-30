import React from 'react';
import { Link } from 'react-router-dom';
import './AppLogo.css';

interface AppLogoProps {
    /** Show text alongside logo */
    showText?: boolean;
    /** Size variant */
    size?: 'small' | 'medium' | 'large';
    /** Clickable - redirects to home */
    clickable?: boolean;
    /** Custom className */
    className?: string;
    /** Logo image path - defaults to /images/logo.png */
    logoPath?: string;
}

const AppLogo: React.FC<AppLogoProps> = ({
    showText = true,
    size = 'medium',
    clickable = true,
    className = '',
    logoPath = '/images/logo.png',
}) => {
    const logoContent = (
        <div className={`app-logo ${size} ${className}`}>
            <img
                src={logoPath}
                alt="ProVeloce Connect"
                className="app-logo-img"
                onError={(e) => {
                    // Fallback to root logo if images/logo.png doesn't exist
                    const target = e.target as HTMLImageElement;
                    if (target.src !== `${window.location.origin}/logo.png`) {
                        target.src = '/logo.png';
                    }
                }}
            />
            {showText && <span className="app-logo-text">ProVeloce Connect</span>}
        </div>
    );

    if (clickable) {
        return (
            <Link to="/" className="app-logo-link">
                {logoContent}
            </Link>
        );
    }

    return logoContent;
};

export default AppLogo;

