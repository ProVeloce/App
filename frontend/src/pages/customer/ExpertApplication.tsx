import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { applicationApi, profileApi, documentApi } from '../../services/api';
import {
    User,
    Briefcase,
    History,
    Users,
    Clock,
    FileCheck,
    ChevronLeft,
    ChevronRight,
    Save,
    Send,
    Plus,
    Trash2,
    Upload,
    CheckCircle,
    AlertCircle,
    X,
    FileText,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Award,
    Globe,
    Languages,
    Loader,
} from 'lucide-react';
import './ExpertApplication.css';

// Types
interface WorkHistory {
    id: string;
    companyName: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
    proofUrl?: string;
}



interface FormData {
    // Section 1: Personal Information
    fullName: string;
    email: string;
    phone: string;
    dob: string;
    gender: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    governmentIdType: string;
    governmentIdFile: File | null;
    profilePhoto: File | null;

    // Section 2: Professional Details
    domains: string[];
    skills: string[];
    yearsOfExperience: number;
    summaryBio: string;
    resumeFile: File | null;
    portfolioFiles: File[];
    portfolioLinks: string[];
    certificationFiles: File[];
    workingType: string;
    expectedRate: string;
    languages: string[];

    // Section 3: Work History
    workHistory: WorkHistory[];



    // Section 5: Availability
    availableDays: string[];
    availableTimeSlots: string[];
    workPreference: string;
    communicationMode: string;

    // Section 6: Legal
    termsAccepted: boolean;
    ndaAccepted: boolean;
    signatureFile: File | null;
}

// Constants
const DOMAINS = [
    'Web Development',
    'Mobile Development',
    'UI/UX Design',
    'Data Science',
    'Machine Learning',
    'Cloud Computing',
    'DevOps',
    'Cybersecurity',
    'Blockchain',
    'Digital Marketing',
    'Content Writing',
    'Video Production',
    'Graphic Design',
    'Project Management',
    'Business Consulting',
    'Legal Consulting',
    'Financial Consulting',
    'HR Consulting',
    'Other',
];

const LANGUAGES = [
    'English',
    'Hindi',
    'Tamil',
    'Telugu',
    'Kannada',
    'Malayalam',
    'Bengali',
    'Marathi',
    'Gujarati',
    'Punjabi',
    'Spanish',
    'French',
    'German',
    'Chinese',
    'Japanese',
    'Arabic',
    'Other',
];

const COUNTRIES = [
    'India',
    'United States',
    'United Kingdom',
    'Canada',
    'Australia',
    'Germany',
    'France',
    'Singapore',
    'UAE',
    'Other',
];

const ExpertApplication: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showDraftSaved, setShowDraftSaved] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [skillInput, setSkillInput] = useState('');
    const [portfolioLinkInput, setPortfolioLinkInput] = useState('');
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    // Uploaded document tracking for R2 persistence
    interface UploadedDoc {
        id: string;
        documentType: string;
        fileName: string;
        signedUrl?: string;
    }
    const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedDoc>>({});
    const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});

    const [formData, setFormData] = useState<FormData>({
        // Personal Info
        fullName: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        dob: '',
        gender: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        country: '',
        pincode: '',
        governmentIdType: '',
        governmentIdFile: null,
        profilePhoto: null,

        // Professional
        domains: [],
        skills: [],
        yearsOfExperience: 0,
        summaryBio: '',
        resumeFile: null,
        portfolioFiles: [],
        portfolioLinks: [],
        certificationFiles: [],
        workingType: '',
        expectedRate: '',
        languages: [],

        // Work History
        workHistory: [],



        // Availability
        availableDays: [],
        availableTimeSlots: [],
        workPreference: '',
        communicationMode: '',

        // Legal
        termsAccepted: false,
        ndaAccepted: false,
        signatureFile: null,
    });

    const steps = [
        { id: 1, title: 'Personal Info', icon: User },
        { id: 2, title: 'Professional', icon: Briefcase },
        { id: 3, title: 'Work History', icon: History },
        { id: 4, title: 'Availability', icon: Clock },
        { id: 5, title: 'Legal & Submit', icon: FileCheck },
    ];

    // Update form when user data loads + fetch profile data
    useEffect(() => {
        const loadUserProfile = async () => {
            try {
                // Fetch full profile from API
                const response = await profileApi.getMyProfile();
                console.log('Profile API response:', response.data);

                if (response.data.success && response.data.data?.user) {
                    const userData = response.data.data.user;
                    const profile: any = userData.profile || {};

                    console.log('User data:', userData);
                    console.log('Phone from API:', userData.phone);

                    setFormData(prev => ({
                        ...prev,
                        fullName: userData.name || prev.fullName,
                        email: userData.email || prev.email,
                        phone: userData.phone || prev.phone,
                        // Also load profile fields
                        dob: profile.dob || prev.dob,
                        gender: profile.gender || prev.gender,
                        addressLine1: profile.address_line1 || prev.addressLine1,
                        addressLine2: profile.address_line2 || prev.addressLine2,
                        city: profile.city || prev.city,
                        state: profile.state || prev.state,
                        country: profile.country || prev.country,
                        pincode: profile.pincode || prev.pincode,
                    }));
                }
            } catch (error) {
                console.error('Error loading profile:', error);
            }
        };

        loadUserProfile();
    }, []); // Run on mount

    // Load existing application on mount
    useEffect(() => {
        const loadApplication = async () => {
            try {
                const response = await applicationApi.getMyApplication();
                if (response.data.success && response.data.data?.application) {
                    const app = response.data.data.application;
                    // Map database fields to form state (Prisma returns camelCase)
                    setFormData(prev => ({
                        ...prev,
                        dob: app.dob || '',
                        gender: app.gender || '',
                        addressLine1: app.addressLine1 || '',
                        addressLine2: app.addressLine2 || '',
                        city: app.city || '',
                        state: app.state || '',
                        country: app.country || '',
                        pincode: app.pincode || '',
                        governmentIdType: app.governmentIdType || '',
                        domains: Array.isArray(app.domains) ? app.domains : [],
                        skills: Array.isArray(app.skills) ? app.skills : [],
                        yearsOfExperience: app.yearsOfExperience || 0,
                        summaryBio: app.summaryBio || '',
                        portfolioLinks: Array.isArray(app.portfolioUrls) ? app.portfolioUrls : [],
                        workingType: app.workingType || '',
                        expectedRate: app.hourlyRate?.toString() || app.expectedRate || '',
                        languages: Array.isArray(app.languages) ? app.languages : [],
                        availableDays: Array.isArray(app.availableDays) ? app.availableDays : [],
                        availableTimeSlots: Array.isArray(app.availableTimeSlots) ? app.availableTimeSlots : [],
                        workPreference: app.workPreference || '',
                        communicationMode: app.communicationMode || '',
                        termsAccepted: !!app.termsAccepted,
                        ndaAccepted: !!app.ndaAccepted,
                    }));
                }
            } catch (error) {
                console.log('No existing application found or error fetching:', error);
            }
        };
        loadApplication();
    }, []);

    // Load uploaded documents from R2 on mount
    useEffect(() => {
        const fetchDraftDocuments = async () => {
            console.log('📄 Fetching draft documents from R2...');
            try {
                const response = await documentApi.getMyDocuments();
                console.log('📥 getMyDocuments response:', response.data);

                if (response.data.success && response.data.data?.documents) {
                    const docs = response.data.data.documents;
                    console.log(`📁 Found ${docs.length} documents`);
                    const docsMap: Record<string, UploadedDoc> = {};

                    // Map documents by type for easy lookup
                    for (const doc of docs) {
                        console.log('  📄 Document:', doc.document_type || doc.documentType, doc.file_name || doc.fileName);
                        // Get signed URL for each document
                        try {
                            const urlResponse = await documentApi.getDocumentUrl(doc.id);
                            if (urlResponse.data.success && urlResponse.data.data) {
                                docsMap[doc.document_type || doc.documentType] = {
                                    id: doc.id,
                                    documentType: doc.document_type || doc.documentType,
                                    fileName: doc.file_name || doc.fileName,
                                    signedUrl: urlResponse.data.data.url,
                                };
                            }
                        } catch (urlError) {
                            // Still track doc even without signed URL
                            docsMap[doc.document_type || doc.documentType] = {
                                id: doc.id,
                                documentType: doc.document_type || doc.documentType,
                                fileName: doc.file_name || doc.fileName,
                            };
                        }
                    }
                    console.log('✅ Uploaded docs map:', docsMap);
                    setUploadedDocs(docsMap);
                } else {
                    console.log('📭 No documents found or API returned error');
                }
            } catch (error) {
                console.error('❌ Error fetching documents:', error);
            }
        };
        fetchDraftDocuments();
    }, []);

    // Validation functions
    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {};

        switch (step) {
            case 1:
                // Phone is required and must be set in profile
                if (!formData.phone) newErrors.phone = 'Phone number is required. Please update it in your Profile.';
                if (!formData.dob) newErrors.dob = 'Date of birth is required';
                if (!formData.gender) newErrors.gender = 'Gender is required';
                if (!formData.addressLine1) newErrors.addressLine1 = 'Address is required';
                if (!formData.city) newErrors.city = 'City is required';
                if (!formData.state) newErrors.state = 'State is required';
                if (!formData.country) newErrors.country = 'Country is required';
                if (!formData.pincode) newErrors.pincode = 'Pincode is required';
                if (!formData.governmentIdType) newErrors.governmentIdType = 'ID type is required';
                if (!formData.governmentIdFile) newErrors.governmentIdFile = 'Government ID is required';
                break;
            case 2:
                if (formData.domains.length === 0) newErrors.domains = 'Select at least one domain';
                if (formData.skills.length === 0) newErrors.skills = 'Add at least one skill';
                if (!formData.yearsOfExperience) newErrors.yearsOfExperience = 'Experience is required';
                if (!formData.summaryBio || formData.summaryBio.length < 100) {
                    newErrors.summaryBio = 'Bio must be at least 100 characters';
                }
                if (!formData.resumeFile) newErrors.resumeFile = 'Resume is required';
                if (!formData.workingType) newErrors.workingType = 'Working type is required';
                break;
            case 3:
                // Work history is optional but if added, validate entries
                break;
            case 4:
                if (formData.availableDays.length === 0) newErrors.availableDays = 'Select availability';
                if (!formData.workPreference) newErrors.workPreference = 'Work preference is required';
                if (!formData.communicationMode) newErrors.communicationMode = 'Communication mode is required';
                break;
            case 5:
                if (!formData.termsAccepted) newErrors.termsAccepted = 'Accept terms to continue';
                if (!formData.ndaAccepted) newErrors.ndaAccepted = 'Accept NDA to continue';
                if (!formData.signatureFile) newErrors.signatureFile = 'Digital signature is required';
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 6));
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleInputChange = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleFileChange = async (field: keyof FormData, files: FileList | null) => {
        console.log('🔄 handleFileChange called', { field, files });
        if (!files || files.length === 0) {
            console.log('❌ No files provided');
            return;
        }

        const file = files[0];
        console.log('📄 File selected:', { name: file.name, type: file.type, size: file.size });

        // Map field to document type for R2
        const docTypeMap: Record<string, string> = {
            governmentIdFile: 'government_id',
            profilePhoto: 'profile',
            resumeFile: 'resume',
            certificationFiles: 'certificate',
            portfolioFiles: 'portfolio',
            signatureFile: 'other',
        };

        const documentType = docTypeMap[field] || 'other';
        console.log('📁 Document type:', documentType);

        // Set uploading state
        setIsUploading(prev => ({ ...prev, [field]: true }));

        try {
            // Upload file to R2 via API
            const formData = new FormData();
            formData.append('file', file);
            formData.append('documentType', documentType);

            console.log('🚀 Calling documentApi.upload...');
            const response = await documentApi.upload(formData);
            console.log('📥 Upload response:', response.data);

            if (response.data.success && response.data.data?.document) {
                const doc = response.data.data.document;

                // Track uploaded doc
                setUploadedDocs(prev => ({
                    ...prev,
                    [documentType]: {
                        id: doc.id,
                        documentType: doc.documentType,
                        fileName: doc.fileName,
                    },
                }));

                // Also store in form state for UI display
                if (field === 'portfolioFiles' || field === 'certificationFiles') {
                    handleInputChange(field, [...((formData as any)[field] as File[] || []), file]);
                } else {
                    handleInputChange(field, file);
                }

                console.log(`File uploaded to R2: ${doc.fileName}`);
            } else {
                console.error('Upload failed:', response.data.error);
                setErrors(prev => ({ ...prev, [field]: 'Upload failed' }));
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            setErrors(prev => ({ ...prev, [field]: error.message || 'Upload failed' }));
        } finally {
            setIsUploading(prev => ({ ...prev, [field]: false }));
        }
    };

    const removeFile = (field: 'portfolioFiles' | 'certificationFiles', index: number) => {
        const newFiles = [...formData[field]];
        newFiles.splice(index, 1);
        handleInputChange(field, newFiles);
    };

    // Skills management
    const addSkill = () => {
        if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
            handleInputChange('skills', [...formData.skills, skillInput.trim()]);
            setSkillInput('');
        }
    };

    const removeSkill = (skill: string) => {
        handleInputChange('skills', formData.skills.filter(s => s !== skill));
    };

    // Portfolio links management
    const addPortfolioLink = () => {
        if (portfolioLinkInput.trim()) {
            handleInputChange('portfolioLinks', [...formData.portfolioLinks, portfolioLinkInput.trim()]);
            setPortfolioLinkInput('');
        }
    };

    const removePortfolioLink = (index: number) => {
        const newLinks = [...formData.portfolioLinks];
        newLinks.splice(index, 1);
        handleInputChange('portfolioLinks', newLinks);
    };

    // Work History management
    const addWorkHistory = () => {
        const newEntry: WorkHistory = {
            id: Date.now().toString(),
            companyName: '',
            position: '',
            startDate: '',
            endDate: '',
            description: '',
        };
        handleInputChange('workHistory', [...formData.workHistory, newEntry]);
    };

    const updateWorkHistory = (id: string, field: keyof WorkHistory, value: string) => {
        const updated = formData.workHistory.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        );
        handleInputChange('workHistory', updated);
    };

    const removeWorkHistory = (id: string) => {
        handleInputChange('workHistory', formData.workHistory.filter(item => item.id !== id));
    };

    // Toggle array values
    const toggleArrayValue = (field: 'domains' | 'languages' | 'availableDays' | 'availableTimeSlots', value: string) => {
        const current = formData[field];
        if (current.includes(value)) {
            handleInputChange(field, current.filter(v => v !== value));
        } else {
            handleInputChange(field, [...current, value]);
        }
    };

    // Save draft
    const saveDraft = async () => {
        console.log('💾 Save Draft started');
        console.log('📁 Uploaded docs state:', uploadedDocs);
        console.log('🔄 Uploading state:', isUploading);

        // Check if any uploads are still in progress
        const hasActiveUploads = Object.values(isUploading).some(v => v);
        if (hasActiveUploads) {
            console.warn('⚠️ Some files are still uploading, please wait...');
            alert('Please wait for file uploads to complete before saving.');
            return;
        }

        setIsSaving(true);
        try {
            // Prepare data for API
            const applicationData = {
                dob: formData.dob,
                gender: formData.gender,
                addressLine1: formData.addressLine1,
                addressLine2: formData.addressLine2,
                city: formData.city,
                state: formData.state,
                country: formData.country,
                pincode: formData.pincode,
                governmentIdType: formData.governmentIdType,
                domains: formData.domains,
                skills: formData.skills,
                yearsOfExperience: formData.yearsOfExperience,
                summaryBio: formData.summaryBio,
                portfolioLinks: formData.portfolioLinks,
                workingType: formData.workingType,
                expectedRate: formData.expectedRate,
                languages: formData.languages,
                availableDays: formData.availableDays,
                availableTimeSlots: formData.availableTimeSlots,
                workPreference: formData.workPreference,
                communicationMode: formData.communicationMode,
                termsAccepted: formData.termsAccepted,
                ndaAccepted: formData.ndaAccepted,
            };

            console.log('🚀 Calling applicationApi.saveDraft...');
            const response = await applicationApi.saveDraft(applicationData);
            console.log('📥 Save Draft response:', response.data);

            if (response.data.success) {
                setShowDraftSaved(true);
                setTimeout(() => setShowDraftSaved(false), 3000);
            } else {
                console.error('❌ Save failed:', response.data.error);
                alert('Failed to save draft: ' + (response.data.error || 'Unknown error'));
            }
        } catch (error: any) {
            console.error('❌ Failed to save draft:', error);
            alert('Failed to save draft: ' + (error.message || 'Network error'));
        } finally {
            setIsSaving(false);
        }
    };

    // Submit application
    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return;

        setIsSubmitting(true);
        try {
            // First save the current data
            const applicationData = {
                dob: formData.dob,
                gender: formData.gender,
                addressLine1: formData.addressLine1,
                addressLine2: formData.addressLine2,
                city: formData.city,
                state: formData.state,
                country: formData.country,
                pincode: formData.pincode,
                governmentIdType: formData.governmentIdType,
                domains: formData.domains,
                skills: formData.skills,
                yearsOfExperience: formData.yearsOfExperience,
                summaryBio: formData.summaryBio,
                portfolioLinks: formData.portfolioLinks,
                workingType: formData.workingType,
                expectedRate: formData.expectedRate,
                languages: formData.languages,
                availableDays: formData.availableDays,
                availableTimeSlots: formData.availableTimeSlots,
                workPreference: formData.workPreference,
                communicationMode: formData.communicationMode,
                termsAccepted: formData.termsAccepted,
                ndaAccepted: formData.ndaAccepted,
            };

            // Save final data
            await applicationApi.saveDraft(applicationData);

            // Submit application
            await applicationApi.submitApplication();

            setShowSuccess(true);
            setTimeout(() => {
                navigate('/customer/application-status');
            }, 3000);
        } catch (error) {
            console.error('Failed to submit:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Render step content
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return renderPersonalInfo();
            case 2:
                return renderProfessionalDetails();
            case 3:
                return renderWorkHistory();
            case 4:
                return renderAvailability();
            case 5:
                return renderLegal();
            default:
                return null;
        }
    };

    // Section 1: Personal Information
    const renderPersonalInfo = () => (
        <div className="form-section">
            <h2 className="section-title">
                <User size={24} />
                Personal Information
            </h2>
            <p className="section-desc">Please provide your personal details for verification</p>

            {/* Profile Info Notice */}
            <div className="profile-info-notice">
                <AlertCircle size={18} />
                <span>
                    Basic details are fetched from your profile and cannot be edited here.
                    <a href="/profile" className="profile-link"> Update in Profile →</a>
                </span>
            </div>

            <div className="form-grid">
                {/* Auto-filled fields from profile (read-only) */}
                <div className="form-group">
                    <label>Full Name <span className="auto-filled">(from profile)</span></label>
                    <input type="text" value={formData.fullName} disabled className="disabled" />
                </div>
                <div className="form-group">
                    <label>Email <span className="auto-filled">(from profile)</span></label>
                    <input type="email" value={formData.email} disabled className="disabled" />
                </div>
                <div className="form-group">
                    <label>Phone Number <span className="required">*</span> <span className="auto-filled">(from profile)</span></label>
                    <input
                        type="tel"
                        value={formData.phone}
                        disabled
                        className={`disabled ${!formData.phone || errors.phone ? 'error' : ''}`}
                        placeholder="Not set - update in Profile"
                    />
                    {!formData.phone && (
                        <span className="error-text">
                            Phone number is required. <a href="/profile" className="error-link">Update in Profile →</a>
                        </span>
                    )}
                    {errors.phone && formData.phone && <span className="error-text">{errors.phone}</span>}
                </div>

                {/* User input fields */}
                <div className="form-group">
                    <label>Date of Birth <span className="required">*</span></label>
                    <input
                        type="date"
                        value={formData.dob}
                        onChange={e => handleInputChange('dob', e.target.value)}
                        className={errors.dob ? 'error' : ''}
                    />
                    {errors.dob && <span className="error-text">{errors.dob}</span>}
                </div>

                <div className="form-group">
                    <label>Gender <span className="required">*</span></label>
                    <select
                        value={formData.gender}
                        onChange={e => handleInputChange('gender', e.target.value)}
                        className={errors.gender ? 'error' : ''}
                    >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                    {errors.gender && <span className="error-text">{errors.gender}</span>}
                </div>

                <div className="form-group full-width">
                    <label>Address Line 1 <span className="required">*</span></label>
                    <input
                        type="text"
                        value={formData.addressLine1}
                        onChange={e => handleInputChange('addressLine1', e.target.value)}
                        placeholder="Street address, building name"
                        className={errors.addressLine1 ? 'error' : ''}
                    />
                    {errors.addressLine1 && <span className="error-text">{errors.addressLine1}</span>}
                </div>

                <div className="form-group full-width">
                    <label>Address Line 2</label>
                    <input
                        type="text"
                        value={formData.addressLine2}
                        onChange={e => handleInputChange('addressLine2', e.target.value)}
                        placeholder="Apartment, suite, unit, etc. (optional)"
                    />
                </div>

                <div className="form-group">
                    <label>City <span className="required">*</span></label>
                    <input
                        type="text"
                        value={formData.city}
                        onChange={e => handleInputChange('city', e.target.value)}
                        className={errors.city ? 'error' : ''}
                    />
                    {errors.city && <span className="error-text">{errors.city}</span>}
                </div>

                <div className="form-group">
                    <label>State <span className="required">*</span></label>
                    <input
                        type="text"
                        value={formData.state}
                        onChange={e => handleInputChange('state', e.target.value)}
                        className={errors.state ? 'error' : ''}
                    />
                    {errors.state && <span className="error-text">{errors.state}</span>}
                </div>

                <div className="form-group">
                    <label>Country <span className="required">*</span></label>
                    <select
                        value={formData.country}
                        onChange={e => handleInputChange('country', e.target.value)}
                        className={errors.country ? 'error' : ''}
                    >
                        <option value="">Select Country</option>
                        {COUNTRIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    {errors.country && <span className="error-text">{errors.country}</span>}
                </div>

                <div className="form-group">
                    <label>Pincode/Zipcode <span className="required">*</span></label>
                    <input
                        type="text"
                        value={formData.pincode}
                        onChange={e => handleInputChange('pincode', e.target.value)}
                        className={errors.pincode ? 'error' : ''}
                    />
                    {errors.pincode && <span className="error-text">{errors.pincode}</span>}
                </div>

                <div className="form-group">
                    <label>Government ID Type <span className="required">*</span></label>
                    <select
                        value={formData.governmentIdType}
                        onChange={e => handleInputChange('governmentIdType', e.target.value)}
                        className={errors.governmentIdType ? 'error' : ''}
                    >
                        <option value="">Select ID Type</option>
                        <option value="aadhar">Aadhar Card</option>
                        <option value="pan">PAN Card</option>
                        <option value="passport">Passport</option>
                        <option value="other">Other</option>
                    </select>
                    {errors.governmentIdType && <span className="error-text">{errors.governmentIdType}</span>}
                </div>

                <div className="form-group">
                    <label>Government ID Upload <span className="required">*</span></label>
                    <div className="file-upload">
                        <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={e => handleFileChange('governmentIdFile', e.target.files)}
                            id="govtId"
                        />
                        <label htmlFor="govtId" className={`file-label ${errors.governmentIdFile ? 'error' : ''}`}>
                            <Upload size={20} />
                            {formData.governmentIdFile ? formData.governmentIdFile.name : 'Upload ID'}
                        </label>
                    </div>
                    {errors.governmentIdFile && <span className="error-text">{errors.governmentIdFile}</span>}
                </div>

                <div className="form-group">
                    <label>Profile Photo (Optional)</label>
                    <div className="file-upload">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={e => handleFileChange('profilePhoto', e.target.files)}
                            id="profilePhoto"
                        />
                        <label htmlFor="profilePhoto" className="file-label">
                            <Upload size={20} />
                            {formData.profilePhoto ? formData.profilePhoto.name : 'Upload Photo'}
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );

    // Section 2: Professional Details
    const renderProfessionalDetails = () => (
        <div className="form-section">
            <h2 className="section-title">
                <Briefcase size={24} />
                Professional Details
            </h2>
            <p className="section-desc">Tell us about your expertise and skills</p>

            <div className="form-grid">
                <div className="form-group full-width">
                    <label>Primary Domain / Expertise <span className="required">*</span></label>
                    <div className="checkbox-grid">
                        {DOMAINS.map(domain => (
                            <label key={domain} className={`chip-checkbox ${formData.domains.includes(domain) ? 'active' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={formData.domains.includes(domain)}
                                    onChange={() => toggleArrayValue('domains', domain)}
                                />
                                {domain}
                            </label>
                        ))}
                    </div>
                    {errors.domains && <span className="error-text">{errors.domains}</span>}
                </div>

                <div className="form-group full-width">
                    <label>Technical Skills <span className="required">*</span></label>
                    <div className="tags-input">
                        <div className="tags">
                            {formData.skills.map(skill => (
                                <span key={skill} className="tag">
                                    {skill}
                                    <button type="button" onClick={() => removeSkill(skill)}><X size={14} /></button>
                                </span>
                            ))}
                        </div>
                        <div className="tag-input-wrap">
                            <input
                                type="text"
                                value={skillInput}
                                onChange={e => setSkillInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                placeholder="Type a skill and press Enter"
                            />
                            <button type="button" onClick={addSkill} className="add-btn"><Plus size={18} /></button>
                        </div>
                    </div>
                    {errors.skills && <span className="error-text">{errors.skills}</span>}
                </div>

                <div className="form-group">
                    <label>Years of Experience <span className="required">*</span></label>
                    <input
                        type="number"
                        min="0"
                        max="50"
                        value={formData.yearsOfExperience}
                        onChange={e => handleInputChange('yearsOfExperience', parseInt(e.target.value) || 0)}
                        className={errors.yearsOfExperience ? 'error' : ''}
                    />
                    {errors.yearsOfExperience && <span className="error-text">{errors.yearsOfExperience}</span>}
                </div>

                <div className="form-group">
                    <label>Working Type <span className="required">*</span></label>
                    <select
                        value={formData.workingType}
                        onChange={e => handleInputChange('workingType', e.target.value)}
                        className={errors.workingType ? 'error' : ''}
                    >
                        <option value="">Select Type</option>
                        <option value="hourly">Hourly</option>
                        <option value="project">Project-based</option>
                        <option value="both">Both</option>
                    </select>
                    {errors.workingType && <span className="error-text">{errors.workingType}</span>}
                </div>

                <div className="form-group">
                    <label>Expected Rate</label>
                    <input
                        type="text"
                        value={formData.expectedRate}
                        onChange={e => handleInputChange('expectedRate', e.target.value)}
                        placeholder="e.g., $50-100/hr or $500-2000/project"
                    />
                </div>

                <div className="form-group full-width">
                    <label>Professional Summary / Bio <span className="required">*</span></label>
                    <textarea
                        value={formData.summaryBio}
                        onChange={e => handleInputChange('summaryBio', e.target.value)}
                        placeholder="Describe your professional background, expertise, and what makes you unique... (minimum 100 characters)"
                        rows={5}
                        className={errors.summaryBio ? 'error' : ''}
                    />
                    <div className="char-count">
                        {formData.summaryBio.length}/100 characters minimum
                        {formData.summaryBio.length >= 100 && <CheckCircle size={16} className="success" />}
                    </div>
                    {errors.summaryBio && <span className="error-text">{errors.summaryBio}</span>}
                </div>

                <div className="form-group">
                    <label>Resume Upload <span className="required">*</span> (PDF only)</label>
                    <div className="file-upload">
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={e => handleFileChange('resumeFile', e.target.files)}
                            id="resume"
                        />
                        <label htmlFor="resume" className={`file-label ${errors.resumeFile ? 'error' : ''}`}>
                            <FileText size={20} />
                            {formData.resumeFile ? formData.resumeFile.name : 'Upload Resume (PDF)'}
                        </label>
                    </div>
                    {errors.resumeFile && <span className="error-text">{errors.resumeFile}</span>}
                </div>

                <div className="form-group">
                    <label>Certifications</label>
                    <div className="file-upload">
                        <input
                            type="file"
                            accept="image/*,.pdf"
                            multiple
                            onChange={e => handleFileChange('certificationFiles', e.target.files)}
                            id="certifications"
                        />
                        <label htmlFor="certifications" className="file-label">
                            <Award size={20} />
                            Upload Certifications
                        </label>
                    </div>
                    {formData.certificationFiles.length > 0 && (
                        <div className="file-list">
                            {formData.certificationFiles.map((file, i) => (
                                <div key={i} className="file-item">
                                    <span>{file.name}</span>
                                    <button type="button" onClick={() => removeFile('certificationFiles', i)}><X size={14} /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="form-group full-width">
                    <label>Portfolio Links</label>
                    <div className="tags-input">
                        <div className="tags">
                            {formData.portfolioLinks.map((link, i) => (
                                <span key={i} className="tag link">
                                    {link}
                                    <button type="button" onClick={() => removePortfolioLink(i)}><X size={14} /></button>
                                </span>
                            ))}
                        </div>
                        <div className="tag-input-wrap">
                            <input
                                type="url"
                                value={portfolioLinkInput}
                                onChange={e => setPortfolioLinkInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPortfolioLink())}
                                placeholder="https://github.com/username or portfolio URL"
                            />
                            <button type="button" onClick={addPortfolioLink} className="add-btn"><Plus size={18} /></button>
                        </div>
                    </div>
                </div>

                <div className="form-group full-width">
                    <label>Languages Known</label>
                    <div className="checkbox-grid small">
                        {LANGUAGES.map(lang => (
                            <label key={lang} className={`chip-checkbox ${formData.languages.includes(lang) ? 'active' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={formData.languages.includes(lang)}
                                    onChange={() => toggleArrayValue('languages', lang)}
                                />
                                {lang}
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    // Section 3: Work History
    const renderWorkHistory = () => (
        <div className="form-section">
            <h2 className="section-title">
                <History size={24} />
                Work History
            </h2>
            <p className="section-desc">Add your previous work experience (optional but recommended)</p>

            <div className="dynamic-entries">
                {formData.workHistory.map((work, index) => (
                    <div key={work.id} className="entry-card">
                        <div className="entry-header">
                            <h4>Experience #{index + 1}</h4>
                            <button type="button" className="remove-btn" onClick={() => removeWorkHistory(work.id)}>
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Company/Client Name</label>
                                <input
                                    type="text"
                                    value={work.companyName}
                                    onChange={e => updateWorkHistory(work.id, 'companyName', e.target.value)}
                                    placeholder="Company or client name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Position/Role</label>
                                <input
                                    type="text"
                                    value={work.position}
                                    onChange={e => updateWorkHistory(work.id, 'position', e.target.value)}
                                    placeholder="Your role"
                                />
                            </div>
                            <div className="form-group">
                                <label>Start Date</label>
                                <input
                                    type="date"
                                    value={work.startDate}
                                    onChange={e => updateWorkHistory(work.id, 'startDate', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>End Date</label>
                                <input
                                    type="date"
                                    value={work.endDate}
                                    onChange={e => updateWorkHistory(work.id, 'endDate', e.target.value)}
                                />
                            </div>
                            <div className="form-group full-width">
                                <label>Work Description</label>
                                <textarea
                                    value={work.description}
                                    onChange={e => updateWorkHistory(work.id, 'description', e.target.value)}
                                    placeholder="Describe your responsibilities and achievements"
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>
                ))}

                <button type="button" className="add-entry-btn" onClick={addWorkHistory}>
                    <Plus size={20} />
                    Add Work Experience
                </button>
            </div>
        </div>
    );

    // Section 4: Availability
    const renderAvailability = () => (
        <div className="form-section">
            <h2 className="section-title">
                <Clock size={24} />
                Availability & Preferences
            </h2>
            <p className="section-desc">Let us know when and how you prefer to work</p>

            <div className="form-grid">
                <div className="form-group full-width">
                    <label>Working Availability <span className="required">*</span></label>
                    <div className="checkbox-grid">
                        {['Weekdays', 'Weekends'].map(day => (
                            <label key={day} className={`chip-checkbox ${formData.availableDays.includes(day) ? 'active' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={formData.availableDays.includes(day)}
                                    onChange={() => toggleArrayValue('availableDays', day)}
                                />
                                {day}
                            </label>
                        ))}
                    </div>
                    {errors.availableDays && <span className="error-text">{errors.availableDays}</span>}
                </div>

                <div className="form-group full-width">
                    <label>Available Time Slots</label>
                    <div className="checkbox-grid">
                        {['Morning (6AM-12PM)', 'Afternoon (12PM-6PM)', 'Evening (6PM-10PM)', 'Night (10PM-6AM)'].map(slot => (
                            <label key={slot} className={`chip-checkbox ${formData.availableTimeSlots.includes(slot) ? 'active' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={formData.availableTimeSlots.includes(slot)}
                                    onChange={() => toggleArrayValue('availableTimeSlots', slot)}
                                />
                                {slot}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label>Work Preference <span className="required">*</span></label>
                    <select
                        value={formData.workPreference}
                        onChange={e => handleInputChange('workPreference', e.target.value)}
                        className={errors.workPreference ? 'error' : ''}
                    >
                        <option value="">Select Preference</option>
                        <option value="remote">Remote Only</option>
                        <option value="onsite">Onsite Only</option>
                        <option value="both">Both Remote & Onsite</option>
                    </select>
                    {errors.workPreference && <span className="error-text">{errors.workPreference}</span>}
                </div>

                <div className="form-group">
                    <label>Preferred Communication Mode <span className="required">*</span></label>
                    <select
                        value={formData.communicationMode}
                        onChange={e => handleInputChange('communicationMode', e.target.value)}
                        className={errors.communicationMode ? 'error' : ''}
                    >
                        <option value="">Select Mode</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="chat">Chat/Messaging</option>
                    </select>
                    {errors.communicationMode && <span className="error-text">{errors.communicationMode}</span>}
                </div>
            </div>
        </div>
    );

    // Section 6: Legal & Compliance
    const renderLegal = () => (
        <div className="form-section">
            <h2 className="section-title">
                <FileCheck size={24} />
                Legal & Compliance
            </h2>
            <p className="section-desc">Review and accept our policies to complete your application</p>

            <div className="legal-section">
                <div className="legal-box">
                    <label className={`checkbox-label ${errors.termsAccepted ? 'error' : ''}`}>
                        <input
                            type="checkbox"
                            checked={formData.termsAccepted}
                            onChange={e => handleInputChange('termsAccepted', e.target.checked)}
                        />
                        <span className="checkmark"></span>
                        <span>
                            I have read and agree to the <a href="/terms" target="_blank">Terms & Conditions</a>
                        </span>
                    </label>
                    {errors.termsAccepted && <span className="error-text">{errors.termsAccepted}</span>}
                </div>

                <div className="legal-box">
                    <label className={`checkbox-label ${errors.ndaAccepted ? 'error' : ''}`}>
                        <input
                            type="checkbox"
                            checked={formData.ndaAccepted}
                            onChange={e => handleInputChange('ndaAccepted', e.target.checked)}
                        />
                        <span className="checkmark"></span>
                        <span>
                            I accept the <a href="/privacy" target="_blank">NDA & Platform Policy</a>
                        </span>
                    </label>
                    {errors.ndaAccepted && <span className="error-text">{errors.ndaAccepted}</span>}
                </div>

                <div className="form-group">
                    <label>Digital Signature <span className="required">*</span></label>
                    <p className="field-hint">Upload an image of your signature</p>
                    <div className="file-upload">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={e => handleFileChange('signatureFile', e.target.files)}
                            id="signature"
                        />
                        <label htmlFor="signature" className={`file-label ${errors.signatureFile ? 'error' : ''}`}>
                            <Upload size={20} />
                            {formData.signatureFile ? formData.signatureFile.name : 'Upload Signature'}
                        </label>
                    </div>
                    {errors.signatureFile && <span className="error-text">{errors.signatureFile}</span>}
                </div>

                <div className="submit-info">
                    <AlertCircle size={20} />
                    <p>
                        By submitting this application, you confirm that all information provided is accurate.
                        Your application will be reviewed by our team and you will be notified of the decision.
                    </p>
                </div>
            </div>
        </div>
    );

    // Success screen
    if (showSuccess) {
        return (
            <div className="expert-application success-screen">
                <div className="success-content">
                    <div className="success-icon">
                        <CheckCircle size={64} />
                    </div>
                    <h2>Application Submitted!</h2>
                    <p>Your expert application has been submitted successfully.</p>
                    <p className="sub">You will be redirected to check your application status...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="expert-application">
            <div className="page-header">
                <h1>Expert Application</h1>
                <p>Complete all sections to apply as a ProVeloce Connect Expert</p>
            </div>

            {/* Progress Steps */}
            <div className="steps-container">
                <div className="steps">
                    {steps.map(step => (
                        <div
                            key={step.id}
                            className={`step ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
                            onClick={() => currentStep > step.id && setCurrentStep(step.id)}
                        >
                            <div className="step-icon">
                                {currentStep > step.id ? <CheckCircle size={20} /> : <step.icon size={20} />}
                            </div>
                            <span className="step-title">{step.title}</span>
                        </div>
                    ))}
                </div>
                <div className="progress-bar">
                    <div className="progress" style={{ width: `${((currentStep - 1) / 5) * 100}%` }} />
                </div>
            </div>

            {/* Form Content */}
            <div className="form-container">
                {renderStepContent()}
            </div>

            {/* Navigation */}
            <div className="form-navigation">
                <div className="nav-left">
                    {currentStep > 1 && (
                        <button type="button" className="btn btn-outline" onClick={handleBack}>
                            <ChevronLeft size={18} />
                            Back
                        </button>
                    )}
                </div>
                <div className="nav-right">
                    <button type="button" className="btn btn-ghost" onClick={saveDraft} disabled={isSaving}>
                        <Save size={18} />
                        {isSaving ? 'Saving...' : 'Save Draft'}
                    </button>
                    {currentStep < 6 ? (
                        <button type="button" className="btn btn-primary" onClick={handleNext}>
                            Next
                            <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="btn btn-primary submit-btn"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            <Send size={18} />
                            {isSubmitting ? 'Submitting...' : 'Submit Application'}
                        </button>
                    )}
                </div>
            </div>

            {/* Draft Saved Popup */}
            {showDraftSaved && (
                <div className="draft-saved-overlay">
                    <div className="draft-saved-popup">
                        <button className="popup-close" onClick={() => setShowDraftSaved(false)}>
                            <X size={20} />
                        </button>
                        <div className="popup-icon">
                            <CheckCircle size={48} />
                        </div>
                        <h3>Draft Saved Successfully!</h3>
                        <p>Your progress has been saved. You can continue from where you left off.</p>
                        <button className="btn btn-primary" onClick={() => setShowDraftSaved(false)}>
                            Continue
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpertApplication;
