import React from 'react';
import './LegalPages.css';

const TermsOfService: React.FC = () => {
    return (
        <div className="legal-page">
            <div className="legal-container">
                <h1>Terms of Service</h1>
                <p className="last-updated">Last Updated: December 27, 2024</p>

                <section>
                    <h2>1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using ProVeloce ("Platform"), you agree to be bound by these
                        Terms of Service ("Terms"). If you do not agree to these Terms, please do not
                        use our Platform.
                    </p>
                </section>

                <section>
                    <h2>2. Description of Service</h2>
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
                </section>

                <section>
                    <h2>3. User Accounts</h2>

                    <h3>3.1 Registration</h3>
                    <p>
                        To access certain features, you must create an account. You agree to provide
                        accurate, current, and complete information during registration.
                    </p>

                    <h3>3.2 Account Security</h3>
                    <p>
                        You are responsible for maintaining the confidentiality of your account
                        credentials and for all activities under your account.
                    </p>

                    <h3>3.3 Account Types</h3>
                    <ul>
                        <li><strong>Customer:</strong> Users seeking professional services</li>
                        <li><strong>Expert:</strong> Verified professionals providing services</li>
                        <li><strong>Admin:</strong> Platform administrators</li>
                    </ul>
                </section>

                <section>
                    <h2>4. User Conduct</h2>
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
                </section>

                <section>
                    <h2>5. Expert Verification</h2>
                    <p>
                        Experts on our Platform undergo a verification process. However, we do not
                        guarantee the quality, accuracy, or reliability of any expert's services.
                        Users should exercise their own judgment when engaging with experts.
                    </p>
                </section>

                <section>
                    <h2>6. Intellectual Property</h2>
                    <p>
                        All content, features, and functionality of the Platform are owned by ProVeloce
                        and are protected by copyright, trademark, and other intellectual property laws.
                    </p>
                </section>

                <section>
                    <h2>7. User Content</h2>
                    <p>
                        You retain ownership of content you submit. By submitting content, you grant us
                        a non-exclusive, worldwide, royalty-free license to use, display, and distribute
                        such content on our Platform.
                    </p>
                </section>

                <section>
                    <h2>8. Payment Terms</h2>
                    <ul>
                        <li>All fees are clearly displayed before any transaction</li>
                        <li>Payments are processed securely through third-party providers</li>
                        <li>Refund policies are subject to specific service agreements</li>
                    </ul>
                </section>

                <section>
                    <h2>9. Disclaimers</h2>
                    <p>
                        THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR
                        IMPLIED. WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, SECURE,
                        OR ERROR-FREE.
                    </p>
                </section>

                <section>
                    <h2>10. Limitation of Liability</h2>
                    <p>
                        TO THE MAXIMUM EXTENT PERMITTED BY LAW, PROVELOCE SHALL NOT BE LIABLE FOR ANY
                        INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM
                        YOUR USE OF THE PLATFORM.
                    </p>
                </section>

                <section>
                    <h2>11. Indemnification</h2>
                    <p>
                        You agree to indemnify and hold harmless ProVeloce from any claims, damages,
                        losses, or expenses arising from your violation of these Terms or your use of
                        the Platform.
                    </p>
                </section>

                <section>
                    <h2>12. Termination</h2>
                    <p>
                        We reserve the right to suspend or terminate your account at any time for
                        violation of these Terms or for any other reason at our sole discretion.
                    </p>
                </section>

                <section>
                    <h2>13. Changes to Terms</h2>
                    <p>
                        We may modify these Terms at any time. Continued use of the Platform after
                        changes constitutes acceptance of the new Terms.
                    </p>
                </section>

                <section>
                    <h2>14. Governing Law</h2>
                    <p>
                        These Terms shall be governed by and construed in accordance with the laws of
                        India, without regard to conflict of law principles.
                    </p>
                </section>

                <section>
                    <h2>15. Contact Information</h2>
                    <p>For questions about these Terms, contact us at:</p>
                    <ul>
                        <li><strong>Email:</strong> support@proveloce.com</li>
                        <li><strong>Website:</strong> https://proveloce.com</li>
                    </ul>
                </section>
            </div>
        </div>
    );
};

export default TermsOfService;
