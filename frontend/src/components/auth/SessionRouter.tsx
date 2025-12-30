import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '../../context/SessionContext';
import { useAuth } from '../../context/AuthContext';
import { isValidSessionToken } from '../../utils/sessionUrl';

/**
 * SessionRouter handles encrypted session URL routing.
 * It decodes the 512-bit session token from the URL and redirects to the appropriate page.
 */
const SessionRouter: React.FC = () => {
    const { sessionToken } = useParams<{ sessionToken: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { decodeUrl, sessionId } = useSession();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (!sessionToken) {
            navigate('/login', { replace: true });
            return;
        }

        // Validate token format
        if (!isValidSessionToken(sessionToken)) {
            navigate('/login', { replace: true });
            return;
        }

        // Decode the session token
        const { sessionId: decodedSessionId, route } = decodeUrl(sessionToken);

        if (!decodedSessionId || !route) {
            navigate('/login', { replace: true });
            return;
        }

        // Verify session matches current session
        if (!isAuthenticated || !sessionId) {
            navigate('/login', { replace: true });
            return;
        }

        // Navigate to the decoded route
        // Use internal navigation without changing URL (the token stays in URL)
        navigate(route, { replace: true, state: { fromSessionToken: true } });
    }, [sessionToken, decodeUrl, sessionId, isAuthenticated, navigate]);

    return (
        <div className="loading-screen">
            <div className="loading-spinner" />
            <p>Redirecting...</p>
        </div>
    );
};

export default SessionRouter;
