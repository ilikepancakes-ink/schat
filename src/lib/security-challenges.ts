import { supabaseAdmin } from './supabase';
import { SecurityChallenge, ChallengeAttempt } from '@/types/database';
import { hashPassword, verifyPassword } from './encryption';
import { logSecurityEvent } from './security-audit';

/**
 * Security challenges system for CTF-style cybersecurity training
 * Designed for ethical hackers and cybersecurity professionals
 */

/**
 * Create a new security challenge
 */
export async function createSecurityChallenge(
  challenge: Omit<SecurityChallenge, 'id' | 'flag_hash' | 'created_at' | 'updated_at'> & { flag: string },
  createdBy: string
): Promise<{ success: boolean; challenge?: SecurityChallenge; error?: string }> {
  try {
    // Hash the flag for secure storage
    const flagHash = hashPassword(challenge.flag.toLowerCase().trim());

    const { data, error } = await supabaseAdmin
      .from('security_challenges')
      .insert({
        title: challenge.title,
        description: challenge.description,
        category: challenge.category,
        difficulty: challenge.difficulty,
        points: challenge.points,
        flag_format: challenge.flag_format,
        flag_hash: flagHash,
        hints: challenge.hints,
        files: challenge.files,
        docker_image: challenge.docker_image,
        is_active: challenge.is_active,
        max_attempts: challenge.max_attempts,
        time_limit: challenge.time_limit,
        created_by: createdBy
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating security challenge:', error);
      return { success: false, error: 'Failed to create challenge' };
    }

    // Log the challenge creation
    await logSecurityEvent({
      user_id: createdBy,
      event_type: 'challenge_created',
      event_category: 'admin',
      severity: 'info',
      resource_accessed: `/challenges/${data.id}`,
      action_details: {
        challenge_id: data.id,
        title: challenge.title,
        category: challenge.category,
        difficulty: challenge.difficulty
      },
      success: true
    });

    return { success: true, challenge: data };

  } catch (error) {
    console.error('Error in createSecurityChallenge:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Get all available security challenges
 */
export async function getSecurityChallenges(options: {
  category?: string;
  difficulty?: string;
  is_active?: boolean;
  user_id?: string; // To include user's progress
}): Promise<Array<SecurityChallenge & { user_solved?: boolean; user_attempts?: number }>> {
  try {
    let query = supabaseAdmin
      .from('security_challenges')
      .select('*');

    // Apply filters
    if (options.category) {
      query = query.eq('category', options.category);
    }
    if (options.difficulty) {
      query = query.eq('difficulty', options.difficulty);
    }
    if (options.is_active !== undefined) {
      query = query.eq('is_active', options.is_active);
    }

    query = query.order('created_at', { ascending: false });

    const { data: challenges, error } = await query;

    if (error) {
      console.error('Error fetching security challenges:', error);
      return [];
    }

    if (!challenges) return [];

    // If user_id is provided, get user's progress
    if (options.user_id) {
      const { data: attempts } = await supabaseAdmin
        .from('challenge_attempts')
        .select('challenge_id, is_correct')
        .eq('user_id', options.user_id);

      const userProgress = new Map<string, { solved: boolean; attempts: number }>();
      
      if (attempts) {
        attempts.forEach(attempt => {
          const current = userProgress.get(attempt.challenge_id) || { solved: false, attempts: 0 };
          current.attempts++;
          if (attempt.is_correct) current.solved = true;
          userProgress.set(attempt.challenge_id, current);
        });
      }

      return challenges.map(challenge => ({
        ...challenge,
        user_solved: userProgress.get(challenge.id)?.solved || false,
        user_attempts: userProgress.get(challenge.id)?.attempts || 0
      }));
    }

    return challenges;

  } catch (error) {
    console.error('Error in getSecurityChallenges:', error);
    return [];
  }
}

/**
 * Submit a flag for a security challenge
 */
export async function submitChallengeFlag(
  challengeId: string,
  userId: string,
  submittedFlag: string,
  sourceIp?: string,
  userAgent?: string
): Promise<{ 
  success: boolean; 
  correct?: boolean; 
  points_awarded?: number; 
  message?: string; 
  error?: string 
}> {
  try {
    // Get the challenge
    const { data: challenge, error: challengeError } = await supabaseAdmin
      .from('security_challenges')
      .select('*')
      .eq('id', challengeId)
      .eq('is_active', true)
      .single();

    if (challengeError || !challenge) {
      return { success: false, error: 'Challenge not found or inactive' };
    }

    // Check if user has exceeded max attempts
    if (challenge.max_attempts > 0) {
      const { data: previousAttempts } = await supabaseAdmin
        .from('challenge_attempts')
        .select('id')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId);

      if (previousAttempts && previousAttempts.length >= challenge.max_attempts) {
        return { 
          success: false, 
          error: `Maximum attempts (${challenge.max_attempts}) exceeded for this challenge` 
        };
      }
    }

    // Check if user has already solved this challenge
    const { data: solvedAttempt } = await supabaseAdmin
      .from('challenge_attempts')
      .select('id')
      .eq('challenge_id', challengeId)
      .eq('user_id', userId)
      .eq('is_correct', true)
      .single();

    if (solvedAttempt) {
      return { 
        success: false, 
        error: 'You have already solved this challenge' 
      };
    }

    // Verify the flag
    const isCorrect = verifyPassword(submittedFlag.toLowerCase().trim(), challenge.flag_hash);
    
    let pointsAwarded = 0;
    if (isCorrect) {
      // Calculate points (could be reduced based on hints used, time taken, etc.)
      pointsAwarded = challenge.points;
    }

    // Record the attempt
    const { error: attemptError } = await supabaseAdmin
      .from('challenge_attempts')
      .insert({
        challenge_id: challengeId,
        user_id: userId,
        submitted_flag: submittedFlag,
        is_correct: isCorrect,
        points_awarded: pointsAwarded,
        hint_penalties: 0, // TODO: Calculate based on hints used
        submission_details: {
          source_ip: sourceIp,
          user_agent: userAgent,
          timestamp: new Date().toISOString()
        }
      });

    if (attemptError) {
      console.error('Error recording challenge attempt:', attemptError);
      return { success: false, error: 'Failed to record attempt' };
    }

    // Log the security event
    await logSecurityEvent({
      user_id: userId,
      event_type: isCorrect ? 'challenge_solved' : 'challenge_attempt_failed',
      event_category: 'security',
      severity: 'info',
      source_ip: sourceIp,
      user_agent: userAgent,
      resource_accessed: `/challenges/${challengeId}`,
      action_details: {
        challenge_id: challengeId,
        challenge_title: challenge.title,
        challenge_category: challenge.category,
        points_awarded: pointsAwarded,
        submitted_flag_length: submittedFlag.length
      },
      success: isCorrect
    });

    return {
      success: true,
      correct: isCorrect,
      points_awarded: pointsAwarded,
      message: isCorrect 
        ? `Congratulations! You solved the challenge and earned ${pointsAwarded} points!`
        : 'Incorrect flag. Try again!'
    };

  } catch (error) {
    console.error('Error in submitChallengeFlag:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Get user's challenge statistics and leaderboard position
 */
export async function getUserChallengeStats(userId: string): Promise<{
  total_solved: number;
  total_points: number;
  challenges_by_category: Record<string, number>;
  challenges_by_difficulty: Record<string, number>;
  recent_solves: Array<{
    challenge_id: string;
    challenge_title: string;
    points_awarded: number;
    solved_at: string;
  }>;
  leaderboard_position?: number;
}> {
  try {
    // Get user's successful attempts
    const { data: solvedChallenges } = await supabaseAdmin
      .from('challenge_attempts')
      .select(`
        challenge_id,
        points_awarded,
        created_at,
        security_challenges (
          title,
          category,
          difficulty
        )
      `)
      .eq('user_id', userId)
      .eq('is_correct', true)
      .order('created_at', { ascending: false });

    if (!solvedChallenges) {
      return {
        total_solved: 0,
        total_points: 0,
        challenges_by_category: {},
        challenges_by_difficulty: {},
        recent_solves: []
      };
    }

    const totalSolved = solvedChallenges.length;
    const totalPoints = solvedChallenges.reduce((sum, attempt) => sum + attempt.points_awarded, 0);

    // Group by category and difficulty
    const byCategory: Record<string, number> = {};
    const byDifficulty: Record<string, number> = {};

    solvedChallenges.forEach(attempt => {
      const challenge = attempt.security_challenges as any;
      if (challenge) {
        byCategory[challenge.category] = (byCategory[challenge.category] || 0) + 1;
        byDifficulty[challenge.difficulty] = (byDifficulty[challenge.difficulty] || 0) + 1;
      }
    });

    // Recent solves (last 10)
    const recentSolves = solvedChallenges.slice(0, 10).map(attempt => ({
      challenge_id: attempt.challenge_id,
      challenge_title: (attempt.security_challenges as any)?.title || 'Unknown',
      points_awarded: attempt.points_awarded,
      solved_at: attempt.created_at
    }));

    // Get leaderboard position
    const { data: leaderboard } = await supabaseAdmin
      .from('challenge_attempts')
      .select('user_id, points_awarded')
      .eq('is_correct', true);

    let leaderboardPosition;
    if (leaderboard) {
      const userTotals = new Map<string, number>();
      leaderboard.forEach(attempt => {
        const current = userTotals.get(attempt.user_id) || 0;
        userTotals.set(attempt.user_id, current + attempt.points_awarded);
      });

      const sortedUsers = Array.from(userTotals.entries())
        .sort(([,a], [,b]) => b - a);
      
      leaderboardPosition = sortedUsers.findIndex(([id]) => id === userId) + 1;
    }

    return {
      total_solved: totalSolved,
      total_points: totalPoints,
      challenges_by_category: byCategory,
      challenges_by_difficulty: byDifficulty,
      recent_solves: recentSolves,
      leaderboard_position: leaderboardPosition || undefined
    };

  } catch (error) {
    console.error('Error in getUserChallengeStats:', error);
    return {
      total_solved: 0,
      total_points: 0,
      challenges_by_category: {},
      challenges_by_difficulty: {},
      recent_solves: []
    };
  }
}

/**
 * Get global leaderboard
 */
export async function getChallengeLeaderboard(limit: number = 50): Promise<Array<{
  user_id: string;
  username: string;
  total_points: number;
  challenges_solved: number;
  last_solve: string;
}>> {
  try {
    const { data: attempts } = await supabaseAdmin
      .from('challenge_attempts')
      .select(`
        user_id,
        points_awarded,
        created_at,
        users (
          username
        )
      `)
      .eq('is_correct', true);

    if (!attempts) return [];

    // Aggregate user statistics
    const userStats = new Map<string, {
      username: string;
      total_points: number;
      challenges_solved: number;
      last_solve: string;
    }>();

    attempts.forEach(attempt => {
      const userId = attempt.user_id;
      const username = (attempt.users as any)?.username || 'Unknown';
      
      const current = userStats.get(userId) || {
        username,
        total_points: 0,
        challenges_solved: 0,
        last_solve: attempt.created_at
      };

      current.total_points += attempt.points_awarded;
      current.challenges_solved += 1;
      
      if (new Date(attempt.created_at) > new Date(current.last_solve)) {
        current.last_solve = attempt.created_at;
      }

      userStats.set(userId, current);
    });

    // Convert to array and sort by points
    return Array.from(userStats.entries())
      .map(([user_id, stats]) => ({
        user_id,
        ...stats
      }))
      .sort((a, b) => b.total_points - a.total_points)
      .slice(0, limit);

  } catch (error) {
    console.error('Error in getChallengeLeaderboard:', error);
    return [];
  }
}
