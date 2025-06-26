import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { WalkingData, SunoTrack, UserProfile, Badge } from '../types';
import { Database } from '../types/database';

type Tables = Database['public']['Tables'];
type UserRow = Tables['users']['Row'];
type WalkingSessionRow = Tables['walking_sessions']['Row'];
type MusicTrackRow = Tables['music_tracks']['Row'];
type BadgeRow = Tables['badges']['Row'];
type UserBadgeRow = Tables['user_badges']['Row'];

class DatabaseService {
  async getCurrentUser(): Promise<UserProfile | null> {
    if (!isSupabaseConfigured) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // User doesn't exist, create one
          return await this.createUser(user.id, user.email || '', user.user_metadata?.name || 'ウォーカー');
        }
        throw error;
      }

      return this.mapUserRowToProfile(data);
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  async createUser(id: string, email: string, name: string): Promise<UserProfile> {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('users')
      .insert({
        id,
        email,
        name,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapUserRowToProfile(data);
  }

  async updateUser(updates: Partial<UserProfile>): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('users')
      .update({
        name: updates.name,
        level: updates.level,
        xp: updates.xp,
        total_walks: updates.totalWalks,
        total_distance: updates.totalDistance,
        total_duration: updates.totalDuration,
        total_tracks: updates.totalTracks,
        streak_days: updates.streakDays,
        current_title: updates.currentTitle,
        last_walk_date: updates.lastWalkDate?.toISOString(),
      })
      .eq('id', user.id);

    if (error) throw error;
  }

  async saveWalkingSession(walkData: WalkingData): Promise<string> {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('walking_sessions')
      .insert({
        user_id: user.id,
        start_time: walkData.startTime.toISOString(),
        end_time: walkData.endTime?.toISOString(),
        duration: walkData.duration,
        distance: walkData.distance,
        avg_speed: walkData.avgSpeed,
        max_speed: walkData.maxSpeed,
        steps: walkData.steps,
        calories: walkData.calories,
        elevation_gain: walkData.elevationGain,
        elevation_loss: walkData.elevationLoss,
        gps_data: walkData.positions,
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  }

  async getWalkingSessions(limit = 50): Promise<WalkingData[]> {
    if (!isSupabaseConfigured) return [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('walking_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data.map(this.mapWalkingSessionRowToData);
  }

  async saveMusicTrack(track: SunoTrack, walkingSessionId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('music_tracks')
      .insert({
        id: track.id,
        user_id: user.id,
        walking_session_id: walkingSessionId,
        title: track.title,
        prompt: track.prompt,
        duration: track.duration,
        genre: track.genre,
        mood: track.mood,
        bpm: track.bpm,
        audio_url: track.audioUrl,
        image_url: track.imageUrl,
        status: track.status,
        suno_job_id: track.jobId,
        environment_data: track.environmentData,
        tags: track.tags,
        is_favorite: false,
      });

    if (error) throw error;
  }

  async updateMusicTrack(trackId: string, updates: Partial<SunoTrack>): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('music_tracks')
      .update({
        title: updates.title,
        audio_url: updates.audioUrl,
        image_url: updates.imageUrl,
        status: updates.status,
        suno_job_id: updates.jobId,
      })
      .eq('id', trackId);

    if (error) throw error;
  }

  async getMusicTracks(limit = 100): Promise<SunoTrack[]> {
    if (!isSupabaseConfigured) return [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('music_tracks')
      .select(`
        *,
        walking_sessions!inner(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data.map(this.mapMusicTrackRowToTrack);
  }

  async toggleFavorite(trackId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get current favorite status
    const { data: track, error: fetchError } = await supabase
      .from('music_tracks')
      .select('is_favorite')
      .eq('id', trackId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) throw fetchError;

    // Toggle favorite status
    const { error } = await supabase
      .from('music_tracks')
      .update({ is_favorite: !track.is_favorite })
      .eq('id', trackId)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  async getFavoriteTrackIds(): Promise<string[]> {
    if (!isSupabaseConfigured) return [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('music_tracks')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_favorite', true);

    if (error) throw error;
    return data.map(track => track.id);
  }

  async getUserBadges(): Promise<Badge[]> {
    if (!isSupabaseConfigured) return [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        *,
        badges!inner(*)
      `)
      .eq('user_id', user.id);

    if (error) throw error;
    return data.map(userBadge => this.mapBadgeRowToBadge(userBadge.badges, userBadge));
  }

  async getAllBadges(): Promise<Badge[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .order('rarity', { ascending: true });

    if (error) throw error;
    return data.map(badge => this.mapBadgeRowToBadge(badge));
  }

  // Helper methods to map database rows to application types
  private mapUserRowToProfile(row: UserRow): UserProfile {
    return {
      id: row.id,
      name: row.name,
      level: row.level,
      xp: row.xp,
      xpToNextLevel: (row.level * 100) - row.xp,
      totalWalks: row.total_walks,
      totalDistance: row.total_distance,
      totalDuration: row.total_duration,
      totalTracks: row.total_tracks,
      badges: [], // Will be loaded separately
      titles: [], // Will be loaded separately
      currentTitle: row.current_title || undefined,
      joinDate: new Date(row.created_at),
      streakDays: row.streak_days,
      lastWalkDate: row.last_walk_date ? new Date(row.last_walk_date) : undefined,
    };
  }

  private mapWalkingSessionRowToData(row: WalkingSessionRow): WalkingData {
    return {
      id: row.id,
      startTime: new Date(row.start_time),
      endTime: row.end_time ? new Date(row.end_time) : undefined,
      duration: row.duration,
      distance: row.distance,
      speed: 0, // Current speed not stored
      avgSpeed: row.avg_speed,
      maxSpeed: row.max_speed,
      steps: row.steps,
      calories: row.calories,
      positions: row.gps_data as GeolocationPosition[],
      elevationGain: row.elevation_gain,
      elevationLoss: row.elevation_loss,
    };
  }

  private mapMusicTrackRowToTrack(row: MusicTrackRow & { walking_sessions: WalkingSessionRow }): SunoTrack {
    return {
      id: row.id,
      title: row.title,
      prompt: row.prompt,
      duration: row.duration,
      genre: row.genre,
      mood: row.mood,
      bpm: row.bpm,
      audioUrl: row.audio_url || undefined,
      imageUrl: row.image_url || undefined,
      status: row.status as 'generating' | 'completed' | 'failed',
      jobId: row.suno_job_id || undefined,
      createdAt: new Date(row.created_at),
      walkingData: this.mapWalkingSessionRowToData(row.walking_sessions),
      environmentData: row.environment_data,
      tags: row.tags,
    };
  }

  private mapBadgeRowToBadge(row: BadgeRow, userBadge?: UserBadgeRow): Badge {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      rarity: row.rarity as 'common' | 'rare' | 'epic' | 'legendary',
      unlockedAt: userBadge ? new Date(userBadge.unlocked_at) : undefined,
      progress: userBadge?.progress,
      maxProgress: userBadge?.max_progress,
    };
  }
}

export const database = new DatabaseService();