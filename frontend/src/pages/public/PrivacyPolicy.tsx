import React from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    Shield,
    Eye,
    Share2,
    Lock,
    UserCheck,
    Cookie,
    Link2,
    Users,
    RefreshCw,
    Mail,
    Globe,
} from 'lucide-react';
import './LegalPages.css';

const PrivacyPolicy: React.FC = () => {
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
                        <h1><span className="gradient-text">Privacy Policy</span></h1>
                        <p className="last-updated">Last Updated: December 27, 2024</p>
                    </div>

                    {/* Introduction */}
                    <div className="legal-card">
                        <div className="legal-section">
                            <h2>
                                <span className="section-icon"><Shield size={16} /></span>
                                Introduction
                            </h2>
                            <p>
                                Welcome to ProVeloce ("we," "our," or "us"). We are committed to protecting your
                                privacy and personal information. This Privacy Policy explains how we collect, use,
                                disclose, and safeguard your information when you use our platform.
                            </p>
                            <div className="legal-highlight">
                                <p>
                                    By using ProVeloce, you agree to the collection and use of information in accordance
                                    with this policy.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Information We Collect */}
                    <div className="legal-card">
                        <div className="legal-section">
                            <h2>
                                <span className="section-icon"><Eye size={16} /></span>
                                Information We Collect
                            </h2>

                            <h3>Information You Provide</h3>
                            <ul>
                                <li><strong>Account Information:</strong> Name, email address, phone number, profile picture</li>
                                <li><strong>Profile Information:</strong> Date of birth, gender, address, bio</li>
                                <li><strong>Professional Information:</strong> Certifications, portfolio, work experience</li>
                                <li><strong>Communication Data:</strong> Support tickets, messages, feedback</li>
                            </ul>

                            <h3>Information Collected Automatically</h3>
                            <ul>
                                <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
                                <li><strong>Usage Data:</strong> Pages visited, features used, time spent on platform</li>
                                <li><strong>Cookies:</strong> Session cookies for authentication and preferences</li>
                            </ul>

                            <h3>Information from Third Parties</h3>
                            <ul>
                                <li><strong>Google OAuth:</strong> When you sign in with Google, we receive your name, email, and profile picture</li>
                            </ul>
                        </div>
                    </div>

                    {/* How We Use Information */}
                    <div className="legal-card">
                        <div className="legal-section">
                            <h2>
                                <span className="section-icon"><Share2 size={16} /></span>
                                How We Use Your Information
                            </h2>
                            <ul>
                                <li>Provide, maintain, and improve our services</li>
                                <li>Process transactions and send related information</li>
                                <li>Send notifications, updates, and support messages</li>
                                <li>Respond to comments, questions, and customer service requests</li>
                                <li>Monitor and analyze usage patterns and trends</li>
                                <li>Detect, prevent, and address technical issues and fraud</li>
                                <li>Comply with legal obligations</li>
                            </ul>
                        </div>
                    </div>

                    {/* Sharing Information */}
                    <div className="legal-card">
                        <div className="legal-section">
                            <h2>
                                <span className="section-icon"><Users size={16} /></span>
                                Sharing Your Information
                            </h2>
                            <p>We may share your information in the following circumstances:</p>
                            <ul>
                                <li><strong>Service Providers:</strong> Third-party vendors who assist in our operations</li>
                                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                                <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
                                <li><strong>With Your Consent:</strong> When you explicitly agree to sharing</li>
                            </ul>
                        </div>
                    </div>

                    {/* Data Security */}
                    <div className="legal-card">
                        <div className="legal-section">
                            <h2>
                                <span className="section-icon"><Lock size={16} /></span>
                                Data Security
                            </h2>
                            <p>
                                We implement appropriate technical and organizational security measures to protect
                                your personal information, including encryption, secure servers, and access controls.
                                However, no method of transmission over the Internet is 100% secure.
                            </p>
                        </div>
                    </div>

                    {/* Your Rights */}
                    <div className="legal-card">
                        <div className="legal-section">
                            <h2>
                                <span className="section-icon"><UserCheck size={16} /></span>
                                Your Rights
                            </h2>
                            <p>You have the right to:</p>
                            <ul>
                                <li>Access your personal information</li>
                                <li>Correct inaccurate data</li>
                                <li>Request deletion of your data</li>
                                <li>Object to processing of your data</li>
                                <li>Data portability</li>
                                <li>Withdraw consent at any time</li>
                            </ul>
                        </div>
                    </div>

                    {/* Cookies */}
                    <div className="legal-card">
                        <div className="legal-section">
                            <h2>
                                <span className="section-icon"><Cookie size={16} /></span>
                                Cookies
                            </h2>
                            <p>
                                We use cookies and similar technologies to enhance your experience, analyze usage,
                                and provide personalized content. You can control cookies through your browser settings.
                            </p>
                        </div>
                    </div>

                    {/* Third-Party Links */}
                    <div className="legal-card">
                        <div className="legal-section">
                            <h2>
                                <span className="section-icon"><Link2 size={16} /></span>
                                Third-Party Links
                            </h2>
                            <p>
                                Our platform may contain links to third-party websites. We are not responsible for
                                their privacy practices and encourage you to review their policies.
                            </p>
                        </div>
                    </div>

                    {/* Changes */}
                    <div className="legal-card">
                        <div className="legal-section">
                            <h2>
                                <span className="section-icon"><RefreshCw size={16} /></span>
                                Changes to This Policy
                            </h2>
                            <p>
                                We may update this Privacy Policy from time to time. We will notify you of any
                                changes by posting the new policy on this page and updating the "Last Updated" date.
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

export default PrivacyPolicy;
