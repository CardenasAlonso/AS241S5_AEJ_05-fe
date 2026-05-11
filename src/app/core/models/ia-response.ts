export interface ApiResponse {
  id?: string;
  apiName: string;
  requestData: string;
  responseData: any;
  audioData?: string;
  timestamp?: string;
}