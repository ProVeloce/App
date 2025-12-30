import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
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
    /** Override logo path (ignores theme) */
    logoPath?: string;
}

const AppLogo: React.FC<AppLogoProps> = ({
    showText = true,
    size = 'medium',
    clickable = true,
    className = '',
    logoPath,
}) => {
    const { theme } = useTheme();

    // Use theme-based logo: light mode = logo.png, dark mode = footer-logo.png
    const themeLogo = theme === 'dark' ? '/images/footer-logo.png' : '/images/logo.png';
    const currentLogo = logoPath || themeLogo;

    const logoContent = (
        <div className={`app-logo ${size} ${className}`}>
            <img
                src={currentLogo}
                alt="ProVeloce Connect"
                className="app-logo-img"
                onError={(e) => {
                    // Fallback to root logo if images/logo.png doesn't exist
                    const target = e.target as HTMLImageElement;
                    const fallback = theme === 'dark' ? '/footer-logo.png' : '/logo.png';
                    if (!target.src.endsWith(fallback)) {
                        target.src = fallback;
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
