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

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const response = await applicationApi.approveApplication(id);
      if (response.data.success) {
        // Refresh list
        fetchApplications();
      } else {
        showGlobalError('Approval Failed', response.data.error || 'Failed to approve application');
      }
    } catch (err: any) {
      showGlobalError('Approval Failed', err.message || 'Failed to approve application');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    setActionLoading(id);
    try {
      const response = await applicationApi.rejectApplication(id, reason);
      if (response.data.success) {
        fetchApplications();
      } else {
        showGlobalError('Rejection Failed', response.data.error || 'Failed to reject application');
      }
    } catch (err: any) {
      showGlobalError('Rejection Failed', err.message || 'Failed to reject application');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: React.ReactNode }> = {
      PENDING: { color: 'warning', icon: <Clock size={14} /> },
      APPROVED: { color: 'success', icon: <CheckCircle size={14} /> },
      REJECTED: { color: 'danger', icon: <XCircle size={14} /> },
      DRAFT: { color: 'secondary', icon: <FileText size={14} /> },
    };
    const badge = badges[status] || badges.PENDING;
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

                  {app.status === 'PENDING' && (
                    <div className="actions">
                      <button
                        className="btn-approve"
                        onClick={() => handleApprove(app.id)}
                        disabled={actionLoading === app.id}
                      >
                        {actionLoading === app.id ? <Loader className="spinner" size={16} /> : <CheckCircle size={16} />}
                        Approve
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => handleReject(app.id)}
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
