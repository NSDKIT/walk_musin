export interface SunoGenerateRequest {
  prompt: string;
  style?: string;
  title?: string;
  customMode?: boolean;
  instrumental?: boolean;
  model?: string;
  negativeTags?: string;
  callBackUrl?: string;
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
  status: number; // 0: pending, 1: success, 2: failed
  gpt_description_prompt?: string;
  prompt?: string;
  type: string;
  tags?: string;
}

export interface SunoRecordInfo {
  id: string;
  title: string;
  image_url?: string;
  lyric?: string;
  audio_url?: string;
  video_url?: string;
  created_at: string;
  model_name: string;
  status: 'PENDING' | 'TEXT_SUCCESS' | 'FIRST_SUCCESS' | 'SUCCESS' | 'CREATE_TASK_FAILED' | 'GENERATE_AUDIO_FAILED' | 'CALLBACK_EXCEPTION' | 'SENSITIVE_WORD_ERROR';
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
  private apiKey: string;
  private baseUrl = 'https://api.sunoapi.org';

  constructor() {
    this.apiKey = import.meta.env.VITE_SUNOAPI_ORG_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Suno API key not found. Music generation will use mock data.');
    }
  }

  async generateMusic(prompt: string, options?: {
    style?: string;
    instrumental?: boolean;
    title?: string;
  }): Promise<SunoGenerateResponse[]> {
    if (!this.apiKey) {
      throw new SunoApiError(
        'Suno API key not configured. Please add your API key to continue generating music.',
        'NO_API_KEY',
        false,
        true
      );
    }

    try {
      const requestBody: SunoGenerateRequest = {
        prompt,
        style: options?.style || 'Acoustic',
        title: options?.title || `Walking Track ${new Date().toLocaleDateString('ja-JP')}`,
        customMode: true,
        instrumental: options?.instrumental ?? false,
        model: 'V3_5',
        negativeTags: 'Heavy Metal, Aggressive, Loud',
        callBackUrl: 'https://example.com/suno-callback',
      };

      console.log('Sending request to Suno API:', {
        url: `${this.baseUrl}/api/v1/generate`,
        body: requestBody
      });

      const response = await fetch(`${this.baseUrl}/api/v1/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Suno API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Suno API error response:', errorText);
        
        // Handle specific error cases
        if (errorText.includes('insufficient') || errorText.includes('credits') || errorText.includes('top up')) {
          throw new SunoApiError(
            'Insufficient credits available. Please check your Suno API account and top up credits to continue generating music.',
            'INSUFFICIENT_CREDITS',
            true
          );
        }
        
        if (response.status === 401) {
          throw new SunoApiError(
            'Invalid API key. Please check your Suno API configuration.',
            'INVALID_API_KEY',
            false,
            true
          );
        }
        
        throw new SunoApiError(`Suno API error: ${response.status} - ${errorText}`, `HTTP_${response.status}`);
      }

      const rawResponse = await response.json();
      console.log('Suno API raw response data:', rawResponse);

      // Check for API-level errors embedded in the response
      if (rawResponse && rawResponse.code !== 200) {
        const errorMessage = rawResponse.msg || 'Unknown API error';
        console.error('Suno API generate error:', errorMessage);
        
        // Handle specific error messages
        if (errorMessage.includes('insufficient') || errorMessage.includes('credits') || errorMessage.includes('top up')) {
          throw new SunoApiError(
            'Insufficient credits available. Please check your Suno API account and top up credits to continue generating music.',
            'INSUFFICIENT_CREDITS',
            true
          );
        }
        
        throw new SunoApiError(errorMessage, rawResponse.code?.toString());
      }

      if (rawResponse && rawResponse.code === 200 && rawResponse.data) {
        const data = rawResponse.data;
        console.log('Suno API actual track data:', data);
        // The generate endpoint for sunoapi.org seems to return an array
        return Array.isArray(data) ? data : [data]; // Ensure it's always an array
      } else {
        console.error('Suno API generate error: Unexpected response structure', rawResponse);
        throw new SunoApiError(`Unexpected response structure - ${JSON.stringify(rawResponse)}`, 'INVALID_RESPONSE');
      }

    } catch (error) {
      console.error('Suno API error:', error);
      if (error instanceof SunoApiError) {
        throw error;
      }
      throw new SunoApiError(`Network or unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'NETWORK_ERROR');
    }
  }

  /**
   * 完成した音楽を取得する（新しいエンドポイント）
   */
  async getCompletedTracks(): Promise<SunoRecordInfo[]> {
    if (!this.apiKey) {
      throw new SunoApiError(
        'Suno API key not configured',
        'NO_API_KEY',
        false,
        true
      );
    }

    try {
      console.log('Fetching completed tracks from Suno API...');
      
      const response = await fetch(`${this.baseUrl}/api/v1/generate/record-info`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
      });

      console.log('Completed tracks response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Suno API completed tracks error:', errorText);
        
        if (response.status === 401) {
          throw new SunoApiError(
            'Invalid API key. Please check your Suno API configuration.',
            'INVALID_API_KEY',
            false,
            true
          );
        }
        
        throw new SunoApiError(`Failed to fetch completed tracks: ${response.status} - ${errorText}`, `HTTP_${response.status}`);
      }

      const rawResponse = await response.json();
      console.log('Completed tracks raw response:', rawResponse);

      // Check for API-level errors embedded in the response
      if (rawResponse && rawResponse.code !== 200) {
        const errorMessage = rawResponse.msg || 'Unknown API error';
        console.error('Suno API completed tracks error:', errorMessage);
        throw new SunoApiError(errorMessage, rawResponse.code?.toString());
      }

      if (rawResponse && rawResponse.code === 200 && rawResponse.data) {
        const data = rawResponse.data;
        console.log('Completed tracks data:', data);
        
        // Filter only completed tracks (SUCCESS status)
        const completedTracks = Array.isArray(data) 
          ? data.filter((track: SunoRecordInfo) => track.status === 'SUCCESS')
          : (data.status === 'SUCCESS' ? [data] : []);
        
        console.log('Filtered completed tracks:', completedTracks);
        return completedTracks;
      } else {
        console.warn('No completed tracks data found in response');
        return [];
      }

    } catch (error) {
      console.error('Suno API completed tracks error:', error);
      if (error instanceof SunoApiError) {
        throw error;
      }
      throw new SunoApiError(`Network or unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'NETWORK_ERROR');
    }
  }

  async getGenerationStatus(ids: string[]): Promise<SunoGenerateResponse[]> {
    if (!this.apiKey) {
      throw new SunoApiError(
        'Suno API key not configured',
        'NO_API_KEY',
        false,
        true
      );
    }

    try {
      const jobId = ids[0]; // Assuming polling one ID at a time
      const url = `${this.baseUrl}/api/v1/get?ids=${jobId}`;
      
      console.log(`Checking status for job ID: ${jobId} at URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
      });

      console.log(`Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Suno API status error:', errorText);
        
        if (response.status === 401) {
          throw new SunoApiError(
            'Invalid API key. Please check your Suno API configuration.',
            'INVALID_API_KEY',
            false,
            true
          );
        }
        
        throw new SunoApiError(`Status check error: ${response.status} - ${errorText}`, `HTTP_${response.status}`);
      }

      const rawResponse = await response.json();
      console.log('Status check raw response:', rawResponse);

      // Check for API-level errors embedded in the response
      if (rawResponse && rawResponse.code !== 200) {
        const errorMessage = rawResponse.msg || 'Unknown API error';
        console.error('Suno API status error:', errorMessage);
        throw new SunoApiError(errorMessage, rawResponse.code?.toString());
      }

      if (rawResponse && rawResponse.code === 200 && rawResponse.data) {
        const data = rawResponse.data;
        console.log('Status check data:', data);
        return Array.isArray(data) ? data : [data];
      } else {
        console.warn('No status data found in response');
        return [];
      }

    } catch (error) {
      console.error('Suno API status check error:', error);
      if (error instanceof SunoApiError) {
        throw error;
      }
      throw new SunoApiError(`Network or unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'NETWORK_ERROR');
    }
  }

  async getCreditsInfo(): Promise<{ credits_left: number; period: string; monthly_limit: number; monthly_usage: number }> {
    if (!this.apiKey) {
      throw new SunoApiError(
        'Suno API key not configured',
        'NO_API_KEY',
        false,
        true
      );
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/credits`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Suno API credits error:', errorText);
        throw new SunoApiError(`Credits check error: ${response.status} - ${errorText}`, `HTTP_${response.status}`);
      }

      const rawResponse = await response.json();

      // Check for API-level errors embedded in the response
      if (rawResponse && rawResponse.code !== 200) {
        const errorMessage = rawResponse.msg || 'Unknown API error';
        console.error('Suno API credits error:', errorMessage);
        throw new SunoApiError(errorMessage, rawResponse.code?.toString());
      }

      if (rawResponse && rawResponse.code === 200 && rawResponse.data !== undefined) {
         console.log('Suno API credits response data:', rawResponse.data);
         // Assuming credits info is directly in 'data'. Adjust if it's nested further.
         return rawResponse.data;
      } else {
         throw new SunoApiError(`Unexpected response structure - ${JSON.stringify(rawResponse)}`, 'INVALID_RESPONSE');
      }
    } catch (error) {
      console.error('Suno API credits check error:', error);
      if (error instanceof SunoApiError) {
        throw error;
      }
      throw new SunoApiError(`Network or unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'NETWORK_ERROR');
    }
  }
}

export const sunoApi = new SunoApiService();