import React from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight,
    CheckCircle,
    Users,
    Shield,
    Zap,
    Star,
    ChevronRight,
    Mail,
    Phone,
    MapPin,
    Facebook,
    Twitter,
    Linkedin,
    Instagram,
} from 'lucide-react';
import './LandingPage.css';

const LandingPage: React.FC = () => {
    const features = [
        {
            image: '/images/expert-marketplace.png',
            title: 'Expert Marketplace',
            description: 'Connect with verified professionals across various domains for your projects.',
        },
        {
            image: '/images/verified.png',
            title: 'Verified Experts',
            description: 'All experts go through a rigorous verification process to ensure quality.',
        },
        {
            image: '/images/fast-matching.png',
            title: 'Fast Matching',
            description: 'Our smart algorithm matches you with the perfect expert in minutes.',
        },
        {
            image: '/images/quality-assurance.png',
            title: 'Quality Assurance',
            description: 'Built-in review system and task management for seamless collaboration.',
        },
    ];

    const testimonials = [
        {
            name: 'Sarah Johnson',
            role: 'CEO, TechStart Inc.',
            content: 'ProVeloce helped us find the perfect consultants for our digital transformation project. Highly recommended!',
            rating: 5,
        },
        {
            name: 'Michael Chen',
            role: 'Product Manager, InnovateCo',
            content: 'The verification process gives us confidence that we are working with true professionals.',
            rating: 5,
        },
        {
            name: 'Emily Rodriguez',
            role: 'Freelance Designer',
            content: 'As an expert on the platform, I love how easy it is to manage my portfolio and connect with clients.',
            rating: 5,
        },
    ];

    const roadmap = [
        { phase: 'Q1 2025', title: 'Platform Launch', description: 'Core marketplace and expert verification system' },
        { phase: 'Q2 2025', title: 'Payment Integration', description: 'Secure payments and escrow services' },
        { phase: 'Q3 2025', title: 'Mobile App', description: 'iOS and Android applications' },
        { phase: 'Q4 2025', title: 'AI Matching', description: 'Smart expert-project matching algorithms' },
    ];

    return (
        <div className="landing-page">
            {/* Navigation */}
            <nav className="landing-nav">
                <div className="container">
                    <div className="nav-content">
                        <Link to="/" className="nav-logo">ProVeloce</Link>
                        <div className="nav-links">
                            <a href="#features">Features</a>
                            <a href="#about">About</a>
                            <a href="#roadmap">Roadmap</a>
                            <a href="#testimonials">Testimonials</a>
                        </div>
                        <div className="nav-actions">
                            <Link to="/login" className="btn btn-ghost">Login</Link>
                            <Link to="/signup" className="btn btn-primary">Get Started</Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero">
                <div className="container">
                    <div className="hero-content">
                        <h1 className="hero-title">
                            Connect with <span className="gradient-text">Verified Experts</span> for Your Projects
                        </h1>
                        <p className="hero-subtitle">
                            ProVeloce is the premier platform for finding and working with verified professionals.
                            From consultation to project completion, we ensure quality at every step.
                        </p>
                        <div className="hero-actions">
                            <Link to="/signup" className="btn btn-primary btn-lg">
                                Get Started <ArrowRight size={20} />
                            </Link>
                            <Link to="/login" className="btn btn-outline btn-lg">
                                Login
                            </Link>
                            <a href="#features" className="btn btn-ghost btn-lg">
                                Learn More <ChevronRight size={20} />
                            </a>
                        </div>
                    </div>
                    <div className="hero-visual">
                        <div className="hero-card card-1">
                            <div className="card-icon success"><CheckCircle size={24} /></div>
                            <span>Expert Verified</span>
                        </div>
                        <div className="hero-card card-2">
                            <div className="card-icon primary"><Star size={24} /></div>
                            <span>4.9 Rating</span>
                        </div>
                        <div className="hero-card card-3">
                            <div className="card-icon accent"><Users size={24} /></div>
                            <span>10k+ Experts</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Why Choose ProVeloce?</h2>
                        <p className="section-subtitle">
                            Everything you need to find and work with the best professionals
                        </p>
                    </div>
                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <div key={index} className="feature-card">
                                <div className="feature-image">
                                    <img src={feature.image} alt={feature.title} loading="lazy" />
                                </div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="about">
                <div className="container">
                    <div className="about-grid">
                        <div className="about-content">
                            <h2>Our Vision</h2>
                            <p>
                                We envision a world where talent and opportunity are seamlessly connected,
                                regardless of geographical boundaries.
                            </p>
                            <h2>Our Mission</h2>
                            <p>
                                To create a trusted platform that empowers professionals to showcase their expertise
                                and enables businesses to find the perfect match for their needs.
                            </p>
                            <h2>What We Solve</h2>
                            <p>
                                Finding verified, reliable experts is challenging. We solve this by implementing
                                rigorous verification processes and providing tools for seamless collaboration.
                            </p>
                        </div>
                        <div className="about-stats">
                            <div className="stat-card">
                                <span className="stat-number">10,000+</span>
                                <span className="stat-label">Verified Experts</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-number">50,000+</span>
                                <span className="stat-label">Projects Completed</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-number">98%</span>
                                <span className="stat-label">Satisfaction Rate</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-number">120+</span>
                                <span className="stat-label">Countries Served</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Roadmap Section */}
            <section id="roadmap" className="roadmap">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Product Roadmap</h2>
                        <p className="section-subtitle">Our journey to revolutionize expert services</p>
                    </div>
                    <div className="roadmap-timeline">
                        {roadmap.map((item, index) => (
                            <div key={index} className="roadmap-item">
                                <div className="roadmap-phase">{item.phase}</div>
                                <div className="roadmap-content">
                                    <h3>{item.title}</h3>
                                    <p>{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="testimonials">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">What Our Users Say</h2>
                        <p className="section-subtitle">Hear from our satisfied customers and experts</p>
                    </div>
                    <div className="testimonials-grid">
                        {testimonials.map((testimonial, index) => (
                            <div key={index} className="testimonial-card">
                                <div className="testimonial-rating">
                                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                                        <Star key={i} size={16} fill="var(--warning-500)" color="var(--warning-500)" />
                                    ))}
                                </div>
                                <p className="testimonial-content">"{testimonial.content}"</p>
                                <div className="testimonial-author">
                                    <div className="author-avatar">
                                        {testimonial.name.charAt(0)}
                                    </div>
                                    <div className="author-info">
                                        <span className="author-name">{testimonial.name}</span>
                                        <span className="author-role">{testimonial.role}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta">
                <div className="container">
                    <div className="cta-content">
                        <h2>Ready to Get Started?</h2>
                        <p>Join thousands of professionals and businesses on ProVeloce today.</p>
                        <div className="cta-actions">
                            <Link to="/signup" className="btn btn-white btn-lg">
                                Create Account <ArrowRight size={20} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-grid">
                        <div className="footer-brand">
                            <h3 className="footer-logo">ProVeloce</h3>
                            <p>Connecting talent with opportunity. Your trusted expert services platform.</p>
                            <div className="footer-social">
                                <a href="#" aria-label="Facebook"><Facebook size={20} /></a>
                                <a href="#" aria-label="Twitter"><Twitter size={20} /></a>
                                <a href="#" aria-label="LinkedIn"><Linkedin size={20} /></a>
                                <a href="#" aria-label="Instagram"><Instagram size={20} /></a>
                            </div>
                        </div>
                        <div className="footer-links">
                            <h4>Quick Links</h4>
                            <a href="#features">Features</a>
                            <a href="#about">About Us</a>
                            <a href="#roadmap">Roadmap</a>
                            <a href="#testimonials">Testimonials</a>
                        </div>
                        <div className="footer-links">
                            <h4>Legal</h4>
                            <Link to="/privacy">Privacy Policy</Link>
                            <Link to="/terms">Terms & Conditions</Link>
                            <Link to="/cookies">Cookie Policy</Link>
                        </div>
                        <div className="footer-contact">
                            <h4>Contact Us</h4>
                            <a href="mailto:support@proveloce.com">
                                <Mail size={16} /> support@proveloce.com
                            </a>
                            <a href="tel:+1234567890">
                                <Phone size={16} /> +1 (234) 567-890
                            </a>
                            <p><MapPin size={16} /> San Francisco, CA</p>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>&copy; {new Date().getFullYear()} ProVeloce. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
