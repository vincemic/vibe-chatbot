import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NGXLogger } from 'ngx-logger';
import { of, throwError } from 'rxjs';

import { PdfUploadComponent, PdfUploadResult } from './pdf-upload.component';
import { PdfService, PdfConversionResponse } from '../../services/pdf.service';

describe('PdfUploadComponent', () => {
  let component: PdfUploadComponent;
  let fixture: ComponentFixture<PdfUploadComponent>;
  let mockPdfService: jasmine.SpyObj<PdfService>;
  let mockLogger: jasmine.SpyObj<NGXLogger>;

  beforeEach(async () => {
    const pdfServiceSpy = jasmine.createSpyObj('PdfService', [
      'isValidPdfFile',
      'convertPdfFile',
      'formatFileSize'
    ]);
    const loggerSpy = jasmine.createSpyObj('NGXLogger', ['info', 'error', 'warn', 'debug']);

    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule, PdfUploadComponent],
      providers: [
        { provide: PdfService, useValue: pdfServiceSpy },
        { provide: NGXLogger, useValue: loggerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PdfUploadComponent);
    component = fixture.componentInstance;
    mockPdfService = TestBed.inject(PdfService) as jasmine.SpyObj<PdfService>;
    mockLogger = TestBed.inject(NGXLogger) as jasmine.SpyObj<NGXLogger>;

    // Setup default mock behaviors
    mockPdfService.formatFileSize.and.returnValue('1.0 MB');
    mockPdfService.isValidPdfFile.and.returnValue(true);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.selectedFile).toBeNull();
    expect(component.isProcessing).toBe(false);
    expect(component.isDragOver).toBe(false);
    expect(component.lastConversionResult).toBeNull();
    expect(component.includeMetadata).toBe(false);
  });

  describe('File Selection', () => {
    it('should handle file selection from input', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const input = document.createElement('input');
      input.type = 'file';
      
      const mockFileList = Object.create(FileList.prototype);
      Object.defineProperty(mockFileList, '0', { value: file });
      Object.defineProperty(mockFileList, 'length', { value: 1 });
      Object.defineProperty(input, 'files', { value: mockFileList });
      
      const event = { target: input } as any;
      component.onFileSelected(event);
      
      expect(component.selectedFile).toBe(file);
    });

    it('should handle null file list', () => {
      const input = document.createElement('input');
      input.type = 'file';
      Object.defineProperty(input, 'files', { value: null });
      
      const event = { target: input } as any;
      component.onFileSelected(event);
      
      expect(component.selectedFile).toBeNull();
    });
  });

  describe('Drag and Drop', () => {
    it('should handle drag over', () => {
      const event = new DragEvent('dragover');
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');
      
      component.onDragOver(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(component.isDragOver).toBe(true);
    });

    it('should handle drag leave', () => {
      component.isDragOver = true;
      const event = new DragEvent('dragleave');
      
      component.onDragLeave(event);
      
      expect(component.isDragOver).toBe(false);
    });

    it('should handle drop with files', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      
      const event = new DragEvent('drop', { dataTransfer });
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');
      
      component.onDrop(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(component.isDragOver).toBe(false);
      expect(component.selectedFile).toBe(file);
    });
  });

  describe('File Conversion', () => {
    it('should convert PDF file successfully', async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const mockResponse: PdfConversionResponse = {
        success: true,
        markdownContent: '# Test Document',
        pageCount: 1
      };

      mockPdfService.convertPdfFile.and.returnValue(of(mockResponse));
      component.selectedFile = file;

      await component.convertToMarkdown({} as Event);

      expect(mockPdfService.convertPdfFile).toHaveBeenCalledWith(file, false);
      expect(component.lastConversionResult?.success).toBe(true);
      expect(component.lastConversionResult?.markdownContent).toBe('# Test Document');
    });

    it('should handle conversion errors', async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const error = new Error('Conversion failed');

      mockPdfService.convertPdfFile.and.returnValue(throwError(() => error));
      component.selectedFile = file;

      await component.convertToMarkdown({} as Event);

      expect(component.hasError).toBe(true);
      expect(component.statusMessage).toContain('Failed to convert PDF');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should validate file before conversion', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      mockPdfService.isValidPdfFile.and.returnValue(false);
      component.selectedFile = file;

      await component.convertToMarkdown({} as Event);

      expect(component.hasError).toBe(true);
      expect(component.statusMessage).toContain('Please select a valid PDF file');
      expect(mockPdfService.convertPdfFile).not.toHaveBeenCalled();
    });

    it('should not convert without selected file', async () => {
      component.selectedFile = null;
      
      await component.convertToMarkdown({} as Event);

      expect(component.hasError).toBe(true);
      expect(component.statusMessage).toContain('Please select a PDF file first');
      expect(mockPdfService.convertPdfFile).not.toHaveBeenCalled();
    });
  });

  describe('File Operations', () => {
    it('should remove selected file', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      component.selectedFile = file;
      component.lastConversionResult = { success: true, markdownContent: 'test' };

      component.removeFile({} as Event);

      expect(component.selectedFile).toBeNull();
      expect(component.lastConversionResult).toBeNull();
      expect(component.statusMessage).toBe('');
    });

    it('should format file size for display', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      mockPdfService.formatFileSize.and.returnValue('1.5 KB');

      const result = component.formatFileSize(file.size);

      expect(mockPdfService.formatFileSize).toHaveBeenCalledWith(file.size);
      expect(result).toBe('1.5 KB');
    });
  });

  describe('Clipboard Operations', () => {
    beforeEach(() => {
      Object.assign(navigator, {
        clipboard: {
          writeText: jasmine.createSpy('writeText').and.returnValue(Promise.resolve())
        }
      });
    });

    it('should copy result to clipboard', async () => {
      component.lastConversionResult = {
        success: true,
        markdownContent: '# Test Content'
      };

      await component.copyToClipboard();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('# Test Content');
    });

    it('should handle clipboard errors', async () => {
      component.lastConversionResult = {
        success: true,
        markdownContent: '# Test'
      };
      (navigator.clipboard.writeText as jasmine.Spy).and.returnValue(Promise.reject(new Error('Clipboard error')));

      await component.copyToClipboard();

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should not copy when no result available', async () => {
      component.lastConversionResult = null;

      await component.copyToClipboard();

      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });
  });

  describe('UI State Management', () => {
    it('should get markdown preview', () => {
      component.lastConversionResult = {
        success: true,
        markdownContent: '# Very Long Title That Should Be Truncated Because It Exceeds The Maximum Length'
      };

      const preview = component.getMarkdownPreview();

      expect(preview.length).toBeLessThanOrEqual(200);
      expect(preview).toContain('...');
    });

    it('should handle short markdown content', () => {
      component.lastConversionResult = {
        success: true,
        markdownContent: '# Short Title'
      };

      const preview = component.getMarkdownPreview();

      expect(preview).toBe('# Short Title');
    });
  });

  describe('Component Integration', () => {
    it('should handle complete upload workflow', async () => {
      const file = new File(['test pdf content'], 'document.pdf', { type: 'application/pdf' });
      const mockResponse: PdfConversionResponse = {
        success: true,
        markdownContent: '# Document Title\n\nContent...',
        pageCount: 2
      };

      mockPdfService.convertPdfFile.and.returnValue(of(mockResponse));

      // Simulate file selection
      component.selectedFile = file;
      
      // Convert file
      await component.convertToMarkdown({} as Event);

      expect(component.lastConversionResult?.success).toBe(true);
      expect(component.lastConversionResult?.markdownContent).toBe('# Document Title\n\nContent...');
      expect(component.hasError).toBe(false);
    });

    it('should handle processing state correctly', async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      mockPdfService.convertPdfFile.and.returnValue(of({
        success: true,
        markdownContent: '# Test'
      }));

      component.selectedFile = file;
      
      const conversionPromise = component.convertToMarkdown({} as Event);
      
      // Should be processing
      expect(component.isProcessing).toBe(true);
      
      await conversionPromise;
      
      // Should not be processing anymore
      expect(component.isProcessing).toBe(false);
    });
  });

  describe('Event Handling', () => {
    it('should prevent default on conversion event', async () => {
      const event = jasmine.createSpyObj('Event', ['preventDefault']);
      component.selectedFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      mockPdfService.convertPdfFile.and.returnValue(of({ success: true }));

      await component.convertToMarkdown(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent default on remove file event', () => {
      const event = jasmine.createSpyObj('Event', ['preventDefault']);
      component.selectedFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      component.removeFile(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });
  });
});
