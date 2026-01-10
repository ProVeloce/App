import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Image, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { documentApi } from '../../services/api';
import { showGlobalError } from '../../context/ErrorContext';
import './FileUploader.css';

interface UploadedFile {
    id: string;
    name: string;
    type: string;
    size: number;
    status: 'uploading' | 'success' | 'error';
    progress: number;
    errorMessage?: string;
    documentId?: string;
}

interface FileUploaderProps {
    documentType: 'profile' | 'government_id' | 'resume' | 'certificate' | 'portfolio' | 'other';
    label: string;
    description?: string;
    accept?: string;
    maxFiles?: number;
    maxSizeMB?: number;
    onUploadComplete?: (files: { id: string; name: string; documentId: string }[]) => void;
    existingFiles?: { id: string; name: string; documentId: string }[];
}

const FileUploader: React.FC<FileUploaderProps> = ({
    documentType,
    label,
    description,
    accept = '.jpg,.jpeg,.png,.webp,.pdf,.doc,.docx',
    maxFiles = 5,
    maxSizeMB = 10,
    onUploadComplete,
    existingFiles = [],
}) => {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    const validateFile = (file: File): string | null => {
        if (file.size > maxSizeBytes) {
            return `File size exceeds ${maxSizeMB}MB limit`;
        }

        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (!allowedTypes.includes(file.type)) {
            return 'File type not supported';
        }

        return null;
    };

    const uploadFile = async (file: File, tempId: string) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('documentType', documentType);

            const response = await documentApi.upload(formData);

            if (response.data.success && response.data.data) {
                const docId = response.data.data.document.id;
                setFiles(prev => prev.map(f =>
                    f.id === tempId
                        ? { ...f, status: 'success' as const, progress: 100, documentId: docId }
                        : f
                ));

                // Notify parent
                if (onUploadComplete) {
                    const successFiles = files
                        .filter(f => f.status === 'success' && f.documentId)
                        .map(f => ({ id: f.id, name: f.name, documentId: f.documentId! }));

                    successFiles.push({
                        id: tempId,
                        name: file.name,
                        documentId: docId,
                    });

                    onUploadComplete(successFiles);
                }
            } else {
                throw new Error(response.data.error || 'Upload failed');
            }
        } catch (error: any) {
            setFiles(prev => prev.map(f =>
                f.id === tempId
                    ? { ...f, status: 'error' as const, errorMessage: error.message || 'Upload failed' }
                    : f
            ));
        }
    };

    const handleFiles = useCallback((fileList: FileList) => {
        const currentCount = files.filter(f => f.status !== 'error').length + existingFiles.length;
        const availableSlots = maxFiles - currentCount;

        if (availableSlots <= 0) {
            showGlobalError('Upload Limit Reached', `Maximum ${maxFiles} files allowed`);
            return;
        }

        const newFiles = Array.from(fileList).slice(0, availableSlots);

        newFiles.forEach(file => {
            const error = validateFile(file);
            const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            if (error) {
                setFiles(prev => [...prev, {
                    id: tempId,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    status: 'error',
                    progress: 0,
                    errorMessage: error,
                }]);
            } else {
                setFiles(prev => [...prev, {
                    id: tempId,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    status: 'uploading',
                    progress: 0,
                }]);

                // Start upload
                uploadFile(file, tempId);
            }
        });
    }, [files, existingFiles, maxFiles, documentType]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    };

    const removeFile = (fileId: string) => {
        setFiles(prev => prev.filter(f => f.id !== fileId));
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return <Image size={20} />;
        return <FileText size={20} />;
    };

    return (
        <div className="file-uploader">
            <label className="uploader-label">{label}</label>
            {description && <p className="uploader-description">{description}</p>}

            <div
                className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    multiple={maxFiles > 1}
                    onChange={handleInputChange}
                    className="file-input"
                />
                <Upload size={32} className="drop-icon" />
                <p className="drop-text">
                    Drag & drop files here or <span className="browse-link">browse</span>
                </p>
                <p className="drop-hint">
                    Max {maxSizeMB}MB per file • {maxFiles - files.filter(f => f.status !== 'error').length - existingFiles.length} slots remaining
                </p>
            </div>

            {(files.length > 0 || existingFiles.length > 0) && (
                <div className="file-list">
                    {/* Existing files */}
                    {existingFiles.map(file => (
                        <div key={file.id} className="file-item success">
                            <div className="file-icon">
                                <FileText size={20} />
                            </div>
                            <div className="file-info">
                                <span className="file-name">{file.name}</span>
                                <span className="file-status">Uploaded</span>
                            </div>
                            <CheckCircle size={18} className="status-icon success" />
                        </div>
                    ))}

                    {/* New files */}
                    {files.map(file => (
                        <div key={file.id} className={`file-item ${file.status}`}>
                            <div className="file-icon">
                                {getFileIcon(file.type)}
                            </div>
                            <div className="file-info">
                                <span className="file-name">{file.name}</span>
                                <span className="file-meta">
                                    {formatFileSize(file.size)}
                                    {file.status === 'uploading' && ' • Uploading...'}
                                    {file.status === 'error' && ` • ${file.errorMessage}`}
                                </span>
                            </div>
                            <div className="file-actions">
                                {file.status === 'uploading' && (
                                    <Loader size={18} className="status-icon loading" />
                                )}
                                {file.status === 'success' && (
                                    <CheckCircle size={18} className="status-icon success" />
                                )}
                                {file.status === 'error' && (
                                    <AlertCircle size={18} className="status-icon error" />
                                )}
                                <button
                                    type="button"
                                    className="remove-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile(file.id);
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileUploader;
