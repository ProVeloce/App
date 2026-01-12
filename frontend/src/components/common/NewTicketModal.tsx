import React, { useState, useEffect, useRef } from 'react';
import {
    X, Headphones, CreditCard, ClipboardList, DollarSign,
    Cpu, UserCircle, MoreHorizontal, Loader2, CheckCircle, AlertTriangle, Paperclip, Copy, Check
} from 'lucide-react';
import './NewTicketModal.css';

interface NewTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: TicketFormData) => Promise<{ ticketNumber: string }>;
}

interface TicketFormData {
    category: string;
    subject: string;
    description: string;
    attachment?: File | null;
}

const CATEGORIES = [
    { value: 'General', icon: Headphones, label: 'General' },
    { value: 'Technical', icon: Cpu, label: 'Technical' },
    { value: 'Billing', icon: CreditCard, label: 'Billing' },
    { value: 'Tasks', icon: ClipboardList, label: 'Tasks' },
    { value: 'Payments', icon: DollarSign, label: 'Payments' },
    { value: 'Account', icon: UserCircle, label: 'Account' },
    { value: 'Other', icon: MoreHorizontal, label: 'Other' },
];

const NewTicketModal: React.FC<NewTicketModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [isClosing, setIsClosing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<TicketFormData>({
        category: '',
        subject: '',
        description: '',
        attachment: null,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // State for Unified Popup System
    const [popup, setPopup] = useState<{
        show: boolean;
        type: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO';
        title: string;
        message: string;
        ticketNumber?: string;
    }>({
        show: false,
        type: 'SUCCESS',
        title: '',
        message: '',
    });
    const [copied, setCopied] = useState(false);

    const modalRef = useRef<HTMLDivElement>(null);
    const firstFocusableRef = useRef<HTMLButtonElement>(null);

    // Focus trap and ESC to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !popup.show) {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
            setTimeout(() => firstFocusableRef.current?.focus(), 100);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, popup.show]);

    const handleClose = () => {
        if (popup.show) {
            setPopup(prev => ({ ...prev, show: false }));
        }
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
            resetForm();
        }, 160);
    };

    const resetForm = () => {
        setFormData({ category: '', subject: '', description: '', attachment: null });
        setErrors({});
        setTouched({});
        setErrorMessage('');
        setPopup({ show: false, type: 'SUCCESS', title: '', message: '' });
        setCopied(false);
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.category) newErrors.category = 'Please choose a category';
        if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
        if (formData.subject.length > 150) newErrors.subject = 'Subject must be 150 characters or less';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (formData.description.length > 5000) newErrors.description = 'Description must be 5000 characters or less';

        setErrors(newErrors);
        setTouched({ category: true, subject: true, description: true });
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');

        if (!validate()) {
            const firstError = document.querySelector('.ntm-field-error');
            firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        setSubmitting(true);
        try {
            const result = await onSubmit(formData);
            setPopup({
                show: true,
                type: 'SUCCESS',
                title: 'Ticket Created Successfully',
                message: 'Your support ticket has been registered.',
                ticketNumber: result.ticketNumber
            });
        } catch (err: any) {
            setPopup({
                show: true,
                type: 'ERROR',
                title: 'System Error',
                message: err.response?.data?.message || "We couldn't create your ticket. Please try again."
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCopyTicketNumber = async () => {
        if (!popup.ticketNumber) return;
        try {
            await navigator.clipboard.writeText(popup.ticketNumber);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleContinue = () => {
        handleClose();
    };

    const handleBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const getFieldState = (field: string): 'default' | 'valid' | 'error' => {
        if (!touched[field]) return 'default';
        if (errors[field]) return 'error';
        const value = formData[field as keyof TicketFormData];
        if (value && (typeof value === 'string' ? value.trim() : true)) return 'valid';
        return 'default';
    };

    const getCategoryIcon = () => {
        const cat = CATEGORIES.find(c => c.value === formData.category);
        return cat ? <cat.icon size={18} /> : null;
    };

    if (!isOpen) return null;

    return (
        <div
            className={`ntm-overlay ${isClosing ? 'ntm-closing' : ''}`}
            onClick={popup.show ? undefined : handleClose}
            role="dialog"
            aria-modal="true"
            aria-label="New Support Ticket"
        >
            {/* Unified Modal Popup System */}
            {popup.show && (
                <div className={`ntm-status-popup type-${popup.type}`} onClick={(e) => e.stopPropagation()} role="dialog">
                    <div className="ntm-status-icon">
                        {popup.type === 'SUCCESS' && <CheckCircle size={48} />}
                        {popup.type === 'ERROR' && <X size={48} />}
                        {popup.type === 'WARNING' && <AlertTriangle size={48} />}
                        {popup.type === 'INFO' && <Headphones size={48} />}
                    </div>
                    <h2>{popup.title}</h2>
                    <p>{popup.message}</p>

                    {popup.type === 'SUCCESS' && popup.ticketNumber && (
                        <div className="ntm-ticket-id-box">
                            <label>TICKET NUMBER</label>
                            <div className="ntm-ticket-id-value">
                                <code>{popup.ticketNumber}</code>
                                <button
                                    className="ntm-copy-btn"
                                    onClick={handleCopyTicketNumber}
                                    aria-label={copied ? 'Copied!' : 'Copy ticket number'}
                                >
                                    {copied ? <Check size={18} /> : <Copy size={18} />}
                                </button>
                            </div>
                            {copied && <span className="ntm-copied-message">Copied to clipboard!</span>}
                        </div>
                    )}

                    <button className="ntm-btn ntm-btn-primary ntm-continue-btn" onClick={handleContinue}>
                        {popup.type === 'SUCCESS' ? 'Continue' : 'Try Again'}
                    </button>
                </div>
            )}

            {/* Main Form Modal */}
            {!popup.show && (
                <div
                    ref={modalRef}
                    className={`ntm-container ${isClosing ? 'ntm-closing' : ''}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Gradient accent bar */}
                    <div className="ntm-gradient-bar" />

                    {/* Header */}
                    <div className="ntm-header">
                        <div className="ntm-header-content">
                            <div className="ntm-header-icon">
                                <Headphones size={24} />
                            </div>
                            <div className="ntm-header-text">
                                <h2>Support Ticket</h2>
                                <p>Tell us how we can help you</p>
                            </div>
                        </div>
                        <button
                            ref={firstFocusableRef}
                            className="ntm-close-btn"
                            onClick={handleClose}
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="ntm-form">
                        {/* Error Banner */}
                        {errorMessage && (
                            <div className="ntm-error-banner">
                                <AlertTriangle size={18} />
                                <div>
                                    <strong>Submission failed</strong>
                                    <p>{errorMessage}</p>
                                </div>
                            </div>
                        )}

                        <div className="ntm-form-grid">
                            {/* Left Column */}
                            <div className="ntm-form-column">
                                {/* Category Dropdown */}
                                <div className={`ntm-field ${getFieldState('category')}`}>
                                    <label className="ntm-label">Category <span className="ntm-required">*</span></label>
                                    <div
                                        className="ntm-category-dropdown"
                                        onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                        onBlur={() => { setTimeout(() => setShowCategoryDropdown(false), 150); handleBlur('category'); }}
                                        tabIndex={0}
                                    >
                                        <div className="ntm-category-selected">
                                            {formData.category ? (
                                                <>
                                                    {getCategoryIcon()}
                                                    <span>{formData.category}</span>
                                                </>
                                            ) : (
                                                <span className="ntm-placeholder">Select a category</span>
                                            )}
                                        </div>
                                        <svg className={`ntm-dropdown-arrow ${showCategoryDropdown ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>

                                        {showCategoryDropdown && (
                                            <div className="ntm-category-options">
                                                {CATEGORIES.map((cat) => (
                                                    <div
                                                        key={cat.value}
                                                        className={`ntm-category-option ${formData.category === cat.value ? 'selected' : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setFormData(prev => ({ ...prev, category: cat.value }));
                                                            setShowCategoryDropdown(false);
                                                            setTouched(prev => ({ ...prev, category: true }));
                                                            if (errors.category) setErrors(prev => ({ ...prev, category: '' }));
                                                        }}
                                                    >
                                                        <cat.icon size={18} />
                                                        <span>{cat.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {getFieldState('category') === 'error' && (
                                        <span className="ntm-field-error"><AlertTriangle size={14} /> {errors.category}</span>
                                    )}
                                </div>

                                {/* Subject */}
                                <div className={`ntm-field ${getFieldState('subject')}`}>
                                    <label className="ntm-label">Subject <span className="ntm-required">*</span></label>
                                    <input
                                        type="text"
                                        className="ntm-input"
                                        placeholder="Brief summary of your issue"
                                        value={formData.subject}
                                        onChange={(e) => {
                                            setFormData(prev => ({ ...prev, subject: e.target.value }));
                                            if (errors.subject && e.target.value.trim()) {
                                                setErrors(prev => ({ ...prev, subject: '' }));
                                            }
                                        }}
                                        onBlur={() => handleBlur('subject')}
                                        maxLength={180}
                                    />
                                    {getFieldState('subject') === 'valid' && <CheckCircle className="ntm-field-icon valid" size={18} />}
                                    {getFieldState('subject') === 'error' && (
                                        <span className="ntm-field-error"><AlertTriangle size={14} /> {errors.subject}</span>
                                    )}
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="ntm-form-column">
                                {/* Description */}
                                <div className={`ntm-field ntm-field-textarea ${getFieldState('description')}`}>
                                    <label className="ntm-label">Description <span className="ntm-required">*</span></label>
                                    <textarea
                                        className="ntm-textarea"
                                        placeholder="Please describe your issue in detail..."
                                        value={formData.description}
                                        onChange={(e) => {
                                            setFormData(prev => ({ ...prev, description: e.target.value }));
                                            if (errors.description && e.target.value.trim()) {
                                                setErrors(prev => ({ ...prev, description: '' }));
                                            }
                                        }}
                                        onBlur={() => handleBlur('description')}
                                        rows={5}
                                        maxLength={5000}
                                    />
                                    {getFieldState('description') === 'error' && (
                                        <span className="ntm-field-error"><AlertTriangle size={14} /> {errors.description}</span>
                                    )}
                                </div>

                                {/* Attachment */}
                                <div className="ntm-field">
                                    <label className="ntm-label">Attachment <span className="ntm-optional">(optional)</span></label>
                                    <div className="ntm-file-upload">
                                        <input
                                            type="file"
                                            id="ntm-file-input"
                                            className="ntm-file-input"
                                            accept=".png,.jpg,.jpeg,.pdf,.txt,.log"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0] || null;
                                                if (file && file.size > 15 * 1024 * 1024) {
                                                    setErrors(prev => ({ ...prev, attachment: 'File exceeds the 15 MB limit' }));
                                                    return;
                                                }
                                                setFormData(prev => ({ ...prev, attachment: file }));
                                                setErrors(prev => ({ ...prev, attachment: '' }));
                                            }}
                                        />
                                        <label htmlFor="ntm-file-input" className="ntm-file-label">
                                            <Paperclip size={18} />
                                            <span>{formData.attachment ? formData.attachment.name : 'Add logs, screenshots, or documents'}</span>
                                        </label>
                                        {formData.attachment && (
                                            <button
                                                type="button"
                                                className="ntm-file-clear"
                                                onClick={() => setFormData(prev => ({ ...prev, attachment: null }))}
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                    {errors.attachment && (
                                        <span className="ntm-field-error"><AlertTriangle size={14} /> {errors.attachment}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="ntm-footer">
                        <div className="ntm-footer-divider" />
                        <div className="ntm-footer-buttons">
                            <button type="button" className="ntm-btn ntm-btn-ghost" onClick={handleClose}>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="ntm-btn ntm-btn-primary"
                                disabled={submitting}
                                onClick={handleSubmit}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="ntm-spinner" size={18} />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Ticket'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default NewTicketModal;
