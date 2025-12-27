import React from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    FileText,
    Server,
    UserPlus,
    AlertTriangle,
    Award,
    Copyright,
    FileEdit,
    CreditCard,
    AlertCircle,
    Scale,
    Shield,
    XCircle,
    RefreshCw,
    Gavel,
    Mail,
    Globe,
} from 'lucide-react';
import './LegalPages.css';

const TermsOfService: React.FC = () => {
    return (
        <div className="legal-page">
            {/* Navigation */}
            <nav className="legal-nav">
                <div className="container">
                    <div className="nav-content">
                        <Link to="/" className="nav-logo">ProVeloce</Link>
                        <Link to="/" className="nav-back">
                            <ArrowLeft size={18} />
                            Back to Home
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <div className="legal-content">
                <div className="legal-container">
                    {/* Header */}
                    <div className="legal-header">
                        <h1><span className="gradient-text">Terms of Service</span></h1>
                        <p className="last-updated">Last Updated: December 27, 2024</p>
                    </div>

                    {/* Acceptance */}
                    <div className="legal-card">
                        <div className="legal-section">
                            <h2>
                                <span className="section-icon"><FileText size={16} /></span>
                                Acceptance of Terms
                            </h2>
                            <p>
                                By accessing or using ProVeloce ("Platform"), you agree to be bound by these
                                Terms of Service ("Terms"). If you do not agree to these Terms, please do not
                                use our Platform.
                            </p>
                            <div className="legal-highlight">
                                <p>
                                    Please read these terms carefully before using our services. Your use of the
                                    Platform constitutes acceptance of these Terms.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Description of Service */}
                    <div className="legal-card">
                        <div className="legal-section">
                            <h2>
                                <span className="section-icon"><Server size={16} /></span>
                                Description of Service
                            </h2>
                            <p>
                                ProVeloce is a professional services platform that connects customers with
                                verified experts. Our services include:
                            </p>
                            <ul>
                                <li>Expert verification and certification</li>
                                <li>Task management and assignment</li>
                                <li>Portfolio and credential management</li>
                                <li>Secure communication between parties</li>
                                <li>Support ticket system</li>
                            </ul>
                        </div>
                    </div>

                    {/* User Accounts */}
                    <div className="legal-card">
                        <div className="legal-section">
                            <h2>
                                <span className="section-icon"><UserPlus size={16} /></span>
                                User Accounts
                            </h2>

                            <h3>Registration</h3>
                            <p>
                                To access certain features, you must create an account. You agree to provide
                                accurate, current, and complete information during registration.
                            </p>

                            <h3>Account Security</h3>
                            <p>
                                You are responsible for maintaining the confidentiality of your account
                                credentials and for all activities under your account.
                            </p>

                            <h3>Account Types</h3>
                            <ul>
                                <li><strong>Customer:</strong> Users seeking professional services</li>
                                <li><strong>Expert:</strong> Verified professionals providing services</li>
                                <li><strong>Admin:</strong> Platform administrators</li>
                            </ul>
                        </div>
                    </div>

                    {/* User Conduct */}
                    <div className="legal-card">
                        <div className="legal-section">
                            <h2>
                                <span className="section-icon"><AlertTriangle size={16} /></span>
                                User Conduct
                            </h2>
                            <p>You agree NOT to:</p>
                            <ul>
                                <li>Violate any applicable laws or regulations</li>
                                <li>Impersonate any person or entity</li>
                                <li>Upload false, misleading, or fraudulent information</li>
                                <li>Interfere with the proper functioning of the Platform</li>
                                <li>Attempt to gain unauthorized access to any systems</li>
                                <li>Harass, abuse, or harm other users</li>
                                <li>Use the Platform for any illegal or unauthorized purpose</li>
                            </ul>
                        </div>
                    </div>

                    {/* Expert Verification */}
                    <div className="legal-card">
                        <div className="legal-section">
                            <h2>
                                <span className="section-icon"><Award size={16} /></span>
                                Expert Verification
                            </h2>
                            <p>
                                Experts on our Platform undergo a verification process. However, we do not
                                guarantee the quality, accuracy, or reliability of any expert's services.
                                Users should exercise their own judgment when engaging with experts.
                            </p>
                        </div>
                    </div>

                    {/* Intellectual Property */}
                    <div className="legal-card">
                        <div className="legal-section">
                            <h2>
                                <span className="section-icon"><Copyright size={16} /></span>
                                Intellectual Property
                            </h2>
                            <p>
                                All content, features, and functionality of the Platform are owned by ProVeloce
                                and are protected by copyright, trademark, and other intellectual property laws.
                            </p>
                        </div>
                    </div>

                    {/* User Content */}
                    <div className="legal-card">
                        <div className="legal-section">
                            <h2>
                                <span className="section-icon"><FileEdit size={16} /></span>
                                User Content
                            </h2>
                            <p>
                                You retain ownership of content you submit. By submitting content, you grant us
                                a non-exclusive, worldwide, royalty-free license to use, display, and distribute
                                such content on our Platform.
                            </p>
                        </div>
                    </div>

                    {/* Payment Terms */}
                    <div className="legal-card">
                        <div className="legal-section">
                            <h2>
                                <span className="section-icon"><CreditCard size={16} /></span>
                                Payment Terms
                            </h2>
                            <ul>
                                <li>All fees are clearly displayed before any transaction</li>
                                <li>Payments are processed securely through third-party providers</li>
                                <li>Refund policies are subject to specific service agreements</li>
                            </ul>
                        </div>
                    </div>

                    {/* Disclaimers */}
                    <div className="legal-card">
                        <div className="legal-section">
                            <h2>
                                <span className="section-icon"><AlertCircle size={16} /></span>
                                Disclaimers
                            </h2>
                            <p>
                                THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR
                                IMPLIED. WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, SECURE,
                                OR ERROR-FREE.
                            </p>
                        </div>
                    </div>

                    {/* Limitation of Liability */}
                    <div className="legal-card">
                        <div className="legal-section">
                            <h2>
                                <span className="section-icon"><Scale size={16} /></span>
                                Limitation of Liability
                            </h2>
                            <p>
                                TO THE MAXIMUM EXTENT PERMITTED BY LAW, PROVELOCE SHALL NOT BE LIABLE FOR ANY
                                INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM
                                YOUR USE OF THE PLATFORM.
                            </p>
                        </div>
                    </div>

                    {/* Indemnification */}
                    <div className="legal-card">
                        <div className="legal-section">
                            <h2>
                                <span className="section-icon"><Shield size={16} /></span>
                                Indemnification
                            </h2>
                            <p>
                                You agree to indemnify and hold harmless ProVeloce from any claims, damages,
                                losses, or expenses arising from your violation of these Terms or your use of
                                the Platform.
                            </p>
                        </div>
                    </div>

                    {/* Termination */}
                    <div className="legal-card">
                        <div className="legal-section">
                            <h2>
                                <span className="section-icon"><XCircle size={16} /></span>
                                Termination
                            </h2>
                            <p>
                                We reserve the right to suspend or terminate your account at any time for
                                violation of these Terms or for any other reason at our sole discretion.
                            </p>
                        </div>
                    </div>

                    {/* Changes to Terms */}
                    <div className="legal-card">
                        <div className="legal-section">
                            <h2>
                                <span className="section-icon"><RefreshCw size={16} /></span>
                                Changes to Terms
                            </h2>
                            <p>
                                We may modify these Terms at any time. Continued use of the Platform after
                                changes constitutes acceptance of the new Terms.
                            </p>
                        </div>
                    </div>

                    {/* Governing Law */}
                    <div className="legal-card">
                        <div className="legal-section">
                            <h2>
                                <span className="section-icon"><Gavel size={16} /></span>
                                Governing Law
                            </h2>
                            <p>
                                These Terms shall be governed by and construed in accordance with the laws of
                                India, without regard to conflict of law principles.
                            </p>
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="legal-contact">
                        <h3>Have Questions?</h3>
                        <div className="legal-contact-links">
                            <a href="mailto:support@proveloce.com">
                                <Mail size={18} />
                                support@proveloce.com
                            </a>
                            <a href="https://proveloce.com" target="_blank" rel="noopener noreferrer">
                                <Globe size={18} />
                                proveloce.com
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="legal-footer">
                <div className="container">
                    <p>&copy; {new Date().getFullYear()} ProVeloce. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default TermsOfService;
