import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NGXLogger } from 'ngx-logger';
import { PdfService, PdfConversionResponse, PdfServiceStatus } from './pdf.service';

describe('PdfService', () => {
  let service: PdfService;
  let httpMock: HttpTestingController;
  let loggerSpy: jasmine.SpyObj<NGXLogger>;

  const mockApiBase = 'http://localhost:5204/api/pdf';

  beforeEach(() => {
    const spy = jasmine.createSpyObj('NGXLogger', ['info', 'error', 'warn', 'debug']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        PdfService,
        { provide: NGXLogger, useValue: spy }
      ]
    });

    service = TestBed.inject(PdfService);
    httpMock = TestBed.inject(HttpTestingController);
    loggerSpy = TestBed.inject(NGXLogger) as jasmine.SpyObj<NGXLogger>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('checkServiceStatus', () => {
    it('should return service status successfully', (done) => {
      const mockResponse: PdfServiceStatus = {
        available: true,
        status: 'operational',
        message: 'PDF service is running',
        timestamp: new Date().toISOString()
      };

      service.checkServiceStatus().subscribe(result => {
        expect(result).toEqual(mockResponse);
        expect(loggerSpy.info).toHaveBeenCalledWith('Checking PDF service status');
        done();
      });
      
      const req = httpMock.expectOne(`${mockApiBase}/status`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle service status error', (done) => {
      service.checkServiceStatus().subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });
      
      const req = httpMock.expectOne(`${mockApiBase}/status`);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('convertPdfFile', () => {
    it('should convert PDF file successfully', (done) => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const mockResponse: PdfConversionResponse = {
        success: true,
        markdownContent: '# Test Document\n\nContent here...',
        pageCount: 2
      };

      service.convertPdfFile(file).subscribe(result => {
        expect(result).toEqual(mockResponse);
        expect(loggerSpy.info).toHaveBeenCalledWith('Converting PDF file to Markdown', jasmine.any(Object));
        done();
      });
      
      const req = httpMock.expectOne(`${mockApiBase}/convert`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeInstanceOf(FormData);
      req.flush(mockResponse);
    });

    it('should handle conversion errors', (done) => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      
      service.convertPdfFile(file).subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error).toBeDefined();
          expect(loggerSpy.error).toHaveBeenCalled();
          done();
        }
      });
      
      const req = httpMock.expectOne(`${mockApiBase}/convert`);
      req.error(new ErrorEvent('Conversion failed'));
    });

    it('should include metadata option', (done) => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const mockResponse: PdfConversionResponse = {
        success: true,
        markdownContent: '# Test Document',
        pageCount: 1
      };

      service.convertPdfFile(file, true).subscribe(result => {
        expect(result).toEqual(mockResponse);
        done();
      });
      
      const req = httpMock.expectOne(`${mockApiBase}/convert`);
      const formData = req.request.body as FormData;
      expect(formData.get('includeMetadata')).toBe('true');
      req.flush(mockResponse);
    });
  });

  describe('convertBase64Pdf', () => {
    it('should convert base64 PDF successfully', (done) => {
      const request = {
        base64Content: 'dGVzdCBwZGYgY29udGVudA==',
        fileName: 'test.pdf',
        includeMetadata: false
      };
      
      const mockResponse: PdfConversionResponse = {
        success: true,
        markdownContent: '# Test Document\n\nContent here...',
        pageCount: 1
      };

      service.convertBase64Pdf(request).subscribe(result => {
        expect(result).toEqual(mockResponse);
        expect(loggerSpy.info).toHaveBeenCalledWith('Converting base64 PDF to Markdown', jasmine.any(Object));
        done();
      });
      
      const req = httpMock.expectOne(`${mockApiBase}/convert-base64`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should handle base64 conversion errors', (done) => {
      const request = {
        base64Content: 'invalid',
        fileName: 'test.pdf'
      };
      
      service.convertBase64Pdf(request).subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error).toBeDefined();
          expect(loggerSpy.error).toHaveBeenCalled();
          done();
        }
      });
      
      const req = httpMock.expectOne(`${mockApiBase}/convert-base64`);
      req.error(new ErrorEvent('Conversion failed'));
    });
  });

  describe('utility methods', () => {
    it('should format file size correctly', () => {
      expect(service.formatFileSize(1024)).toBe('1.0 KB');
      expect(service.formatFileSize(1048576)).toBe('1.0 MB');
      expect(service.formatFileSize(1073741824)).toBe('1.0 GB');
      expect(service.formatFileSize(500)).toBe('500 B');
    });

    it('should validate PDF files correctly', () => {
      const validPdf = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const textFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      expect(service.isValidPdfFile(validPdf)).toBe(true);
      expect(service.isValidPdfFile(textFile)).toBe(false);
    });

    it('should handle empty files', () => {
      const emptyFile = new File([''], 'empty.pdf', { type: 'application/pdf' });
      
      expect(service.isValidPdfFile(emptyFile)).toBe(false);
    });
  });

  describe('processing state', () => {
    it('should track processing state', (done) => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      let processingStates: boolean[] = [];

      service.isProcessing$.subscribe(state => {
        processingStates.push(state);
        if (processingStates.length === 3) {
          expect(processingStates).toEqual([false, true, false]); // initial, start, complete
          done();
        }
      });

      service.convertPdfFile(file).subscribe();
      
      const req = httpMock.expectOne(`${mockApiBase}/convert`);
      req.flush({ success: true, markdownContent: 'test' });
    });
  });

  describe('error handling', () => {
    it('should handle HTTP errors gracefully', (done) => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      
      service.convertPdfFile(file).subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error).toBeDefined();
          expect(loggerSpy.error).toHaveBeenCalled();
          done();
        }
      });
      
      const req = httpMock.expectOne(`${mockApiBase}/convert`);
      req.flush({ error: 'Internal server error' }, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network errors', (done) => {
      service.checkServiceStatus().subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });
      
      const req = httpMock.expectOne(`${mockApiBase}/status`);
      req.error(new ErrorEvent('Network error', {
        message: 'Failed to connect to server'
      }));
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete file upload workflow', (done) => {
      const file = new File(['test pdf content'], 'document.pdf', { type: 'application/pdf' });
      
      // First check if valid
      expect(service.isValidPdfFile(file)).toBe(true);
      
      // Then convert
      const mockResponse: PdfConversionResponse = {
        success: true,
        markdownContent: '# Document Title\n\nContent...',
        pageCount: 1
      };

      service.convertPdfFile(file).subscribe(result => {
        expect(result.success).toBe(true);
        expect(result.markdownContent).toContain('Document Title');
        done();
      });

      const req = httpMock.expectOne(`${mockApiBase}/convert`);
      req.flush(mockResponse);
    });

    it('should handle service unavailable scenario', (done) => {
      // Check status first
      service.checkServiceStatus().subscribe(status => {
        expect(status.available).toBe(false);
        
        // Try conversion when service is down
        const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
        service.convertPdfFile(file).subscribe({
          next: () => fail('Expected error'),
          error: (error) => {
            expect(error).toBeDefined();
            done();
          }
        });

        const conversionReq = httpMock.expectOne(`${mockApiBase}/convert`);
        conversionReq.error(new ErrorEvent('Service unavailable'));
      });

      const statusReq = httpMock.expectOne(`${mockApiBase}/status`);
      statusReq.flush({ available: false, status: 'unavailable', message: 'Service unavailable', timestamp: new Date().toISOString() });
    });
  });
});
