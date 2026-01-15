import React, { useState, useEffect } from 'react';
import { Cookie, Shield, X, Check } from 'lucide-react';
import './CookieConsent.css';

interface CookieConsentProps {
    onAccept: () => void;
    onReject: () => void;
}

const COOKIE_CONSENT_KEY = 'cookie_consent';
const COOKIE_CONSENT_TIMESTAMP_KEY = 'cookie_consent_timestamp';

export type CookieConsentStatus = 'pending' | 'accepted' | 'rejected';

/**
 * Get the current cookie consent status from localStorage
 */
export const getCookieConsentStatus = (): CookieConsentStatus => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (consent === 'accepted') return 'accepted';
    if (consent === 'rejected') return 'rejected';
    return 'pending';
};

/**
 * Check if cookies have been consented to
 */
export const hasCookieConsent = (): boolean => {
    return getCookieConsentStatus() === 'accepted';
};

/**
 * CookieConsent Banner Component
 * Shows on first visit, asking users to Accept or Reject cookies
 * Similar to MNC (Multi-National Corporation) application cookie banners
 */
const CookieConsent: React.FC<CookieConsentProps> = ({ onAccept, onReject }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        // Check if user has already made a choice
        const consentStatus = getCookieConsentStatus();
        if (consentStatus === 'pending') {
            // Small delay before showing for better UX
            const timer = setTimeout(() => {
                setIsVisible(true);
                setIsAnimating(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
        localStorage.setItem(COOKIE_CONSENT_TIMESTAMP_KEY, Date.now().toString());
        setIsAnimating(false);
        setTimeout(() => {
            setIsVisible(false);
            onAccept();
        }, 300);
    };

    const handleReject = () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
        localStorage.setItem(COOKIE_CONSENT_TIMESTAMP_KEY, Date.now().toString());
        setIsAnimating(false);
        setTimeout(() => {
            setIsVisible(false);
            onReject();
        }, 300);
    };

    if (!isVisible) return null;

    return (
        <div className={`cookie-consent-overlay ${isAnimating ? 'visible' : ''}`}>
            <div className={`cookie-consent-banner ${isAnimating ? 'visible' : ''}`}>
                <div className="cookie-consent-content">
                    <div className="cookie-consent-icon">
                        <Cookie size={32} />
                    </div>
                    <div className="cookie-consent-text">
                        <h3>Cookie Consent</h3>
                        <p>
                            This website uses cookies to ensure you get the best experience. 
                            We use essential cookies for authentication and session management, 
                            which are required for the application to function properly.
                        </p>
                        <div className="cookie-consent-details">
                            <div className="cookie-detail">
                                <Shield size={16} />
                                <span><strong>Essential Cookies:</strong> Required for login, session security, and user preferences.</span>
                            </div>
                        </div>
                        <p className="cookie-consent-note">
                            By clicking "Accept", you consent to the use of cookies. 
                            If you reject, some features may not work as expected.
                        </p>
                    </div>
                </div>
                <div className="cookie-consent-actions">
                    <button 
                        className="cookie-btn cookie-btn-reject" 
                        onClick={handleReject}
                        aria-label="Reject cookies"
                    >
                        <X size={18} />
                        <span>Reject</span>
                    </button>
                    <button 
                        className="cookie-btn cookie-btn-accept" 
                        onClick={handleAccept}
                        aria-label="Accept cookies"
                    >
                        <Check size={18} />
                        <span>Accept</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CookieConsent;
