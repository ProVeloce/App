import React, { useState } from 'react';

interface AvatarProps {
    src?: string | null;
    name?: string;
    size?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, name = 'User', size }) => {
    const [hasError, setHasError] = useState(false);

    if (!src || hasError) {
        return <span>{name.charAt(0).toUpperCase()}</span>;
    }

    return (
        <img
            src={src}
            alt={name}
            onError={() => setHasError(true)}
            style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover',
                display: 'block'
            }}
        />
    );
};

export default Avatar;
