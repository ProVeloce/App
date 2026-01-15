import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search, AlertTriangle, HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './NotFound.css';

const NotFound: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();

    const getDashboardLink = () => {
        if (!isAuthenticated) return '/';
        
        const role = user?.role?.toUpperCase();
        switch (role) {
            case 'SUPERADMIN':
                return '/superadmin/dashboard';
            case 'ADMIN':
                return '/admin/dashboard';
            case 'ANALYST':
                return '/analyst/dashboard';
            case 'EXPERT':
                return '/expert/dashboard';
            default:
                return '/dashboard';
        }
    };

    return (
        <div className="not-found-page">
            <div className="not-found-container">
                <div className="not-found-illustration">
                    <div className="error-code">
                        <span className="digit">4</span>
                        <span className="digit zero">
                            <AlertTriangle size={80} />
                        </span>
                        <span className="digit">4</span>
                    </div>
                </div>

                <div className="not-found-content">
                    <h1 className="not-found-title">Page Not Found</h1>
                    <p className="not-found-description">
                        Oops! The page you're looking for doesn't exist or has been moved.
                        This could be due to a mistyped URL, an outdated link, or the page may have been removed.
                    </p>

                    <div className="not-found-suggestions">
                        <h3>Here are some helpful links:</h3>
                        <ul>
                            <li>
                                <Search size={16} />
                                <span>Double-check the URL for typos</span>
                            </li>
                            <li>
                                <Home size={16} />
                                <span>Go back to the homepage or dashboard</span>
                            </li>
                            <li>
                                <HelpCircle size={16} />
                                <span>Contact support if you need assistance</span>
                            </li>
                        </ul>
                    </div>

                    <div className="not-found-actions">
                        <button 
                            className="btn btn-secondary" 
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft size={18} />
                            Go Back
                        </button>
                        <Link to={getDashboardLink()} className="btn btn-primary">
                            <Home size={18} />
                            {isAuthenticated ? 'Go to Dashboard' : 'Go to Homepage'}
                        </Link>
                    </div>

                    {isAuthenticated && (
                        <div className="not-found-help">
                            <p>
                                Need help? Visit our{' '}
                                <Link to="/help-desk">Help Desk</Link>
                                {' '}to create a support ticket.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="not-found-decoration">
                <div className="floating-shape shape-1"></div>
                <div className="floating-shape shape-2"></div>
                <div className="floating-shape shape-3"></div>
            </div>
        </div>
    );
};

export default NotFound;
