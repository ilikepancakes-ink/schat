import { supabaseAdmin } from './supabase';
import { SandboxEnvironment, SandboxSession } from '@/types/database';
import { logSecurityEvent } from './security-audit';

/**
 * Penetration testing sandbox manager
 * Provides controlled environments for ethical hacking practice
 */

/**
 * Create a new sandbox environment
 */
export async function createSandboxEnvironment(
  environment: Omit<SandboxEnvironment, 'id' | 'created_at'>,
  createdBy: string
): Promise<{ success: boolean; environment?: SandboxEnvironment; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('sandbox_environments')
      .insert({
        name: environment.name,
        description: environment.description,
        environment_type: environment.environment_type,
        docker_compose: environment.docker_compose,
        target_services: environment.target_services,
        allowed_tools: environment.allowed_tools,
        restrictions: environment.restrictions,
        max_duration: environment.max_duration,
        is_active: environment.is_active,
        created_by: createdBy
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating sandbox environment:', error);
      return { success: false, error: 'Failed to create environment' };
    }

    await logSecurityEvent({
      user_id: createdBy,
      event_type: 'sandbox_environment_created',
      event_category: 'admin',
      severity: 'info',
      resource_accessed: `/sandbox/environments/${data.id}`,
      action_details: {
        environment_id: data.id,
        name: environment.name,
        type: environment.environment_type
      },
      success: true
    });

    return { success: true, environment: data };

  } catch (error) {
    console.error('Error in createSandboxEnvironment:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Get available sandbox environments
 */
export async function getSandboxEnvironments(
  environmentType?: string
): Promise<SandboxEnvironment[]> {
  try {
    let query = supabaseAdmin
      .from('sandbox_environments')
      .select('*')
      .eq('is_active', true);

    if (environmentType) {
      query = query.eq('environment_type', environmentType);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching sandbox environments:', error);
      return [];
    }

    return data || [];

  } catch (error) {
    console.error('Error in getSandboxEnvironments:', error);
    return [];
  }
}

/**
 * Start a sandbox session
 */
export async function startSandboxSession(
  environmentId: string,
  userId: string,
  sourceIp?: string,
  userAgent?: string
): Promise<{ 
  success: boolean; 
  session?: SandboxSession; 
  connection_info?: any;
  error?: string 
}> {
  try {
    // Get the environment
    const { data: environment, error: envError } = await supabaseAdmin
      .from('sandbox_environments')
      .select('*')
      .eq('id', environmentId)
      .eq('is_active', true)
      .single();

    if (envError || !environment) {
      return { success: false, error: 'Environment not found or inactive' };
    }

    // Check if user has any running sessions
    const { data: runningSessions } = await supabaseAdmin
      .from('sandbox_sessions')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['starting', 'running']);

    if (runningSessions && runningSessions.length > 0) {
      return { 
        success: false, 
        error: 'You already have a running sandbox session. Please stop it before starting a new one.' 
      };
    }

    // Create session record
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sandbox_sessions')
      .insert({
        environment_id: environmentId,
        user_id: userId,
        status: 'starting',
        actions_log: [],
        findings: [],
        score: 0
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating sandbox session:', sessionError);
      return { success: false, error: 'Failed to create session' };
    }

    // In a real implementation, this would start a Docker container
    // For now, we'll simulate the container startup
    const containerId = `sandbox_${session.id}_${Date.now()}`;
    
    // Update session with container ID and running status
    const { error: updateError } = await supabaseAdmin
      .from('sandbox_sessions')
      .update({
        container_id: containerId,
        status: 'running'
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('Error updating sandbox session:', updateError);
    }

    // Log the session start
    await logSecurityEvent({
      user_id: userId,
      event_type: 'sandbox_session_started',
      event_category: 'security',
      severity: 'info',
      source_ip: sourceIp,
      user_agent: userAgent,
      resource_accessed: `/sandbox/sessions/${session.id}`,
      action_details: {
        session_id: session.id,
        environment_id: environmentId,
        environment_name: environment.name,
        container_id: containerId
      },
      success: true
    });

    // Simulate connection info (in real implementation, this would be actual container details)
    const connectionInfo = {
      container_id: containerId,
      web_interface: `https://sandbox.example.com/session/${session.id}`,
      ssh_access: environment.environment_type === 'network' ? {
        host: 'sandbox.example.com',
        port: 2200 + parseInt(session.id.slice(-4), 16) % 1000,
        username: 'pentester',
        password: 'generated_password'
      } : null,
      target_services: environment.target_services,
      allowed_tools: environment.allowed_tools,
      restrictions: environment.restrictions,
      max_duration: environment.max_duration
    };

    return {
      success: true,
      session: {
        ...session,
        container_id: containerId,
        status: 'running' as const
      },
      connection_info: connectionInfo
    };

  } catch (error) {
    console.error('Error in startSandboxSession:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Stop a sandbox session
 */
export async function stopSandboxSession(
  sessionId: string,
  userId: string,
  sourceIp?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sandbox_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError || !session) {
      return { success: false, error: 'Session not found or access denied' };
    }

    if (session.status === 'stopped') {
      return { success: false, error: 'Session is already stopped' };
    }

    // Calculate duration
    const startTime = new Date(session.start_time);
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    // Update session status
    const { error: updateError } = await supabaseAdmin
      .from('sandbox_sessions')
      .update({
        status: 'stopped',
        end_time: endTime.toISOString(),
        duration: duration
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Error updating sandbox session:', updateError);
      return { success: false, error: 'Failed to stop session' };
    }

    // In a real implementation, this would stop and remove the Docker container
    // For now, we'll just log the action

    await logSecurityEvent({
      user_id: userId,
      event_type: 'sandbox_session_stopped',
      event_category: 'security',
      severity: 'info',
      source_ip: sourceIp,
      resource_accessed: `/sandbox/sessions/${sessionId}`,
      action_details: {
        session_id: sessionId,
        duration: duration,
        container_id: session.container_id
      },
      success: true
    });

    return { success: true };

  } catch (error) {
    console.error('Error in stopSandboxSession:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Log an action performed in a sandbox session
 */
export async function logSandboxAction(
  sessionId: string,
  userId: string,
  action: string,
  details?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sandbox_sessions')
      .select('actions_log')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .eq('status', 'running')
      .single();

    if (sessionError || !session) {
      return { success: false, error: 'Session not found or not running' };
    }

    // Add new action to log
    const currentLog = session.actions_log || [];
    const newAction = {
      timestamp: new Date().toISOString(),
      action: action,
      details: details
    };

    const updatedLog = [...currentLog, newAction];

    // Update session with new action log
    const { error: updateError } = await supabaseAdmin
      .from('sandbox_sessions')
      .update({
        actions_log: updatedLog
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Error updating sandbox action log:', updateError);
      return { success: false, error: 'Failed to log action' };
    }

    return { success: true };

  } catch (error) {
    console.error('Error in logSandboxAction:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Submit findings from a sandbox session
 */
export async function submitSandboxFindings(
  sessionId: string,
  userId: string,
  findings: Array<{
    vulnerability_type: string;
    severity: string;
    description: string;
    evidence?: string;
  }>,
  notes?: string
): Promise<{ success: boolean; score?: number; error?: string }> {
  try {
    // Validate session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sandbox_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError || !session) {
      return { success: false, error: 'Session not found or access denied' };
    }

    // Calculate score based on findings
    let score = 0;
    const severityPoints = {
      critical: 100,
      high: 75,
      medium: 50,
      low: 25,
      info: 10
    };

    findings.forEach(finding => {
      score += severityPoints[finding.severity as keyof typeof severityPoints] || 0;
    });

    // Update session with findings and score
    const { error: updateError } = await supabaseAdmin
      .from('sandbox_sessions')
      .update({
        findings: findings,
        score: score,
        notes: notes
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Error updating sandbox findings:', updateError);
      return { success: false, error: 'Failed to submit findings' };
    }

    // Log the findings submission
    await logSecurityEvent({
      user_id: userId,
      event_type: 'sandbox_findings_submitted',
      event_category: 'security',
      severity: 'info',
      resource_accessed: `/sandbox/sessions/${sessionId}/findings`,
      action_details: {
        session_id: sessionId,
        findings_count: findings.length,
        score: score,
        vulnerabilities: findings.map(f => f.vulnerability_type)
      },
      success: true
    });

    return { success: true, score: score };

  } catch (error) {
    console.error('Error in submitSandboxFindings:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Get user's sandbox session history
 */
export async function getUserSandboxHistory(
  userId: string,
  limit: number = 20
): Promise<Array<SandboxSession & { environment_name?: string }>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('sandbox_sessions')
      .select(`
        *,
        sandbox_environments (
          name
        )
      `)
      .eq('user_id', userId)
      .order('start_time', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching sandbox history:', error);
      return [];
    }

    return (data || []).map(session => ({
      ...session,
      environment_name: (session.sandbox_environments as any)?.name
    }));

  } catch (error) {
    console.error('Error in getUserSandboxHistory:', error);
    return [];
  }
}
