'use client';

import React, { useState, useEffect } from 'react';
import { SecurityReport } from '@/types/database';
import { apiRequest } from '@/lib/api-client';
import { Bug, AlertTriangle, Shield, Clock, CheckCircle, XCircle, Eye, MessageSquare } from 'lucide-react';

export default function SecurityReports() {
  const [reports, setReports] = useState<SecurityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<SecurityReport | null>(null);
  const [filter, setFilter] = useState<'all' | 'new' | 'reviewing' | 'confirmed' | 'fixed' | 'dismissed'>('all');
  const [adminNotes, setAdminNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/api/admin/security-reports', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReports(data.reports || []);
          return data.reports || [];
        }
      }
    } catch (error) {
      console.error('Error loading security reports:', error);
    } finally {
      setLoading(false);
    }
    return [];
  };

  const updateReportStatus = async (reportId: string, status: string, notes?: string) => {
    try {
      setUpdating(true);
      setError(null);

      const response = await apiRequest(`/api/admin/security-reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status, adminNotes: notes }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await loadReports();
        // Refresh the selected report with updated data
        const updatedReports = await loadReports();
        if (selectedReport?.id === reportId && updatedReports) {
          const updatedReport = updatedReports.find((r: SecurityReport) => r.id === reportId);
          if (updatedReport) {
            setSelectedReport(updatedReport);
          }
        }
        setAdminNotes('');
        setShowNotesInput(false);
      } else {
        setError(data.error || 'Failed to update report status');
      }
    } catch (error) {
      console.error('Error updating report status:', error);
      setError('Network error. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusUpdate = (status: string) => {
    setError(null);
    if (showNotesInput) {
      updateReportStatus(selectedReport!.id, status, adminNotes);
    } else {
      updateReportStatus(selectedReport!.id, status);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      case 'info': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'text-red-600 bg-red-100';
      case 'reviewing': return 'text-yellow-600 bg-yellow-100';
      case 'confirmed': return 'text-orange-600 bg-orange-100';
      case 'fixed': return 'text-green-600 bg-green-100';
      case 'dismissed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <AlertTriangle className="h-4 w-4" />;
      case 'reviewing': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <Bug className="h-4 w-4" />;
      case 'fixed': return <CheckCircle className="h-4 w-4" />;
      case 'dismissed': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredReports = reports.filter(report => 
    filter === 'all' || report.status === filter
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Security Reports</h2>
        <p className="text-gray-600">Manage vulnerability reports from security researchers</p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex space-x-2">
          {['all', 'new', 'reviewing', 'confirmed', 'fixed', 'dismissed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && (
                <span className="ml-2 bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-xs">
                  {reports.filter(r => r.status === status).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Reports List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Reports ({filteredReports.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {filteredReports.length === 0 ? (
              <div className="p-8 text-center">
                <Bug className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No security reports found</p>
              </div>
            ) : (
              filteredReports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedReport?.id === report.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(report.severity)}`}>
                        {report.severity.toUpperCase()}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {getStatusIcon(report.status)}
                        <span className="ml-1">{report.status.toUpperCase()}</span>
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(report.submitted_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h4 className="font-medium text-gray-900 mb-1">
                    {report.vulnerability_type.replace('-', ' ').toUpperCase()}
                  </h4>
                  
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {report.description}
                  </p>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    Reporter: {report.reporter_name}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Report Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {selectedReport ? (
            <div>
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Report Details</h3>
                  <div className="flex space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(selectedReport.severity)}`}>
                      {selectedReport.severity.toUpperCase()}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedReport.status)}`}>
                      {getStatusIcon(selectedReport.status)}
                      <span className="ml-1">{selectedReport.status.toUpperCase()}</span>
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Submitted {new Date(selectedReport.submitted_at).toLocaleString()}
                </p>
              </div>

              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Vulnerability Type</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {selectedReport.vulnerability_type.replace('-', ' ').toUpperCase()}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded whitespace-pre-wrap">
                    {selectedReport.description}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Steps to Reproduce</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded whitespace-pre-wrap">
                    {selectedReport.steps_to_reproduce}
                  </p>
                </div>

                {selectedReport.potential_impact && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Potential Impact</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded whitespace-pre-wrap">
                      {selectedReport.potential_impact}
                    </p>
                  </div>
                )}

                {selectedReport.suggested_fix && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Suggested Fix</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded whitespace-pre-wrap">
                      {selectedReport.suggested_fix}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Reporter Information</h4>
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    <p><strong>Name:</strong> {selectedReport.reporter_name}</p>
                    {selectedReport.reporter_email && (
                      <p><strong>Email:</strong> {selectedReport.reporter_email}</p>
                    )}
                    {selectedReport.ip_address && (
                      <p><strong>IP Address:</strong> {selectedReport.ip_address}</p>
                    )}
                  </div>
                </div>

                {selectedReport.admin_notes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Admin Notes</h4>
                    <p className="text-sm text-gray-600 bg-yellow-50 p-2 rounded whitespace-pre-wrap">
                      {selectedReport.admin_notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Update Status</h4>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div className="mb-4">
                  <button
                    onClick={() => setShowNotesInput(!showNotesInput)}
                    className="text-sm text-blue-600 hover:text-blue-700 mb-2"
                  >
                    {showNotesInput ? 'Hide' : 'Add'} Admin Notes
                  </button>

                  {showNotesInput && (
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes about this report..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      rows={3}
                    />
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {['reviewing', 'confirmed', 'fixed', 'dismissed'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(status)}
                      disabled={selectedReport.status === status || updating}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        selectedReport.status === status || updating
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {updating ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                          Updating...
                        </div>
                      ) : (
                        `Mark as ${status.charAt(0).toUpperCase() + status.slice(1)}`
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Eye className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select a report to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
