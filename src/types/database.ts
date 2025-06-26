export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          level: number;
          xp: number;
          total_walks: number;
          total_distance: number;
          total_duration: number;
          total_tracks: number;
          streak_days: number;
          current_title: string | null;
          last_walk_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          level?: number;
          xp?: number;
          total_walks?: number;
          total_distance?: number;
          total_duration?: number;
          total_tracks?: number;
          streak_days?: number;
          current_title?: string | null;
          last_walk_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          level?: number;
          xp?: number;
          total_walks?: number;
          total_distance?: number;
          total_duration?: number;
          total_tracks?: number;
          streak_days?: number;
          current_title?: string | null;
          last_walk_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      walking_sessions: {
        Row: {
          id: string;
          user_id: string;
          start_time: string;
          end_time: string | null;
          duration: number;
          distance: number;
          avg_speed: number;
          max_speed: number;
          steps: number;
          calories: number;
          elevation_gain: number;
          elevation_loss: number;
          gps_data: any; // JSON array of positions
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          start_time: string;
          end_time?: string | null;
          duration: number;
          distance: number;
          avg_speed: number;
          max_speed: number;
          steps: number;
          calories: number;
          elevation_gain?: number;
          elevation_loss?: number;
          gps_data?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          start_time?: string;
          end_time?: string | null;
          duration?: number;
          distance?: number;
          avg_speed?: number;
          max_speed?: number;
          steps?: number;
          calories?: number;
          elevation_gain?: number;
          elevation_loss?: number;
          gps_data?: any;
          created_at?: string;
        };
      };
      music_tracks: {
        Row: {
          id: string;
          user_id: string;
          walking_session_id: string;
          title: string;
          prompt: string;
          duration: number;
          genre: string;
          mood: string;
          bpm: number;
          audio_url: string | null;
          image_url: string | null;
          status: 'generating' | 'completed' | 'failed';
          suno_job_id: string | null;
          environment_data: any; // JSON object
          tags: string[];
          is_favorite: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          walking_session_id: string;
          title: string;
          prompt: string;
          duration: number;
          genre: string;
          mood: string;
          bpm: number;
          audio_url?: string | null;
          image_url?: string | null;
          status?: 'generating' | 'completed' | 'failed';
          suno_job_id?: string | null;
          environment_data?: any;
          tags?: string[];
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          walking_session_id?: string;
          title?: string;
          prompt?: string;
          duration?: number;
          genre?: string;
          mood?: string;
          bpm?: number;
          audio_url?: string | null;
          image_url?: string | null;
          status?: 'generating' | 'completed' | 'failed';
          suno_job_id?: string | null;
          environment_data?: any;
          tags?: string[];
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          unlocked_at: string;
          progress: number;
          max_progress: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          badge_id: string;
          unlocked_at?: string;
          progress?: number;
          max_progress?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          badge_id?: string;
          unlocked_at?: string;
          progress?: number;
          max_progress?: number;
        };
      };
      badges: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon: string;
          rarity: 'common' | 'rare' | 'epic' | 'legendary';
          requirement: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          icon: string;
          rarity: 'common' | 'rare' | 'epic' | 'legendary';
          requirement: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          icon?: string;
          rarity?: 'common' | 'rare' | 'epic' | 'legendary';
          requirement?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}