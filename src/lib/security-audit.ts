import { supabaseAdmin } from './supabase';
import { SecurityAuditLog } from '@/types/database';

/**
 * Security audit logging system for comprehensive monitoring
 * Designed for cybersecurity professionals and ethical hackers
 */

export interface AuditLogEntry {
  user_id?: string;
  event_type: string;
  event_category: 'authentication' | 'authorization' | 'data_access' | 'admin' | 'security';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  source_ip?: string;
  user_agent?: string;
  session_id?: string;
  resource_accessed?: string;
  action_details?: Record<string, any>;
  threat_indicators?: string[];
  geolocation?: {
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  success: boolean;
  error_message?: string;
}

/**
 * Calculate risk score based on various factors
 */
function calculateRiskScore(entry: AuditLogEntry): number {
  let score = 0;

  // Base score by severity
  const severityScores = {
    critical: 80,
    high: 60,
    medium: 40,
    low: 20,
    info: 0
  };
  score += severityScores[entry.severity];

  // Failed authentication attempts
  if (entry.event_type.includes('failed_login') || entry.event_type.includes('unauthorized')) {
    score += 15;
  }

  // Admin actions
  if (entry.event_category === 'admin') {
    score += 10;
  }

  // Threat indicators present
  if (entry.threat_indicators && entry.threat_indicators.length > 0) {
    score += entry.threat_indicators.length * 5;
  }

  // Suspicious user agents
  if (entry.user_agent) {
    const suspiciousPatterns = [
      'sqlmap', 'nikto', 'nmap', 'burp', 'zap', 'metasploit',
      'curl', 'wget', 'python-requests', 'scanner'
    ];
    if (suspiciousPatterns.some(pattern => 
      entry.user_agent.toLowerCase().includes(pattern))) {
      score += 20;
    }
  }

  // Multiple failed attempts from same IP
  if (entry.source_ip && entry.event_type.includes('failed')) {
    score += 10;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Detect threat indicators in audit log entry
 */
function detectThreatIndicators(entry: AuditLogEntry): string[] {
  const indicators: string[] = [];

  // SQL injection patterns
  if (entry.action_details) {
    const content = JSON.stringify(entry.action_details).toLowerCase();
    if (content.includes('union select') || content.includes('drop table') || 
        content.includes('insert into') || content.includes('delete from')) {
      indicators.push('sql_injection_attempt');
    }

    // XSS patterns
    if (content.includes('<script>') || content.includes('javascript:') || 
        content.includes('onerror=') || content.includes('onload=')) {
      indicators.push('xss_attempt');
    }

    // Path traversal
    if (content.includes('../') || content.includes('..\\') || 
        content.includes('%2e%2e%2f')) {
      indicators.push('path_traversal_attempt');
    }

    // Command injection
    if (content.includes('$(') || content.includes('`') || 
        content.includes('&&') || content.includes('||')) {
      indicators.push('command_injection_attempt');
    }
  }

  // Brute force indicators
  if (entry.event_type.includes('failed_login')) {
    indicators.push('potential_brute_force');
  }

  // Privilege escalation attempts
  if (entry.event_type.includes('admin') && !entry.success) {
    indicators.push('privilege_escalation_attempt');
  }

  return indicators;
}

/**
 * Get geolocation information from IP address
 */
async function getGeolocation(ip: string): Promise<any> {
  try {
    // In a real implementation, you would use a geolocation service
    // For now, return mock data for demonstration
    return {
      country: 'Unknown',
      city: 'Unknown',
      latitude: 0,
      longitude: 0
    };
  } catch (error) {
    console.error('Geolocation lookup failed:', error);
    return null;
  }
}

/**
 * Log a security audit event
 */
export async function logSecurityEvent(entry: AuditLogEntry): Promise<void> {
  try {
    // Detect threat indicators
    const threatIndicators = detectThreatIndicators(entry);
    
    // Calculate risk score
    const riskScore = calculateRiskScore({
      ...entry,
      threat_indicators: threatIndicators
    });

    // Get geolocation if IP is provided
    let geolocation = null;
    if (entry.source_ip) {
      geolocation = await getGeolocation(entry.source_ip);
    }

    // Insert audit log
    const { error } = await supabaseAdmin
      .from('security_audit_logs')
      .insert({
        user_id: entry.user_id,
        event_type: entry.event_type,
        event_category: entry.event_category,
        severity: entry.severity,
        source_ip: entry.source_ip,
        user_agent: entry.user_agent,
        session_id: entry.session_id,
        resource_accessed: entry.resource_accessed,
        action_details: entry.action_details,
        risk_score: riskScore,
        threat_indicators: threatIndicators,
        geolocation,
        success: entry.success,
        error_message: entry.error_message,
        processed: false
      });

    if (error) {
      console.error('Failed to log security event:', error);
    }

    // Trigger incident response for high-risk events
    if (riskScore >= 70) {
      await triggerIncidentResponse(entry, riskScore, threatIndicators);
    }

  } catch (error) {
    console.error('Error in logSecurityEvent:', error);
  }
}

/**
 * Trigger automated incident response for high-risk events
 */
async function triggerIncidentResponse(
  entry: AuditLogEntry, 
  riskScore: number, 
  threatIndicators: string[]
): Promise<void> {
  try {
    // Create security incident
    const { error } = await supabaseAdmin
      .from('security_incidents')
      .insert({
        incident_type: `automated_detection_${entry.event_type}`,
        severity: riskScore >= 90 ? 'critical' : 'high',
        status: 'open',
        title: `High-risk security event detected: ${entry.event_type}`,
        description: `Automated detection of suspicious activity with risk score ${riskScore}`,
        affected_users: entry.user_id ? [entry.user_id] : [],
        source_ips: entry.source_ip ? [entry.source_ip] : [],
        indicators: threatIndicators.map(indicator => ({
          type: 'behavioral',
          value: indicator,
          confidence: 0.8
        })),
        timeline: [{
          timestamp: new Date().toISOString(),
          event: 'Incident created by automated detection',
          details: `Risk score: ${riskScore}, Indicators: ${threatIndicators.join(', ')}`
        }]
      });

    if (error) {
      console.error('Failed to create security incident:', error);
    }

  } catch (error) {
    console.error('Error in triggerIncidentResponse:', error);
  }
}

/**
 * Get security audit logs with filtering and pagination
 */
export async function getSecurityAuditLogs(options: {
  user_id?: string;
  event_type?: string;
  event_category?: string;
  severity?: string;
  min_risk_score?: number;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}): Promise<{ logs: SecurityAuditLog[]; total: number }> {
  try {
    let query = supabaseAdmin
      .from('security_audit_logs')
      .select('*', { count: 'exact' });

    // Apply filters
    if (options.user_id) {
      query = query.eq('user_id', options.user_id);
    }
    if (options.event_type) {
      query = query.eq('event_type', options.event_type);
    }
    if (options.event_category) {
      query = query.eq('event_category', options.event_category);
    }
    if (options.severity) {
      query = query.eq('severity', options.severity);
    }
    if (options.min_risk_score) {
      query = query.gte('risk_score', options.min_risk_score);
    }
    if (options.start_date) {
      query = query.gte('created_at', options.start_date);
    }
    if (options.end_date) {
      query = query.lte('created_at', options.end_date);
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, (options.offset + (options.limit || 50)) - 1);
    }

    // Order by created_at descending
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching security audit logs:', error);
      return { logs: [], total: 0 };
    }

    return {
      logs: data || [],
      total: count || 0
    };

  } catch (error) {
    console.error('Error in getSecurityAuditLogs:', error);
    return { logs: [], total: 0 };
  }
}

/**
 * Get security metrics and statistics
 */
export async function getSecurityMetrics(timeframe: '24h' | '7d' | '30d' = '24h'): Promise<{
  total_events: number;
  high_risk_events: number;
  failed_logins: number;
  admin_actions: number;
  threat_indicators: number;
  top_event_types: Array<{ event_type: string; count: number }>;
  risk_distribution: Record<string, number>;
}> {
  try {
    const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720;
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    // Get basic metrics
    const { data: metrics, error } = await supabaseAdmin
      .from('security_audit_logs')
      .select('event_type, severity, risk_score, success')
      .gte('created_at', startTime.toISOString());

    if (error || !metrics) {
      console.error('Error fetching security metrics:', error);
      return {
        total_events: 0,
        high_risk_events: 0,
        failed_logins: 0,
        admin_actions: 0,
        threat_indicators: 0,
        top_event_types: [],
        risk_distribution: {}
      };
    }

    // Calculate metrics
    const totalEvents = metrics.length;
    const highRiskEvents = metrics.filter(m => m.risk_score >= 70).length;
    const failedLogins = metrics.filter(m => 
      m.event_type.includes('login') && !m.success).length;
    const adminActions = metrics.filter(m => 
      m.event_type.includes('admin')).length;

    // Count event types
    const eventTypeCounts: Record<string, number> = {};
    metrics.forEach(m => {
      eventTypeCounts[m.event_type] = (eventTypeCounts[m.event_type] || 0) + 1;
    });

    const topEventTypes = Object.entries(eventTypeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([event_type, count]) => ({ event_type, count }));

    // Risk distribution
    const riskDistribution: Record<string, number> = {
      low: metrics.filter(m => m.risk_score < 30).length,
      medium: metrics.filter(m => m.risk_score >= 30 && m.risk_score < 70).length,
      high: metrics.filter(m => m.risk_score >= 70).length
    };

    return {
      total_events: totalEvents,
      high_risk_events: highRiskEvents,
      failed_logins: failedLogins,
      admin_actions: adminActions,
      threat_indicators: metrics.filter(m => m.risk_score > 50).length,
      top_event_types: topEventTypes,
      risk_distribution: riskDistribution
    };

  } catch (error) {
    console.error('Error in getSecurityMetrics:', error);
    return {
      total_events: 0,
      high_risk_events: 0,
      failed_logins: 0,
      admin_actions: 0,
      threat_indicators: 0,
      top_event_types: [],
      risk_distribution: {}
    };
  }
}
