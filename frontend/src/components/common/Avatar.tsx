import React, { useState } from 'react';

interface AvatarProps {
    src?: string | null;
    name?: string;
    size?: number | string;
    className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, name = 'User', size = 40, className = '' }) => {
    const [hasError, setHasError] = useState(false);

    const sizeValue = typeof size === 'number' ? `${size}px` : size;
    const fontSize = typeof size === 'number' ? `${Math.max(size * 0.4, 12)}px` : '1rem';

    const containerStyle: React.CSSProperties = {
        width: sizeValue,
        height: sizeValue,
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    };

    if (!src || hasError) {
        return (
            <div 
                className={`avatar-container ${className}`}
                style={{
                    ...containerStyle,
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: 'white',
                    fontSize,
                    fontWeight: 600,
                }}
            >
                {name.charAt(0).toUpperCase()}
            </div>
        );
    }

    return (
        <div className={`avatar-container ${className}`} style={containerStyle}>
            <img
                src={src}
                alt={name}
                onError={() => setHasError(true)}
                style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    display: 'block'
                }}
            />
        </div>
    );
};

export default Avatar;
