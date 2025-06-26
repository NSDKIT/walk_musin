export interface SunoGenerateRequest {
  prompt: string;
  make_instrumental?: boolean;
  wait_audio?: boolean;
}

export interface SunoGenerateResponse {
  id: string;
  title: string;
  image_url?: string;
  lyric?: string;
  audio_url?: string;
  video_url?: string;
  created_at: string;
  model_name: string;
  status: string;
  gpt_description_prompt?: string;
  prompt?: string;
  type: string;
  tags?: string;
}

export class SunoApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public isCreditsError: boolean = false,
    public isConfigError: boolean = false
  ) {
    super(message);
    this.name = 'SunoApiError';
  }
}

class SunoApiService {
  private baseUrl = 'http://localhost:3000';

  constructor() {
    console.log('Suno API Service initialized with localhost:3000');
  }

  async generateMusic(prompt: string, options?: {
    style?: string;
    instrumental?: boolean;
    title?: string;
  }): Promise<SunoGenerateResponse[]> {
    try {
      const requestBody: SunoGenerateRequest = {
        prompt,
        make_instrumental: options?.instrumental ?? false,
        wait_audio: false, // Don't wait for audio, we'll poll for it
      };

      console.log('Sending request to Suno API:', {
        url: `${this.baseUrl}/api/generate`,
        body: requestBody
      });

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Suno API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Suno API error response:', errorText);
        
        if (response.status === 503) {
          throw new SunoApiError(
            'Suno API service is not available. Please make sure the local server is running on localhost:3000.',
            'SERVICE_UNAVAILABLE',
            false,
            true
          );
        }
        
        throw new SunoApiError(`Suno API error: ${response.status} - ${errorText}`, `HTTP_${response.status}`);
      }

      const data = await response.json();
      console.log('Suno API response data:', data);

      // The localhost API returns an array of tracks
      return Array.isArray(data) ? data : [data];

    } catch (error) {
      console.error('Suno API error:', error);
      if (error instanceof SunoApiError) {
        throw error;
      }
      
      // Check if it's a network error (server not running)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new SunoApiError(
          'Cannot connect to Suno API server. Please make sure the local server is running on localhost:3000.',
          'CONNECTION_ERROR',
          false,
          true
        );
      }
      
      throw new SunoApiError(`Network or unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'NETWORK_ERROR');
    }
  }

  /**
   * Get audio information for multiple track IDs
   */
  async getAudioInformation(audioIds: string[]): Promise<SunoGenerateResponse[]> {
    try {
      const ids = audioIds.join(',');
      console.log(`Fetching audio information for IDs: ${ids}`);
      
      const response = await fetch(`${this.baseUrl}/api/get?ids=${ids}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log(`Audio info response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Audio info API error: ${response.status} - ${errorText}`);
        return [];
      }

      const data = await response.json();
      console.log(`Audio info response data:`, data);

      return Array.isArray(data) ? data : [data];

    } catch (error) {
      console.error(`Audio info fetch error:`, error);
      return [];
    }
  }

  /**
   * Check status of multiple tracks using their IDs
   */
  async getGenerationStatus(ids: string[]): Promise<SunoGenerateResponse[]> {
    try {
      console.log('Checking generation status for IDs:', ids);
      
      // Use the audio information endpoint to check status
      const results = await this.getAudioInformation(ids);
      
      // Convert status to our standard format
      return results.map(track => ({
        ...track,
        status: this.convertStatusToStandard(track.status),
      }));

    } catch (error) {
      console.error('Failed to get generation status:', error);
      throw new SunoApiError(`Status check error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'STATUS_ERROR');
    }
  }

  /**
   * Convert localhost API status to standard status format
   */
  private convertStatusToStandard(status: string): string {
    switch (status.toLowerCase()) {
      case 'streaming':
      case 'complete':
      case 'completed':
        return 'complete';
      case 'pending':
      case 'processing':
      case 'generating':
        return 'generating';
      case 'error':
      case 'failed':
        return 'error';
      default:
        return 'generating';
    }
  }

  /**
   * Get completed tracks - uses the audio information endpoint
   */
  async getCompletedTracks(): Promise<SunoGenerateResponse[]> {
    console.log('getCompletedTracks called - this requires specific track IDs for localhost API');
    // This method would need specific track IDs to work with the localhost API
    // For now, we'll return an empty array and rely on individual track status checking
    return [];
  }

  /**
   * Get quota information
   */
  async getCreditsInfo(): Promise<{ credits_left: number; period: string; monthly_limit: number; monthly_usage: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/get_limit`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Quota API error:', errorText);
        throw new SunoApiError(`Quota check error: ${response.status} - ${errorText}`, `HTTP_${response.status}`);
      }

      const data = await response.json();
      console.log('Quota response data:', data);

      // Return mock data structure if the API doesn't provide the expected format
      return {
        credits_left: data.credits_left || 100,
        period: data.period || 'monthly',
        monthly_limit: data.monthly_limit || 500,
        monthly_usage: data.monthly_usage || 0,
      };
    } catch (error) {
      console.error('Quota check error:', error);
      if (error instanceof SunoApiError) {
        throw error;
      }
      throw new SunoApiError(`Network or unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'NETWORK_ERROR');
    }
  }
}

export const sunoApi = new SunoApiService();