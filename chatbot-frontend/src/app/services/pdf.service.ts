import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { NGXLogger } from 'ngx-logger';

export interface PdfConversionRequest {
  base64Content?: string;
  fileName?: string;
  includeMetadata?: boolean;
}

export interface PdfConversionResponse {
  success: boolean;
  markdownContent?: string;
  errorMessage?: string;
  pageCount?: number;
  metadata?: PdfMetadata;
}

export interface PdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  creationDate?: string;
  modificationDate?: string;
  producer?: string;
}

export interface PdfServiceStatus {
  available: boolean;
  status: string;
  message: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  private readonly baseUrl = window.location.hostname === 'localhost' 
    ? 'http://localhost:5204/api/pdf'  // HTTP for localhost
    : 'https://localhost:7271/api/pdf'; // HTTPS for production

  private isProcessingSubject = new BehaviorSubject<boolean>(false);
  public isProcessing$ = this.isProcessingSubject.asObservable();

  constructor(
    private http: HttpClient,
    private logger: NGXLogger
  ) {}

  /**
   * Check if the PDF service is available
   */
  public checkServiceStatus(): Observable<PdfServiceStatus> {
    this.logger.info('Checking PDF service status');
    return this.http.get<PdfServiceStatus>(`${this.baseUrl}/status`);
  }

  /**
   * Convert PDF file to Markdown
   */
  public convertPdfFile(file: File, includeMetadata: boolean = false): Observable<PdfConversionResponse> {
    this.logger.info('Converting PDF file to Markdown', { 
      fileName: file.name, 
      fileSize: file.size, 
      includeMetadata 
    });

    this.isProcessingSubject.next(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('includeMetadata', includeMetadata.toString());

    return new Observable<PdfConversionResponse>(observer => {
      this.http.post<PdfConversionResponse>(`${this.baseUrl}/convert`, formData)
        .subscribe({
          next: (response) => {
            this.logger.info('PDF conversion completed', { success: response.success });
            this.isProcessingSubject.next(false);
            observer.next(response);
            observer.complete();
          },
          error: (error) => {
            this.logger.error('PDF conversion failed', error);
            this.isProcessingSubject.next(false);
            observer.error(error);
          }
        });
    });
  }

  /**
   * Convert base64 PDF content to Markdown
   */
  public convertBase64Pdf(request: PdfConversionRequest): Observable<PdfConversionResponse> {
    this.logger.info('Converting base64 PDF to Markdown', { 
      fileName: request.fileName,
      includeMetadata: request.includeMetadata 
    });

    this.isProcessingSubject.next(true);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return new Observable<PdfConversionResponse>(observer => {
      this.http.post<PdfConversionResponse>(`${this.baseUrl}/convert-base64`, request, { headers })
        .subscribe({
          next: (response) => {
            this.logger.info('Base64 PDF conversion completed', { success: response.success });
            this.isProcessingSubject.next(false);
            observer.next(response);
            observer.complete();
          },
          error: (error) => {
            this.logger.error('Base64 PDF conversion failed', error);
            this.isProcessingSubject.next(false);
            observer.error(error);
          }
        });
    });
  }

  /**
   * Convert file to base64 string
   */
  public fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:application/pdf;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Validate if file is a PDF
   */
  public isValidPdfFile(file: File): boolean {
    const validTypes = ['application/pdf'];
    const validExtensions = ['.pdf'];
    
    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );

    return hasValidType || hasValidExtension;
  }

  /**
   * Format file size for display
   */
  public formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
