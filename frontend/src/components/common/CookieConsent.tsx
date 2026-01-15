import React, { useState, useEffect } from 'react';
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

// Local cookie image from public folder
const COOKIE_IMAGE_URL = '/images/cookie.png';

/**
 * Modern Cookie Consent Popup Component
 * Small, unobtrusive popup in the bottom-right corner
 * Professional MNC-style design with real cookie image
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
            }, 800);
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
        }, 350);
    };

    const handleReject = () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
        localStorage.setItem(COOKIE_CONSENT_TIMESTAMP_KEY, Date.now().toString());
        setIsAnimating(false);
        setTimeout(() => {
            setIsVisible(false);
            onReject();
        }, 350);
    };

    if (!isVisible) return null;

    return (
        <div className={`cookie-popup ${isAnimating ? 'visible' : ''}`}>
            <div className="cookie-popup-header">
                <div className="cookie-popup-image-wrapper">
                    <img 
                        src={COOKIE_IMAGE_URL} 
                        alt="Cookie" 
                        className="cookie-popup-image"
                        loading="eager"
                    />
                </div>
                <div className="cookie-popup-header-text">
                    <span className="cookie-popup-title">We use cookies</span>
                    <span className="cookie-popup-subtitle">To improve your experience</span>
                </div>
            </div>
            
            <p className="cookie-popup-message">
                This site uses cookies to enhance your browsing experience, 
                provide personalized content, and analyze traffic.
            </p>
            
            <div className="cookie-popup-actions">
                <button 
                    className="cookie-popup-btn cookie-popup-btn-decline" 
                    onClick={handleReject}
                    aria-label="Decline cookies"
                >
                    Decline
                </button>
                <button 
                    className="cookie-popup-btn cookie-popup-btn-accept" 
                    onClick={handleAccept}
                    aria-label="Accept cookies"
                >
                    Accept
                </button>
            </div>
            
            <a href="/privacy" className="cookie-popup-link">
                Privacy Policy
            </a>
        </div>
    );
};

export default CookieConsent;
