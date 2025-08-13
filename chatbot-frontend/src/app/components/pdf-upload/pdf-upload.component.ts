import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PdfService, PdfConversionResponse } from '../../services/pdf.service';
import { NGXLogger } from 'ngx-logger';

export interface PdfUploadResult {
  success: boolean;
  markdownContent?: string;
  errorMessage?: string;
  fileName?: string;
  pageCount?: number;
}

@Component({
  selector: 'app-pdf-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pdf-upload-container">
      <!-- File Drop Zone -->
      <div class="drop-zone" 
           [class.dragover]="isDragOver"
           [class.processing]="isProcessing"
           (dragover)="onDragOver($event)"
           (dragleave)="onDragLeave($event)"
           (drop)="onDrop($event)"
           (click)="fileInput.click()">
        
        <div *ngIf="!isProcessing && !selectedFile" class="drop-zone-content">
          <div class="upload-icon">📄</div>
          <div class="upload-text">
            <h3>Upload PDF Document</h3>
            <p>Drag & drop a PDF file here or click to browse</p>
            <small>Supports PDF files up to 10MB</small>
          </div>
        </div>

        <div *ngIf="selectedFile && !isProcessing" class="file-selected">
          <div class="file-info">
            <div class="file-icon">📄</div>
            <div class="file-details">
              <h4>{{ selectedFile.name }}</h4>
              <p>{{ formatFileSize(selectedFile.size) }}</p>
            </div>
            <button class="remove-file-btn" (click)="removeFile($event)" title="Remove file">✕</button>
          </div>
          
          <div class="conversion-options">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="includeMetadata">
              Include PDF metadata in conversion
            </label>
          </div>

          <div class="action-buttons">
            <button class="convert-btn" (click)="convertToMarkdown($event)" [disabled]="isProcessing">
              Convert to Markdown
            </button>
            <button class="cancel-btn" (click)="removeFile($event)">
              Cancel
            </button>
          </div>
        </div>

        <div *ngIf="isProcessing" class="processing-state">
          <div class="spinner"></div>
          <h3>Converting PDF to Markdown...</h3>
          <p>Please wait while we process your document</p>
        </div>

        <input #fileInput 
               type="file" 
               accept=".pdf"
               (change)="onFileSelected($event)"
               style="display: none;">
      </div>

      <!-- Status Messages -->
      <div *ngIf="statusMessage" class="status-message" [class.error]="hasError" [class.success]="!hasError">
        {{ statusMessage }}
      </div>

      <!-- Conversion Result Preview -->
      <div *ngIf="lastConversionResult && lastConversionResult.success" class="conversion-result">
        <h4>Conversion Successful!</h4>
        <div class="result-info">
          <span><strong>File:</strong> {{ lastConversionResult.fileName }}</span>
          <span *ngIf="lastConversionResult.pageCount"><strong>Pages:</strong> {{ lastConversionResult.pageCount }}</span>
        </div>
        <div class="markdown-preview">
          <h5>Markdown Preview:</h5>
          <pre class="markdown-content">{{ getMarkdownPreview() }}</pre>
        </div>
        <div class="result-actions">
          <button class="send-to-chat-btn" (click)="sendMarkdownToChatHandler()">
            Send to Chat
          </button>
          <button class="copy-btn" (click)="copyToClipboard()">
            Copy Markdown
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pdf-upload-container {
      margin: 1rem 0;
    }

    .drop-zone {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: #fafafa;
      min-height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .drop-zone:hover {
      border-color: #007bff;
      background: #f0f8ff;
    }

    .drop-zone.dragover {
      border-color: #007bff;
      background: #e3f2fd;
      transform: scale(1.02);
    }

    .drop-zone.processing {
      border-color: #28a745;
      background: #f8fff9;
    }

    .drop-zone-content {
      text-align: center;
    }

    .upload-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .upload-text h3 {
      margin: 0 0 0.5rem 0;
      color: #333;
    }

    .upload-text p {
      margin: 0 0 0.5rem 0;
      color: #666;
    }

    .upload-text small {
      color: #999;
    }

    .file-selected {
      width: 100%;
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #fff;
      border-radius: 6px;
      margin-bottom: 1rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .file-icon {
      font-size: 2rem;
    }

    .file-details {
      flex: 1;
    }

    .file-details h4 {
      margin: 0 0 0.25rem 0;
      color: #333;
    }

    .file-details p {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }

    .remove-file-btn {
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      cursor: pointer;
      font-size: 1rem;
    }

    .remove-file-btn:hover {
      background: #c82333;
    }

    .conversion-options {
      margin-bottom: 1rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      color: #555;
    }

    .action-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    .convert-btn {
      background: #007bff;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
    }

    .convert-btn:hover:not(:disabled) {
      background: #0056b3;
    }

    .convert-btn:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }

    .cancel-btn {
      background: #6c757d;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      cursor: pointer;
    }

    .cancel-btn:hover {
      background: #545b62;
    }

    .processing-state {
      text-align: center;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .processing-state h3 {
      margin: 0 0 0.5rem 0;
      color: #333;
    }

    .processing-state p {
      margin: 0;
      color: #666;
    }

    .status-message {
      margin-top: 1rem;
      padding: 0.75rem;
      border-radius: 6px;
      text-align: center;
      font-weight: 500;
    }

    .status-message.success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .status-message.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .conversion-result {
      margin-top: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 6px;
      border: 1px solid #dee2e6;
    }

    .conversion-result h4 {
      margin: 0 0 1rem 0;
      color: #28a745;
    }

    .result-info {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }

    .markdown-preview {
      margin-bottom: 1rem;
    }

    .markdown-preview h5 {
      margin: 0 0 0.5rem 0;
      color: #333;
    }

    .markdown-content {
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 1rem;
      max-height: 200px;
      overflow-y: auto;
      font-size: 0.85rem;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .result-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    .send-to-chat-btn {
      background: #28a745;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
    }

    .send-to-chat-btn:hover {
      background: #218838;
    }

    .copy-btn {
      background: #17a2b8;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
    }

    .copy-btn:hover {
      background: #138496;
    }

    @media (max-width: 768px) {
      .drop-zone {
        padding: 1rem;
        min-height: 150px;
      }

      .action-buttons,
      .result-actions {
        flex-direction: column;
        align-items: center;
      }

      .result-info {
        flex-direction: column;
        gap: 0.5rem;
      }
    }
  `]
})
export class PdfUploadComponent {
  @Input() maxFileSize: number = 10 * 1024 * 1024; // 10MB default
  @Output() conversionComplete = new EventEmitter<PdfUploadResult>();
  @Output() sendMarkdownToChat = new EventEmitter<string>();

  selectedFile: File | null = null;
  isDragOver: boolean = false;
  isProcessing: boolean = false;
  includeMetadata: boolean = false;
  statusMessage: string = '';
  hasError: boolean = false;
  lastConversionResult: PdfUploadResult | null = null;

  constructor(
    private pdfService: PdfService,
    private logger: NGXLogger
  ) {}

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileSelection(input.files[0]);
    }
  }

  private handleFileSelection(file: File): void {
    this.clearStatus();
    this.lastConversionResult = null;

    if (!this.pdfService.isValidPdfFile(file)) {
      this.setStatus('Please select a valid PDF file.', true);
      return;
    }

    if (file.size > this.maxFileSize) {
      this.setStatus(`File size exceeds ${this.formatFileSize(this.maxFileSize)} limit.`, true);
      return;
    }

    this.selectedFile = file;
    this.setStatus(`Selected: ${file.name} (${this.formatFileSize(file.size)})`, false);
    this.logger.info('PDF file selected', { fileName: file.name, fileSize: file.size });
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile = null;
    this.lastConversionResult = null;
    this.clearStatus();
    this.logger.info('PDF file removed');
  }

  async convertToMarkdown(event: Event): Promise<void> {
    event.stopPropagation();
    
    if (!this.selectedFile) {
      this.setStatus('No file selected for conversion.', true);
      return;
    }

    this.isProcessing = true;
    this.clearStatus();

    try {
      this.logger.info('Starting PDF conversion', { 
        fileName: this.selectedFile.name,
        includeMetadata: this.includeMetadata 
      });

      this.pdfService.convertPdfFile(this.selectedFile, this.includeMetadata)
        .subscribe({
          next: (response) => {
            this.isProcessing = false;
            
            const result: PdfUploadResult = {
              success: response.success,
              markdownContent: response.markdownContent,
              errorMessage: response.errorMessage,
              fileName: this.selectedFile?.name,
              pageCount: response.pageCount
            };

            this.lastConversionResult = result;

            if (response.success) {
              this.setStatus('PDF converted to Markdown successfully!', false);
              this.conversionComplete.emit(result);
            } else {
              this.setStatus(response.errorMessage || 'Conversion failed', true);
            }
          },
          error: (error) => {
            this.isProcessing = false;
            this.logger.error('PDF conversion error', error);
            this.setStatus('Conversion failed: ' + (error.message || 'Unknown error'), true);
          }
        });
    } catch (error) {
      this.isProcessing = false;
      this.logger.error('PDF conversion error', error);
      this.setStatus('Conversion failed: ' + (error instanceof Error ? error.message : 'Unknown error'), true);
    }
  }

  sendMarkdownToChatHandler(): void {
    if (this.lastConversionResult?.markdownContent) {
      const message = `Here's the converted PDF content:\n\n${this.lastConversionResult.markdownContent}`;
      this.sendMarkdownToChat.emit(message);
      this.logger.info('PDF markdown content sent to chat');
    }
  }

  async copyToClipboard(): Promise<void> {
    if (this.lastConversionResult?.markdownContent) {
      try {
        await navigator.clipboard.writeText(this.lastConversionResult.markdownContent);
        this.setStatus('Markdown content copied to clipboard!', false);
      } catch (error) {
        this.logger.error('Failed to copy to clipboard', error);
        this.setStatus('Failed to copy to clipboard', true);
      }
    }
  }

  getMarkdownPreview(): string {
    if (!this.lastConversionResult?.markdownContent) return '';
    
    const content = this.lastConversionResult.markdownContent;
    const maxLength = 300;
    
    if (content.length <= maxLength) {
      return content;
    }
    
    return content.substring(0, maxLength) + '...';
  }

  formatFileSize(bytes: number): string {
    return this.pdfService.formatFileSize(bytes);
  }

  private setStatus(message: string, isError: boolean): void {
    this.statusMessage = message;
    this.hasError = isError;
  }

  private clearStatus(): void {
    this.statusMessage = '';
    this.hasError = false;
  }
}
