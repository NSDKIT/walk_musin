import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, UserProfile, WalkingData, SunoTrack, AppSettings, EnvironmentData } from '../types';
import { sunoApi, SunoApiError } from '../services/sunoApi';
import { weatherApi } from '../services/weatherApi';
import { database } from '../services/database';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  startWalk: () => void;
  stopWalk: () => void;
  generateMusic: (walkData: WalkingData, location?: { lat: number; lon: number }) => Promise<void>;
  addToFavorites: (trackId: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  checkCompletedTracks: () => Promise<void>;
}

type AppAction =
  | { type: 'SET_USER'; payload: UserProfile | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'START_WALK'; payload: WalkingData }
  | { type: 'UPDATE_WALK'; payload: Partial<WalkingData> }
  | { type: 'STOP_WALK'; payload: WalkingData }
  | { type: 'SET_TRACKS'; payload: SunoTrack[] }
  | { type: 'ADD_TRACK'; payload: SunoTrack }
  | { type: 'UPDATE_TRACK'; payload: { id: string; updates: Partial<SunoTrack> } }
  | { type: 'SET_FAVORITES'; payload: string[] }
  | { type: 'ADD_XP'; payload: number }
  | { type: 'UNLOCK_BADGE'; payload: string }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'LOAD_STATE'; payload: Partial<AppState> }
  | { type: 'SET_ERROR'; payload: string | null };

const initialUser: UserProfile = {
  id: 'user-1',
  name: 'ウォーカー',
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  totalWalks: 0,
  totalDistance: 0,
  totalDuration: 0,
  totalTracks: 0,
  badges: [],
  titles: [],
  joinDate: new Date(),
  streakDays: 0,
};

const initialSettings: AppSettings = {
  autoGenerate: true,
  musicDuration: 60,
  preferredGenres: ['acoustic', 'electronic', 'pop'],
  notificationsEnabled: true,
  darkMode: false,
  language: 'ja',
  trackingAccuracy: 'high',
};

const initialState: AppState = {
  user: initialUser,
  isWalking: false,
  tracks: [],
  favorites: [],
  settings: initialSettings,
  isLoading: false,
  isAuthenticated: false,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload || initialUser,
        isAuthenticated: !!action.payload,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    case 'START_WALK':
      return {
        ...state,
        isWalking: true,
        currentWalk: action.payload,
        error: null,
      };

    case 'UPDATE_WALK':
      return {
        ...state,
        currentWalk: state.currentWalk ? { ...state.currentWalk, ...action.payload } : undefined,
      };

    case 'STOP_WALK':
      const completedWalk = action.payload;
      const xpGained = Math.floor(completedWalk.distance / 100) + Math.floor(completedWalk.duration / 300);
      
      return {
        ...state,
        isWalking: false,
        currentWalk: undefined,
        user: {
          ...state.user,
          totalWalks: state.user.totalWalks + 1,
          totalDistance: state.user.totalDistance + completedWalk.distance,
          totalDuration: state.user.totalDuration + completedWalk.duration,
          xp: state.user.xp + xpGained,
          lastWalkDate: new Date(),
        },
      };

    case 'SET_TRACKS':
      return {
        ...state,
        tracks: action.payload,
      };

    case 'ADD_TRACK':
      return {
        ...state,
        tracks: [action.payload, ...state.tracks],
        user: {
          ...state.user,
          totalTracks: state.user.totalTracks + 1,
        },
      };

    case 'UPDATE_TRACK':
      return {
        ...state,
        tracks: state.tracks.map(track =>
          track.id === action.payload.id ? { ...track, ...action.payload.updates } : track
        ),
      };

    case 'SET_FAVORITES':
      return {
        ...state,
        favorites: action.payload,
      };

    case 'ADD_XP':
      const newXp = state.user.xp + action.payload;
      const currentLevel = state.user.level;
      const newLevel = Math.floor(newXp / 100) + 1;
      
      return {
        ...state,
        user: {
          ...state.user,
          xp: newXp,
          level: newLevel,
          xpToNextLevel: (newLevel * 100) - newXp,
        },
      };

    case 'TOGGLE_FAVORITE':
      const isFavorite = state.favorites.includes(action.payload);
      return {
        ...state,
        favorites: isFavorite
          ? state.favorites.filter(id => id !== action.payload)
          : [...state.favorites, action.payload],
      };

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };

    case 'LOAD_STATE':
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize app data
  useEffect(() => {
    initializeApp();
  }, []);

  // Listen for auth changes
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await loadUserData();
      } else if (event === 'SIGNED_OUT') {
        dispatch({ type: 'SET_USER', payload: null });
        dispatch({ type: 'SET_TRACKS', payload: [] });
        dispatch({ type: 'SET_FAVORITES', payload: [] });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Periodic check for completed tracks (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      checkCompletedTracks();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const initializeApp = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      if (isSupabaseConfigured) {
        // Check if user is already signed in
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await loadUserData();
        }
      } else {
        // Load from localStorage if Supabase is not configured
        loadLocalData();
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
      loadLocalData(); // Fallback to local data
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadUserData = async () => {
    try {
      const [user, tracks, favorites] = await Promise.all([
        database.getCurrentUser(),
        database.getMusicTracks(),
        database.getFavoriteTrackIds(),
      ]);

      if (user) {
        dispatch({ type: 'SET_USER', payload: user });
        dispatch({ type: 'SET_TRACKS', payload: tracks });
        dispatch({ type: 'SET_FAVORITES', payload: favorites });
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const loadLocalData = () => {
    const savedState = localStorage.getItem('walkingMusicApp');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // Convert date strings back to Date objects
        if (parsed.user?.joinDate) {
          parsed.user.joinDate = new Date(parsed.user.joinDate);
        }
        if (parsed.user?.lastWalkDate) {
          parsed.user.lastWalkDate = new Date(parsed.user.lastWalkDate);
        }
        if (parsed.tracks) {
          parsed.tracks = parsed.tracks.map((track: any) => ({
            ...track,
            createdAt: new Date(track.createdAt),
            walkingData: {
              ...track.walkingData,
              startTime: new Date(track.walkingData.startTime),
              endTime: track.walkingData.endTime ? new Date(track.walkingData.endTime) : undefined,
            },
          }));
        }
        dispatch({ type: 'LOAD_STATE', payload: parsed });
      } catch (error) {
        console.error('Failed to load saved state:', error);
      }
    }
  };

  // Save state to localStorage when not using Supabase
  useEffect(() => {
    if (!isSupabaseConfigured) {
      localStorage.setItem('walkingMusicApp', JSON.stringify(state));
    }
  }, [state]);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signUp = async (email: string, password: string, name: string) => {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured');

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) throw error;
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const startWalk = () => {
    const newWalk: WalkingData = {
      id: `walk-${Date.now()}`,
      startTime: new Date(),
      duration: 0,
      distance: 0,
      speed: 0,
      avgSpeed: 0,
      maxSpeed: 0,
      steps: 0,
      calories: 0,
      positions: [],
      elevationGain: 0,
      elevationLoss: 0,
    };
    dispatch({ type: 'START_WALK', payload: newWalk });
  };

  const stopWalk = async () => {
    if (state.currentWalk) {
      const endTime = new Date();
      const finalWalk: WalkingData = {
        ...state.currentWalk,
        endTime,
        duration: Math.floor((endTime.getTime() - state.currentWalk.startTime.getTime()) / 1000),
      };
      
      dispatch({ type: 'STOP_WALK', payload: finalWalk });

      // Save to database if configured
      if (isSupabaseConfigured && state.isAuthenticated) {
        try {
          await database.saveWalkingSession(finalWalk);
          await database.updateUser(state.user);
        } catch (error) {
          console.error('Failed to save walking session:', error);
        }
      }
    }
  };

  const generateMusic = async (walkData: WalkingData, location?: { lat: number; lon: number }) => {
    try {
      console.log('Starting music generation for walk:', walkData);
      dispatch({ type: 'SET_ERROR', payload: null });

      // Get weather data if location is available
      let weatherData = {
        condition: 'clear',
        temperature: 22,
        humidity: 60,
        windSpeed: 5,
        description: '晴れ',
        icon: '01d',
      };

      if (location) {
        try {
          weatherData = await weatherApi.getCurrentWeather(location.lat, location.lon);
          console.log('Weather data retrieved:', weatherData);
        } catch (error) {
          console.warn('Failed to fetch weather data, using defaults:', error);
        }
      }

      // Create environment data
      const environmentData: EnvironmentData = {
        timeOfDay: getTimeOfDay(),
        weather: weatherData,
        location: {
          type: 'park', // This could be enhanced with reverse geocoding
          name: '現在地',
        },
        season: getCurrentSeason(),
      };

      // Generate prompt
      const prompt = generateSunoPrompt(walkData, environmentData);
      console.log('Generated prompt:', prompt);

      // Determine style based on environment
      const style = getStyleFromEnvironment(environmentData);
      const isInstrumental = state.settings.preferredGenres.includes('instrumental');

      // Create initial track with "generating" status
      const trackId = `track-${Date.now()}`;
      const initialTrack: SunoTrack = {
        id: trackId,
        title: `ウォーキングトラック ${new Date().toLocaleDateString('ja-JP')}`,
        prompt,
        duration: state.settings.musicDuration,
        genre: style.toLowerCase(),
        mood: 'uplifting',
        bpm: Math.round(walkData.avgSpeed * 20),
        status: 'generating',
        createdAt: new Date(),
        walkingData: walkData,
        environmentData,
        tags: ['walking', 'generated', getTimeOfDay()],
      };

      dispatch({ type: 'ADD_TRACK', payload: initialTrack });
      dispatch({ type: 'ADD_XP', payload: 50 });

      // Save to database if configured
      let walkingSessionId = walkData.id;
      if (isSupabaseConfigured && state.isAuthenticated) {
        try {
          walkingSessionId = await database.saveWalkingSession(walkData);
          await database.saveMusicTrack(initialTrack, walkingSessionId);
        } catch (error) {
          console.error('Failed to save to database:', error);
        }
      }

      // Send generation request to Suno API
      try {
        console.log('Calling Suno API with:', { prompt, isInstrumental });
        
        const sunoResponse = await sunoApi.generateMusic(prompt, {
          instrumental: isInstrumental,
          title: initialTrack.title,
        });
        
        console.log('Suno API response:', sunoResponse);
        
        if (sunoResponse && sunoResponse.length > 0) {
          // The localhost API returns multiple tracks, we'll use the first one
          const sunoTrack = sunoResponse[0];
          
          if (!sunoTrack || !sunoTrack.id) {
            console.error('Suno API response missing valid ID:', sunoTrack);
            
            const updates = { status: 'failed' as const };
            dispatch({
              type: 'UPDATE_TRACK',
              payload: {
                id: trackId,
                updates,
              },
            });

            if (isSupabaseConfigured && state.isAuthenticated) {
              await database.updateMusicTrack(trackId, updates);
            }
            return;
          }
          
          // Update track with Suno track ID and initial data
          const updates = {
            title: sunoTrack.title || initialTrack.title,
            jobId: sunoTrack.id,
            // Check if audio is already available
            ...(sunoTrack.audio_url && {
              status: 'completed' as const,
              audioUrl: sunoTrack.audio_url,
              imageUrl: sunoTrack.image_url,
            }),
          };

          console.log('Updating track with Suno data:', updates);

          dispatch({
            type: 'UPDATE_TRACK',
            payload: {
              id: trackId,
              updates,
            },
          });

          // Update in database
          if (isSupabaseConfigured && state.isAuthenticated) {
            try {
              await database.updateMusicTrack(trackId, updates);
            } catch (error) {
              console.error('Failed to update track in database:', error);
            }
          }

          // If audio is not ready yet, start polling
          if (!sunoTrack.audio_url) {
            console.log('Audio not ready yet, will check status periodically');
          } else {
            console.log('Music generation completed immediately!');
          }
        } else {
          console.error('Suno API returned empty or invalid response');
          
          const updates = { status: 'failed' as const };
          dispatch({
            type: 'UPDATE_TRACK',
            payload: {
              id: trackId,
              updates,
            },
          });

          if (isSupabaseConfigured && state.isAuthenticated) {
            await database.updateMusicTrack(trackId, updates);
          }
        }
      } catch (error) {
        console.error('Suno API error:', error);
        
        // Handle specific Suno API errors
        if (error instanceof SunoApiError) {
          let userMessage = 'Music generation failed. ';
          
          if (error.isCreditsError) {
            userMessage = 'Insufficient credits available. Please check your Suno API account.';
          } else if (error.isConfigError) {
            userMessage = 'Suno API connection error. Please make sure the local server is running on localhost:3000.';
          } else {
            userMessage += error.message;
          }
          
          dispatch({ type: 'SET_ERROR', payload: userMessage });
        } else {
          dispatch({ type: 'SET_ERROR', payload: 'An unexpected error occurred during music generation.' });
        }
        
        // Update track status to failed
        const updates = { status: 'failed' as const };
        dispatch({
          type: 'UPDATE_TRACK',
          payload: {
            id: trackId,
            updates,
          },
        });

        // Update in database
        if (isSupabaseConfigured && state.isAuthenticated) {
          database.updateMusicTrack(trackId, updates).catch(console.error);
        }
      }
    } catch (error) {
      console.error('Music generation error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to start music generation. Please try again.' });
    }
  };

  const checkCompletedTracks = async () => {
    try {
      console.log('Checking for completed tracks...');
      
      // Only check individual generating tracks with valid job IDs
      const generatingTracks = state.tracks.filter(track => 
        track.status === 'generating' && track.jobId && track.jobId !== 'undefined'
      );
      
      if (generatingTracks.length === 0) {
        console.log('No generating tracks with valid job IDs to check');
        return;
      }

      console.log(`Found ${generatingTracks.length} generating tracks to check`);
      
      // Check each generating track individually
      for (const track of generatingTracks) {
        try {
          console.log(`Checking status for track ${track.id} with job ID ${track.jobId}`);
          
          const statusResponse = await sunoApi.getGenerationStatus([track.jobId!]);
          console.log(`Status response for track ${track.id}:`, statusResponse);
          
          if (statusResponse && statusResponse.length > 0) {
            const sunoTrack = statusResponse[0];
            
            // Check if the track is completed
            if (sunoTrack.status === 'complete' && sunoTrack.audio_url) {
              console.log('Track completed:', track.id, sunoTrack);
              
              const updates = {
                status: 'completed' as const,
                audioUrl: sunoTrack.audio_url,
                imageUrl: sunoTrack.image_url,
                title: sunoTrack.title || track.title,
              };

              dispatch({
                type: 'UPDATE_TRACK',
                payload: {
                  id: track.id,
                  updates,
                },
              });

              // Update in database
              if (isSupabaseConfigured && state.isAuthenticated) {
                try {
                  await database.updateMusicTrack(track.id, updates);
                } catch (error) {
                  console.error('Failed to update completed track in database:', error);
                }
              }

              console.log(`Track ${track.title} completed successfully!`);
            } else if (sunoTrack.status === 'error') {
              console.log('Track failed:', track.id, sunoTrack);
              
              const updates = { status: 'failed' as const };
              dispatch({
                type: 'UPDATE_TRACK',
                payload: {
                  id: track.id,
                  updates,
                },
              });

              // Update in database
              if (isSupabaseConfigured && state.isAuthenticated) {
                try {
                  await database.updateMusicTrack(track.id, updates);
                } catch (error) {
                  console.error('Failed to update failed track in database:', error);
                }
              }
            }
            // If status is still 'generating', keep checking
          }
        } catch (error) {
          console.error(`Failed to check status for track ${track.id}:`, error);
          // Continue checking other tracks even if one fails
        }
      }
      
    } catch (error) {
      console.error('Failed to check completed tracks:', error);
      // Don't show error to user for background checks
    }
  };

  const addToFavorites = async (trackId: string) => {
    dispatch({ type: 'TOGGLE_FAVORITE', payload: trackId });

    // Update in database if configured
    if (isSupabaseConfigured && state.isAuthenticated) {
      try {
        await database.toggleFavorite(trackId);
      } catch (error) {
        console.error('Failed to toggle favorite in database:', error);
        // Revert the change
        dispatch({ type: 'TOGGLE_FAVORITE', payload: trackId });
      }
    }
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });
  };

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      startWalk,
      stopWalk,
      generateMusic,
      addToFavorites,
      updateSettings,
      signIn,
      signUp,
      signOut,
      clearError,
      checkCompletedTracks,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Helper functions
function generateSunoPrompt(walkData: WalkingData, environmentData: EnvironmentData): string {
  const { avgSpeed, duration } = walkData;
  const { timeOfDay, weather, location } = environmentData;
  
  let prompt = "Create ";
  
  // Energy level based on speed
  if (avgSpeed < 3) prompt += "relaxed, peaceful ";
  else if (avgSpeed > 5) prompt += "energetic, upbeat ";
  else prompt += "steady, moderate ";
  
  // Time of day characteristics
  const timeDescriptors = {
    morning: "bright morning ",
    afternoon: "warm afternoon ",
    evening: "golden sunset ",
    night: "calm nighttime "
  };
  prompt += timeDescriptors[timeOfDay];
  
  // Location characteristics
  const locationDescriptors = {
    park: "nature-inspired with bird sounds, ",
    urban: "city-vibe with urban rhythm, ",
    residential: "peaceful neighborhood, ",
    station: "commuter-friendly, ",
    commercial: "shopping district energy, ",
    nature: "wilderness adventure, "
  };
  prompt += locationDescriptors[location.type];
  
  // BPM calculation (walking speed × 20)
  const bpm = Math.round(avgSpeed * 20);
  prompt += `music at ${bpm} BPM for walking, inspiring and motivational`;
  
  // Weather elements
  if (weather.condition === 'rain') prompt += ", with gentle rain ambience";
  if (weather.condition === 'clear') prompt += ", bright and cheerful";
  if (weather.condition === 'clouds') prompt += ", mellow and contemplative";
  
  // Duration consideration
  if (duration > 1800) prompt += ", epic and adventurous"; // 30+ minutes
  else if (duration < 600) prompt += ", short and energizing"; // <10 minutes
  
  return prompt;
}

function getStyleFromEnvironment(environmentData: EnvironmentData): string {
  const { timeOfDay, weather, location } = environmentData;
  
  // Base style on location and time
  if (location.type === 'nature' || location.type === 'park') {
    return 'Acoustic';
  }
  
  if (location.type === 'urban' || location.type === 'commercial') {
    return timeOfDay === 'night' ? 'Electronic' : 'Pop';
  }
  
  if (timeOfDay === 'morning') {
    return 'Classical';
  }
  
  if (weather.condition === 'rain') {
    return 'Ambient';
  }
  
  return 'Acoustic'; // Default
}

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function getCurrentSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}