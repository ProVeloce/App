import React from 'react';
import './LegalPages.css';

const PrivacyPolicy: React.FC = () => {
    return (
        <div className="legal-page">
            <div className="legal-container">
                <h1>Privacy Policy</h1>
                <p className="last-updated">Last Updated: December 27, 2024</p>

                <section>
                    <h2>1. Introduction</h2>
                    <p>
                        Welcome to ProVeloce ("we," "our," or "us"). We are committed to protecting your
                        privacy and personal information. This Privacy Policy explains how we collect, use,
                        disclose, and safeguard your information when you use our platform.
                    </p>
                </section>

                <section>
                    <h2>2. Information We Collect</h2>

                    <h3>2.1 Information You Provide</h3>
                    <ul>
                        <li><strong>Account Information:</strong> Name, email address, phone number, profile picture</li>
                        <li><strong>Profile Information:</strong> Date of birth, gender, address, bio</li>
                        <li><strong>Professional Information:</strong> Certifications, portfolio, work experience</li>
                        <li><strong>Communication Data:</strong> Support tickets, messages, feedback</li>
                    </ul>

                    <h3>2.2 Information Collected Automatically</h3>
                    <ul>
                        <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
                        <li><strong>Usage Data:</strong> Pages visited, features used, time spent on platform</li>
                        <li><strong>Cookies:</strong> Session cookies for authentication and preferences</li>
                    </ul>

                    <h3>2.3 Information from Third Parties</h3>
                    <ul>
                        <li><strong>Google OAuth:</strong> When you sign in with Google, we receive your name, email, and profile picture</li>
                    </ul>
                </section>

                <section>
                    <h2>3. How We Use Your Information</h2>
                    <ul>
                        <li>Provide, maintain, and improve our services</li>
                        <li>Process transactions and send related information</li>
                        <li>Send notifications, updates, and support messages</li>
                        <li>Respond to comments, questions, and customer service requests</li>
                        <li>Monitor and analyze usage patterns and trends</li>
                        <li>Detect, prevent, and address technical issues and fraud</li>
                        <li>Comply with legal obligations</li>
                    </ul>
                </section>

                <section>
                    <h2>4. Sharing Your Information</h2>
                    <p>We may share your information in the following circumstances:</p>
                    <ul>
                        <li><strong>Service Providers:</strong> Third-party vendors who assist in our operations</li>
                        <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                        <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
                        <li><strong>With Your Consent:</strong> When you explicitly agree to sharing</li>
                    </ul>
                </section>

                <section>
                    <h2>5. Data Security</h2>
                    <p>
                        We implement appropriate technical and organizational security measures to protect
                        your personal information, including encryption, secure servers, and access controls.
                        However, no method of transmission over the Internet is 100% secure.
                    </p>
                </section>

                <section>
                    <h2>6. Your Rights</h2>
                    <p>You have the right to:</p>
                    <ul>
                        <li>Access your personal information</li>
                        <li>Correct inaccurate data</li>
                        <li>Request deletion of your data</li>
                        <li>Object to processing of your data</li>
                        <li>Data portability</li>
                        <li>Withdraw consent at any time</li>
                    </ul>
                </section>

                <section>
                    <h2>7. Cookies</h2>
                    <p>
                        We use cookies and similar technologies to enhance your experience, analyze usage,
                        and provide personalized content. You can control cookies through your browser settings.
                    </p>
                </section>

                <section>
                    <h2>8. Third-Party Links</h2>
                    <p>
                        Our platform may contain links to third-party websites. We are not responsible for
                        their privacy practices and encourage you to review their policies.
                    </p>
                </section>

                <section>
                    <h2>9. Children's Privacy</h2>
                    <p>
                        Our services are not intended for users under 18 years of age. We do not knowingly
                        collect information from children.
                    </p>
                </section>

                <section>
                    <h2>10. Changes to This Policy</h2>
                    <p>
                        We may update this Privacy Policy from time to time. We will notify you of any
                        changes by posting the new policy on this page and updating the "Last Updated" date.
                    </p>
                </section>

                <section>
                    <h2>11. Contact Us</h2>
                    <p>
                        If you have questions about this Privacy Policy, please contact us at:
                    </p>
                    <ul>
                        <li><strong>Email:</strong> support@proveloce.com</li>
                        <li><strong>Website:</strong> https://proveloce.com</li>
                    </ul>
                </section>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
