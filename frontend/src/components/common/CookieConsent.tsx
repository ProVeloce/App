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

// Cookie image - using local asset or fallback to CDN
const COOKIE_IMAGE_URL = '/images/cookie.png';
const COOKIE_FALLBACK_URL = 'https://cdn-icons-png.flaticon.com/512/1047/1047711.png';

/**
 * Modern Cookie Consent Popup Component
 * Horizontal layout, bottom-right corner
 * Professional MNC-style design
 */
const CookieConsent: React.FC<CookieConsentProps> = ({ onAccept, onReject }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [imgSrc, setImgSrc] = useState(COOKIE_IMAGE_URL);

    useEffect(() => {
        const consentStatus = getCookieConsentStatus();
        if (consentStatus === 'pending') {
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

    const handleImageError = () => {
        setImgSrc(COOKIE_FALLBACK_URL);
    };

    if (!isVisible) return null;

    return (
        <div className={`cookie-popup ${isAnimating ? 'visible' : ''}`}>
            <div className="cookie-popup-image-wrapper">
                <img 
                    src={imgSrc} 
                    alt="" 
                    className="cookie-popup-image"
                    onError={handleImageError}
                />
            </div>
            
            <div className="cookie-popup-content">
                <p className="cookie-popup-message">
                    We use cookies to enhance your experience. 
                    <a href="/privacy" className="cookie-popup-link">Learn more</a>
                </p>
            </div>
            
            <div className="cookie-popup-actions">
                <button 
                    className="cookie-popup-btn cookie-popup-btn-decline" 
                    onClick={handleReject}
                >
                    Decline
                </button>
                <button 
                    className="cookie-popup-btn cookie-popup-btn-accept" 
                    onClick={handleAccept}
                >
                    Accept
                </button>
            </div>
        </div>
    );
};

export default CookieConsent;
