import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  FileText,
  Eye,
  Download,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Loader
} from 'lucide-react';
import { applicationApi, documentApi } from '../../services/api';
import { showGlobalError } from '../../context/ErrorContext';
import './ExpertReviewCenter.css';

interface Application {
  id: string;
  userId: string;
  status: string;
  submittedAt: string;
  createdAt: string;
  domains?: string[];
  skills?: string[];
  yearsOfExperience?: number;
  summaryBio?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  country?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  full_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  expertise?: string;
  experience?: string;
  documents?: any[];
  images?: any[];
}

const ExpertReviewCenter: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await applicationApi.getApplications({ status: statusFilter });
      if (response.data.success) {
        setApplications(response.data.data?.applications || []);
      } else {
        setError(response.data.error || 'Failed to fetch applications');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id: string, decision: 'approved' | 'rejected') => {
    let reason = '';
    if (decision === 'rejected') {
      const input = prompt('Enter rejection reason:');
      if (!input) return;
      reason = input;
    }

    setActionLoading(id);
    try {
      const response = await applicationApi.reviewApplication(id, decision, reason);
      if (response.data.success) {
        // Refresh list
        fetchApplications();
      } else {
        showGlobalError('Review Failed', response.data.error || `Failed to ${decision} application`);
      }
    } catch (err: any) {
      showGlobalError('Review Failed', err.message || `Failed to ${decision} application`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    const badges: Record<string, { color: string; icon: React.ReactNode }> = {
      PENDING: { color: 'warning', icon: <Clock size={14} /> },
      APPROVED: { color: 'success', icon: <CheckCircle size={14} /> },
      REJECTED: { color: 'danger', icon: <XCircle size={14} /> },
      DEACTIVATED: { color: 'secondary', icon: <XCircle size={14} /> },
    };
    const badge = badges[s] || badges.PENDING;
    return (
      <span className={`status-badge ${badge.color}`}>
        {badge.icon}
        {status}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="expert-review-center">
      <div className="page-header">
        <h1>Expert Review Center</h1>
        <p>Review and approve expert applications</p>
      </div>

      <div className="filters">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-filter"
        >
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="DEACTIVATED">Deactivated</option>
          <option value="">All</option>
        </select>
        <button onClick={fetchApplications} className="refresh-btn">
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <Loader className="spinner" size={32} />
          <p>Loading applications...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <XCircle size={48} />
          <h3>Error Loading Applications</h3>
          <p>{error}</p>
          <button onClick={fetchApplications}>Retry</button>
        </div>
      ) : applications.length === 0 ? (
        <div className="empty-state">
          <CheckCircle size={48} />
          <h3>No {statusFilter || ''} Applications</h3>
          <p>Applications will appear here when submitted by experts</p>
        </div>
      ) : (
        <div className="applications-list">
          {applications.map((app) => (
            <div key={app.id} className="application-card">
              <div
                className="card-header"
                onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
              >
                <div className="applicant-info">
                  <div className="avatar">
                    <User size={24} />
                  </div>
                  <div className="details">
                    <h3>{app.user?.name || 'Unknown'}</h3>
                    <span className="email">{app.user?.email}</span>
                  </div>
                </div>
                <div className="card-meta">
                  {getStatusBadge(app.status)}
                  <span className="date">
                    <Calendar size={14} />
                    {formatDate(app.submittedAt || app.createdAt)}
                  </span>
                  {expandedId === app.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {expandedId === app.id && (
                <div className="card-body">
                  <div className="info-grid">
                    {app.user?.phone && (
                      <div className="info-item">
                        <Phone size={16} />
                        <span>{app.user.phone}</span>
                      </div>
                    )}
                    {app.yearsOfExperience && (
                      <div className="info-item">
                        <Briefcase size={16} />
                        <span>{app.yearsOfExperience} years experience</span>
                      </div>
                    )}
                    {(app.city || app.country) && (
                      <div className="info-item">
                        <span>📍 {[app.city, app.state, app.country].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {app.domains && app.domains.length > 0 && (
                    <div className="section">
                      <h4>Domains</h4>
                      <div className="tags">
                        {app.domains.map((domain, i) => (
                          <span key={i} className="tag">{domain}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {app.skills && app.skills.length > 0 && (
                    <div className="section">
                      <h4>Skills</h4>
                      <div className="tags">
                        {app.skills.map((skill, i) => (
                          <span key={i} className="tag skill">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {app.summaryBio && (
                    <div className="section">
                      <h4>Bio</h4>
                      <p className="bio">{app.summaryBio}</p>
                    </div>
                  )}

                  {((app.documents && app.documents.length > 0) || (app.images && app.images.length > 0)) && (
                    <div className="section">
                      <h4>Attachments</h4>
                      <div className="attachments-grid">
                        {app.documents?.map((doc: any, i: number) => (
                          <div key={`doc-${i}`} className="attachment-item">
                            <FileText size={16} />
                            <span className="file-name">{doc.fileName || doc.name || `Document ${i + 1}`}</span>
                            <button className="download-link" onClick={() => window.open(doc.url || doc.path, '_blank')}>
                              <Download size={14} />
                            </button>
                          </div>
                        ))}
                        {app.images?.map((img: any, i: number) => (
                          <div key={`img-${i}`} className="attachment-item">
                            <Eye size={16} />
                            <span className="file-name">{img.fileName || img.name || `Image ${i + 1}`}</span>
                            <button className="preview-link" onClick={() => window.open(img.url || img.path, '_blank')}>
                              <Eye size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {app.status === 'PENDING' && (
                    <div className="actions">
                      <button
                        className="btn-approve"
                        onClick={() => handleReview(app.id, 'approved')}
                        disabled={actionLoading === app.id}
                      >
                        {actionLoading === app.id ? <Loader className="spinner" size={16} /> : <CheckCircle size={16} />}
                        Approve
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => handleReview(app.id, 'rejected')}
                        disabled={actionLoading === app.id}
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpertReviewCenter;
