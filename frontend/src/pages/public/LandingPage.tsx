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
    Clock,
    CreditCard,
    MessageSquare,
    Award,
    Target,
    Briefcase,
    Search,
    UserCheck,
    Calendar,
    TrendingUp,
} from 'lucide-react';
import './LandingPage.css';

const LandingPage: React.FC = () => {
    // Why Choose ProVeloce Features
    const features = [
        {
            image: 'images/expert-marketplace.png',
            title: 'Expert Marketplace',
            description: 'Access a curated network of verified professionals across 50+ specialized domains.',
        },
        {
            image: 'images/verified.png',
            title: 'Verified Professionals',
            description: 'Every expert undergoes rigorous background checks and skill assessments.',
        },
        {
            image: 'images/fast-matching.png',
            title: 'Smart Matching',
            description: 'Our AI-powered algorithm connects you with the perfect expert within minutes.',
        },
        {
            image: 'images/quality-assurance.png',
            title: 'Quality Guaranteed',
            description: 'Built-in milestone tracking, secure payments, and satisfaction guarantee.',
        },
    ];

    // Service Categories
    const services = [
        { icon: Briefcase, title: 'Business Consulting', count: '2,500+ Experts' },
        { icon: Target, title: 'Digital Marketing', count: '1,800+ Experts' },
        { icon: Shield, title: 'Legal Advisory', count: '900+ Experts' },
        { icon: TrendingUp, title: 'Financial Planning', count: '1,200+ Experts' },
        { icon: MessageSquare, title: 'Career Coaching', count: '1,500+ Experts' },
        { icon: Award, title: 'Technical Mentorship', count: '3,000+ Experts' },
    ];

    // How It Works - For Customers
    const customerSteps = [
        { step: '1', title: 'Post Your Requirement', description: 'Describe your project or consultation need in detail.' },
        { step: '2', title: 'Get Matched', description: 'Receive proposals from verified experts within hours.' },
        { step: '3', title: 'Collaborate Securely', description: 'Work together with built-in messaging and task tracking.' },
        { step: '4', title: 'Pay with Confidence', description: 'Release payment only when you\'re satisfied with results.' },
    ];

    // How It Works - For Experts
    const expertSteps = [
        { step: '1', title: 'Create Your Profile', description: 'Showcase your expertise, experience, and portfolio.' },
        { step: '2', title: 'Get Verified', description: 'Complete our verification process to build trust.' },
        { step: '3', title: 'Receive Projects', description: 'Get matched with clients seeking your skills.' },
        { step: '4', title: 'Grow Your Business', description: 'Build your reputation and earn on your terms.' },
    ];

    // Platform Features
    const platformFeatures = [
        { icon: UserCheck, title: 'Verified Professionals', description: 'Every expert is background-checked and skill-verified.' },
        { icon: Zap, title: 'Fast Matching Algorithm', description: 'AI-powered matching finds the right expert in minutes.' },
        { icon: CreditCard, title: 'Secure Payments', description: 'Escrow protection ensures safe, transparent transactions.' },
        { icon: Calendar, title: 'Task Tracking Dashboard', description: 'Monitor progress, milestones, and deliverables in real-time.' },
        { icon: MessageSquare, title: 'Direct Communication', description: 'Built-in messaging and video calls for seamless collaboration.' },
        { icon: Clock, title: '24/7 Support', description: 'Round-the-clock assistance for both clients and experts.' },
    ];

    // Testimonials
    const testimonials = [
        {
            name: 'Priya Sharma',
            role: 'Founder, FinTech Startup',
            content: 'ProVeloce connected us with a financial advisor who helped structure our Series A funding. The verification process gave us complete confidence.',
            rating: 5,
            avatar: 'PS',
        },
        {
            name: 'Rajesh Kumar',
            role: 'Product Director, TechCorp',
            content: 'Finding specialized consultants used to take weeks. With ProVeloce, we had three qualified proposals within 24 hours. Game-changer!',
            rating: 5,
            avatar: 'RK',
        },
        {
            name: 'Dr. Anita Patel',
            role: 'Healthcare Consultant',
            content: 'As an expert on the platform, I appreciate how easy it is to manage my bookings and build my professional reputation. Highly recommend!',
            rating: 5,
            avatar: 'AP',
        },
    ];

    // Why Choose Benefits
    const benefits = [
        'Access to 10,000+ verified experts across 50+ domains',
        'Smart AI matching ensures perfect expert-project fit',
        'Secure escrow payments with satisfaction guarantee',
        'Real-time project tracking and milestone management',
        'No upfront fees — pay only for completed work',
        '24/7 dedicated support for seamless experience',
        'Trusted by 5,000+ businesses worldwide',
        'Average expert response time under 4 hours',
    ];

    // Roadmap
    const roadmap = [
        { phase: 'Q1 2025', title: 'Platform Launch', description: 'Core marketplace with expert verification system', status: 'completed' },
        { phase: 'Q2 2025', title: 'Payment Integration', description: 'Secure payments with escrow protection', status: 'current' },
        { phase: 'Q3 2025', title: 'Mobile Applications', description: 'iOS and Android apps for on-the-go access', status: 'upcoming' },
        { phase: 'Q4 2025', title: 'AI-Powered Insights', description: 'Smart recommendations and analytics dashboard', status: 'upcoming' },
    ];

    return (
        <div className="landing-page">
            {/* Navigation */}
            <nav className="landing-nav">
                <div className="container">
                    <div className="nav-content">
                        <Link to="/" className="nav-logo">
                            <img src="/logo.png" alt="ProVeloce Connect" className="nav-logo-img" />
                            <span>ProVeloce Connect</span>
                        </Link>
                        <div className="nav-links">
                            <a href="#how-it-works">How It Works</a>
                            <a href="#services">Services</a>
                            <a href="#features">Features</a>
                            <a href="#testimonials">Testimonials</a>
                        </div>
                        <div className="nav-actions">
                            <Link to="/login" className="btn btn-ghost">Login</Link>
                            <Link to="/signup" className="btn btn-primary">Get Started Free</Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero">
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-badge">
                            <span className="badge-dot"></span>
                            Trusted by 5,000+ Businesses Worldwide
                        </div>
                        <h1 className="hero-title">
                            Transform Ideas Into Reality with <span className="gradient-text">Verified Experts</span>
                        </h1>
                        <p className="hero-subtitle">
                            ProVeloce is the premier skill marketplace connecting you with verified professionals for consultations,
                            projects, and services. From concept to completion — we ensure excellence at every step.
                        </p>
                        <div className="hero-actions">
                            <Link to="/signup" className="btn btn-primary btn-lg">
                                Hire an Expert <ArrowRight size={20} />
                            </Link>
                            <Link to="/signup?role=expert" className="btn btn-outline btn-lg">
                                Become an Expert
                            </Link>
                            <a href="#how-it-works" className="btn btn-ghost btn-lg">
                                See How It Works <ChevronRight size={20} />
                            </a>
                        </div>
                        <div className="hero-stats">
                            <div className="hero-stat">
                                <span className="stat-value">10K+</span>
                                <span className="stat-label">Verified Experts</span>
                            </div>
                            <div className="hero-stat">
                                <span className="stat-value">50K+</span>
                                <span className="stat-label">Projects Delivered</span>
                            </div>
                            <div className="hero-stat">
                                <span className="stat-value">98%</span>
                                <span className="stat-label">Satisfaction Rate</span>
                            </div>
                        </div>
                    </div>
                    <div className="hero-visual">
                        <div className="hero-card card-1">
                            <div className="card-icon success"><CheckCircle size={24} /></div>
                            <span>Expert Verified</span>
                        </div>
                        <div className="hero-card card-2">
                            <div className="card-icon primary"><Star size={24} /></div>
                            <span>4.9 Average Rating</span>
                        </div>
                        <div className="hero-card card-3">
                            <div className="card-icon accent"><Zap size={24} /></div>
                            <span>Matched in Minutes</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Value Proposition */}
            <section className="value-prop">
                <div className="container">
                    <div className="value-grid">
                        <div className="value-item">
                            <Shield className="value-icon" size={32} />
                            <h3>Verified & Trusted</h3>
                            <p>Every expert is background-checked and skill-verified before joining our platform.</p>
                        </div>
                        <div className="value-item">
                            <Zap className="value-icon" size={32} />
                            <h3>Fast & Efficient</h3>
                            <p>Get matched with the perfect expert for your project within minutes, not weeks.</p>
                        </div>
                        <div className="value-item">
                            <CreditCard className="value-icon" size={32} />
                            <h3>Secure Payments</h3>
                            <p>Escrow protection ensures you only pay when you're completely satisfied.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="how-it-works">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">How ProVeloce Works</h2>
                        <p className="section-subtitle">
                            Simple, transparent process for both clients and professionals
                        </p>
                    </div>

                    <div className="how-tabs">
                        <div className="how-section">
                            <h3 className="how-section-title">
                                <Search size={24} />
                                For Clients
                            </h3>
                            <div className="steps-grid">
                                {customerSteps.map((item, index) => (
                                    <div key={index} className="step-card">
                                        <div className="step-number">{item.step}</div>
                                        <div className="step-card-content">
                                            <h4>{item.title}</h4>
                                            <p>{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="how-section">
                            <h3 className="how-section-title">
                                <UserCheck size={24} />
                                For Experts
                            </h3>
                            <div className="steps-grid">
                                {expertSteps.map((item, index) => (
                                    <div key={index} className="step-card">
                                        <div className="step-number">{item.step}</div>
                                        <div className="step-card-content">
                                            <h4>{item.title}</h4>
                                            <p>{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="services">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Expert Services & Categories</h2>
                        <p className="section-subtitle">
                            Find verified professionals across diverse domains
                        </p>
                    </div>
                    <div className="services-grid">
                        {services.map((service, index) => (
                            <div key={index} className="service-card">
                                <service.icon className="service-icon" size={32} />
                                <h3>{service.title}</h3>
                                <span className="service-count">{service.count}</span>
                            </div>
                        ))}
                    </div>
                    <div className="services-cta">
                        <Link to="/signup" className="btn btn-primary">
                            Explore All Categories <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Why Choose ProVeloce?</h2>
                        <p className="section-subtitle">
                            Everything you need to find and work with verified professionals
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

            {/* Platform Features Grid */}
            <section className="platform-features">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Powerful Platform Features</h2>
                        <p className="section-subtitle">
                            Built for seamless collaboration and trust
                        </p>
                    </div>
                    <div className="platform-grid">
                        {platformFeatures.map((feature, index) => (
                            <div key={index} className="platform-card">
                                <feature.icon className="platform-icon" size={28} />
                                <h4>{feature.title}</h4>
                                <p>{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="testimonials">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Trusted by Businesses & Professionals</h2>
                        <p className="section-subtitle">Hear from our satisfied users</p>
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
                                        {testimonial.avatar}
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

            {/* Why Choose Benefits */}
            <section className="benefits">
                <div className="container">
                    <div className="benefits-grid">
                        <div className="benefits-content">
                            <h2>Why 5,000+ Businesses Choose ProVeloce</h2>
                            <ul className="benefits-list">
                                {benefits.map((benefit, index) => (
                                    <li key={index}>
                                        <CheckCircle size={20} className="benefit-check" />
                                        {benefit}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="benefits-cta">
                            <div className="cta-box">
                                <h3>Ready to Get Started?</h3>
                                <p>Join thousands of professionals and businesses transforming ideas into reality.</p>
                                <Link to="/signup" className="btn btn-primary btn-lg">
                                    Create Free Account <ArrowRight size={20} />
                                </Link>
                                <span className="cta-note">No credit card required</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Roadmap Section */}
            <section id="roadmap" className="roadmap">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Platform Roadmap</h2>
                        <p className="section-subtitle">Our journey to revolutionize expert services</p>
                    </div>
                    <div className="roadmap-timeline">
                        {roadmap.map((item, index) => (
                            <div key={index} className={`roadmap-item ${item.status}`}>
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

            {/* CTA Section - Dual */}
            <section className="cta-dual">
                <div className="container">
                    <div className="cta-cards">
                        <div className="cta-card client">
                            <Search size={40} />
                            <h3>Find an Expert Today</h3>
                            <p>Post your project and get matched with verified professionals in minutes.</p>
                            <Link to="/signup" className="btn btn-white btn-lg">
                                Hire Experts <ArrowRight size={20} />
                            </Link>
                        </div>
                        <div className="cta-card expert">
                            <Award size={40} />
                            <h3>Apply & Earn as Expert</h3>
                            <p>Showcase your skills, build your reputation, and grow your business.</p>
                            <Link to="/signup?role=expert" className="btn btn-primary btn-lg">
                                Join as Expert <ArrowRight size={20} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Newsletter */}
            <section className="newsletter">
                <div className="container">
                    <div className="newsletter-content">
                        <h3>Stay Updated</h3>
                        <p>Get the latest updates on new features, expert tips, and platform news.</p>
                        <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                            <input type="email" placeholder="Enter your email address" required />
                            <button type="submit" className="btn btn-primary">
                                Subscribe <Mail size={18} />
                            </button>
                        </form>
                        <span className="newsletter-note">No spam. Unsubscribe anytime.</span>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-grid">
                        <div className="footer-brand">
                            <h3 className="footer-logo">
                                <img src="/logo.png" alt="ProVeloce Connect" />
                                ProVeloce Connect
                            </h3>
                            <p>Transform ideas into reality. Your trusted skill marketplace connecting verified experts with businesses worldwide.</p>
                            <div className="footer-social">
                                <a href="https://facebook.com" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                                    <Facebook size={20} />
                                </a>
                                <a href="https://twitter.com" aria-label="Twitter" target="_blank" rel="noopener noreferrer">
                                    <Twitter size={20} />
                                </a>
                                <a href="https://linkedin.com" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                                    <Linkedin size={20} />
                                </a>
                                <a href="https://instagram.com" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                                    <Instagram size={20} />
                                </a>
                            </div>
                        </div>
                        <div className="footer-links">
                            <h4>Platform</h4>
                            <a href="#how-it-works">How It Works</a>
                            <a href="#services">Services</a>
                            <a href="#features">Features</a>
                            <a href="#testimonials">Testimonials</a>
                            <a href="#roadmap">Roadmap</a>
                        </div>
                        <div className="footer-links">
                            <h4>Company</h4>
                            <Link to="/about">About Us</Link>
                            <Link to="/careers">Careers</Link>
                            <Link to="/blog">Blog</Link>
                            <Link to="/press">Press</Link>
                        </div>
                        <div className="footer-links">
                            <h4>Legal</h4>
                            <Link to="/privacy">Privacy Policy</Link>
                            <Link to="/terms">Terms of Service</Link>
                            <Link to="/cookies">Cookie Policy</Link>
                            <Link to="/refund">Refund Policy</Link>
                        </div>
                        <div className="footer-contact">
                            <h4>Contact Us</h4>
                            <a href="mailto:support@proveloce.com">
                                <Mail size={16} /> support@proveloce.com
                            </a>
                            <a href="tel:+919876543210">
                                <Phone size={16} /> +91 98765 43210
                            </a>
                            <p><MapPin size={16} /> Chennai, India</p>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>&copy; {new Date().getFullYear()} ProVeloce. All rights reserved.</p>
                        <p className="footer-tagline">Connecting Talent with Opportunity</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
