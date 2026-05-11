import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/ia-response';
import { SoundRequest } from '../models/dto/sound-request';
import { Environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class IaResponseService {
  private http = inject(HttpClient);
  
  private baseUrl = Environment.apiUrl; 
  
  private responsesUrl = `${this.baseUrl}/responses`; 

  getResponses(): Observable<ApiResponse[]> {
    return this.http.get<ApiResponse[]>(this.responsesUrl);
  }

  createRequest(request: any, apiName: string): Observable<ApiResponse> {
    if (apiName === 'ElevenLabs') {
      return this.http.post<ApiResponse>(`${this.baseUrl}/elevenlabs/sound-effect/play`, request);
      
    } else if (apiName === 'ZeroBounce') {
      const params = new HttpParams().set('email', request.prompt);
      return this.http.get<ApiResponse>(`${this.baseUrl}/zerobounce/validate`, { params });
    }

    throw new Error(`API no soportada: ${apiName}`);
  }

  updateRequest(id: string, request: any): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.responsesUrl}/${id}`, request);
  }

  deleteResponse(id: string): Observable<void> {
    return this.http.delete<void>(`${this.responsesUrl}/${id}`);
  }

  playBase64Audio(base64Audio: string) {
    if (!base64Audio) return;
    const audioSrc = `data:audio/mp3;base64,${base64Audio}`;
    const audio = new Audio(audioSrc);
    audio.play();
  }
}