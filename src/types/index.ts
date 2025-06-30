export interface UserProfile {
  id: string;
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalWalks: number;
  totalDistance: number;
  totalDuration: number;
  totalTracks: number;
  badges: string[];
  titles: string[];
  joinDate: Date;
  streakDays: number;
  lastWalkDate?: Date;
}

export interface WalkingData {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  distance: number; // in meters
  speed: number; // current speed in km/h
  avgSpeed: number; // average speed in km/h
  maxSpeed: number; // max speed in km/h
  steps: number;
  calories: number;
  positions: Position[];
  elevationGain: number;
  elevationLoss: number;
}

export interface Position {
  lat: number;
  lng: number;
  timestamp: Date;
  accuracy?: number;
  altitude?: number;
}

export interface SunoTrack {
  id: string;
  title: string;
  prompt: string;
  duration: number;
  genre: string;
  mood: string;
  bpm: number;
  audioUrl?: string;
  imageUrl?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  jobId?: string;
  createdAt: Date;
  walkingData: WalkingData;
  environmentData?: EnvironmentData;
  tags: string[];
  isFavorite?: boolean;
}

export interface EnvironmentData {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  weather: {
    condition: string;
    temperature: number;
    humidity: number;
    windSpeed: number;
    description: string;
    icon: string;
  };
  location: {
    type: 'park' | 'urban' | 'residential' | 'station' | 'commercial' | 'nature';
    name: string;
  };
  season: 'spring' | 'summer' | 'autumn' | 'winter';
}

export interface AppSettings {
  autoGenerate: boolean;
  musicDuration: number;
  preferredGenres: string[];
  notificationsEnabled: boolean;
  darkMode: boolean;
  language: string;
  trackingAccuracy: 'low' | 'medium' | 'high';
}

export interface AppState {
  user: UserProfile;
  isWalking: boolean;
  currentWalk?: WalkingData;
  tracks: SunoTrack[];
  favorites: string[];
  settings: AppSettings;
  isLoading: boolean;
  isAuthenticated: boolean;
  error?: string | null;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

export interface SharedTrack {
  id: string;
  trackId: string;
  userId: string;
  title: string;
  audioUrl: string;
  imageUrl?: string;
  genre: string;
  bpm: number;
  duration: number;
  sharedBy: string;
  downloadCount: number;
  likes: number;
  isPublic: boolean;
  sharedAt: Date;
  createdAt: Date;
}