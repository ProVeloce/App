import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    FolderOpen,
    Plus,
    X,
    Upload,
    Image,
    FileText,
    ExternalLink,
    Trash2,
    Eye,
    Loader2,
    Tag,
} from 'lucide-react';
import './PortfolioManager.css';

interface PortfolioItem {
    id: string;
    title: string;
    description: string;
    skills: string[];
    projectUrl?: string;
    files: PortfolioFile[];
    createdAt: string;
}

interface PortfolioFile {
    id: string;
    fileName: string;
    fileType: string;
    url: string;
}

const PortfolioManager: React.FC = () => {
    const { user } = useAuth();
    const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [skills, setSkills] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState('');
    const [projectUrl, setProjectUrl] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchPortfolio();
    }, []);

    const fetchPortfolio = async () => {
        try {
            // TODO: Fetch from GET /api/expert/portfolio
            // For now, using empty array
            setPortfolioItems([]);
        } catch (error) {
            console.error('Error fetching portfolio:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSkill = () => {
        if (skillInput.trim() && !skills.includes(skillInput.trim())) {
            setSkills([...skills, skillInput.trim()]);
            setSkillInput('');
        }
    };

    const handleRemoveSkill = (skill: string) => {
        setSkills(skills.filter(s => s !== skill));
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            setFiles([...files, ...selectedFiles]);
        }
    };

    const handleRemoveFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setSubmitting(true);
        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('skills', JSON.stringify(skills));
            if (projectUrl) formData.append('projectUrl', projectUrl);

            files.forEach((file) => {
                formData.append('files', file);
            });

            // TODO: Post to POST /api/expert/portfolio
            // This will upload files to expertdetails bucket and save metadata
            console.log('Submitting portfolio:', { title, description, skills, projectUrl, files: files.length });

            // Reset form and close modal
            resetForm();
            setShowAddModal(false);
            fetchPortfolio();
        } catch (error) {
            console.error('Error creating portfolio item:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setSkills([]);
        setSkillInput('');
        setProjectUrl('');
        setFiles([]);
    };

    const getFileIcon = (fileType: string) => {
        if (fileType.startsWith('image/')) return <Image size={16} />;
        return <FileText size={16} />;
    };

    if (loading) {
        return (
            <div className="portfolio-page loading">
                <Loader2 size={32} className="spin" />
                <p>Loading portfolio...</p>
            </div>
        );
    }

    return (
        <div className="portfolio-page">
            <div className="page-header">
                <div>
                    <h1>Portfolio</h1>
                    <p>Showcase your work and expertise</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    <Plus size={18} />
                    Add Portfolio Item
                </button>
            </div>

            {portfolioItems.length === 0 ? (
                <div className="empty-state">
                    <FolderOpen size={48} />
                    <h3>No Portfolio Items</h3>
                    <p>Add your best work to attract clients</p>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                        <Plus size={18} />
                        Add Portfolio Item
                    </button>
                </div>
            ) : (
                <div className="portfolio-grid">
                    {portfolioItems.map((item) => (
                        <div key={item.id} className="portfolio-card">
                            <div className="card-header">
                                <h3>{item.title}</h3>
                                {item.projectUrl && (
                                    <a href={item.projectUrl} target="_blank" rel="noopener noreferrer" className="project-link">
                                        <ExternalLink size={16} />
                                    </a>
                                )}
                            </div>
                            <p className="card-description">{item.description}</p>
                            <div className="card-skills">
                                {item.skills.map((skill, i) => (
                                    <span key={i} className="skill-tag">{skill}</span>
                                ))}
                            </div>
                            {item.files.length > 0 && (
                                <div className="card-files">
                                    {item.files.slice(0, 3).map((file) => (
                                        <a key={file.id} href={file.url} className="file-preview" target="_blank" rel="noopener noreferrer">
                                            {getFileIcon(file.fileType)}
                                        </a>
                                    ))}
                                    {item.files.length > 3 && (
                                        <span className="more-files">+{item.files.length - 3}</span>
                                    )}
                                </div>
                            )}
                            <div className="card-actions">
                                <button className="btn-icon" title="View">
                                    <Eye size={16} />
                                </button>
                                <button className="btn-icon danger" title="Delete">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Portfolio Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add Portfolio Item</h2>
                            <button className="btn-close" onClick={() => setShowAddModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-body">
                            <div className="form-group">
                                <label htmlFor="title">Title *</label>
                                <input
                                    id="title"
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., AI Resume Analyzer"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe this project..."
                                    rows={4}
                                />
                            </div>

                            <div className="form-group">
                                <label>Skills Used</label>
                                <div className="skills-input-container">
                                    <input
                                        type="text"
                                        value={skillInput}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                        placeholder="Add a skill"
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                                    />
                                    <button type="button" className="btn btn-secondary" onClick={handleAddSkill}>
                                        <Tag size={16} />
                                        Add
                                    </button>
                                </div>
                                {skills.length > 0 && (
                                    <div className="skills-list">
                                        {skills.map((skill, i) => (
                                            <span key={i} className="skill-tag">
                                                {skill}
                                                <button type="button" onClick={() => handleRemoveSkill(skill)}>
                                                    <X size={12} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="projectUrl">Project URL (optional)</label>
                                <input
                                    id="projectUrl"
                                    type="url"
                                    value={projectUrl}
                                    onChange={(e) => setProjectUrl(e.target.value)}
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="form-group">
                                <label>Upload Files</label>
                                <div
                                    className="file-upload-zone"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload size={24} />
                                    <p>Click to upload images, PDFs, or documents</p>
                                    <span>Max 10MB per file</span>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*,.pdf,.doc,.docx"
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />
                                {files.length > 0 && (
                                    <div className="selected-files">
                                        {files.map((file, i) => (
                                            <div key={i} className="file-item">
                                                {getFileIcon(file.type)}
                                                <span className="file-name">{file.name}</span>
                                                <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                                                <button type="button" className="btn-remove" onClick={() => handleRemoveFile(i)}>
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitting || !title.trim()}>
                                    {submitting ? (
                                        <>
                                            <Loader2 size={18} className="spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={18} />
                                            Add Portfolio
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PortfolioManager;
