import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NGXLogger } from 'ngx-logger';
import { of, Subject } from 'rxjs';

import { ChatComponent } from './chat.component';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { PdfService } from '../../services/pdf.service';
import { PdfUploadResult } from '../pdf-upload/pdf-upload.component';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;
  let mockChatService: jasmine.SpyObj<ChatService>;
  let mockPdfService: jasmine.SpyObj<PdfService>;
  let mockLogger: jasmine.SpyObj<NGXLogger>;

  // Create subjects for observables
  let messagesSubject: Subject<ChatMessage[]>;
  let connectionStateSubject: Subject<boolean>;
  let isTypingSubject: Subject<boolean>;

  beforeEach(async () => {
    // Create subjects
    messagesSubject = new Subject<ChatMessage[]>();
    connectionStateSubject = new Subject<boolean>();
    isTypingSubject = new Subject<boolean>();

    const chatServiceSpy = jasmine.createSpyObj('ChatService', [
      'startConnection',
      'stopConnection',
      'sendMessage',
      'clearMessages'
    ], {
      messages$: messagesSubject.asObservable(),
      connectionState$: connectionStateSubject.asObservable(),
      isTyping$: isTypingSubject.asObservable()
    });

    const pdfServiceSpy = jasmine.createSpyObj('PdfService', [
      'checkServiceStatus'
    ]);

    const loggerSpy = jasmine.createSpyObj('NGXLogger', ['info', 'error', 'warn', 'debug']);

    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule, HttpClientTestingModule, ChatComponent],
      providers: [
        { provide: ChatService, useValue: chatServiceSpy },
        { provide: PdfService, useValue: pdfServiceSpy },
        { provide: NGXLogger, useValue: loggerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    mockChatService = TestBed.inject(ChatService) as jasmine.SpyObj<ChatService>;
    mockPdfService = TestBed.inject(PdfService) as jasmine.SpyObj<PdfService>;
    mockLogger = TestBed.inject(NGXLogger) as jasmine.SpyObj<NGXLogger>;

    // Setup default behaviors
    mockChatService.startConnection.and.returnValue(Promise.resolve());
    mockChatService.stopConnection.and.returnValue(Promise.resolve());
    mockChatService.sendMessage.and.returnValue(Promise.resolve());
    mockPdfService.checkServiceStatus.and.returnValue(of({
      available: true,
      status: 'operational',
      message: 'Service running',
      timestamp: new Date().toISOString()
    }));
  });

  beforeEach(() => {
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.newMessage).toBe('');
    expect(component.messages).toEqual([]);
    expect(component.isConnected).toBe(false);
    expect(component.isTyping).toBe(false);
    expect(component.showPdfUpload).toBe(false);
  });

  describe('Connection Management', () => {
    it('should start connection on init', async () => {
      await component.ngOnInit();
      
      expect(mockChatService.startConnection).toHaveBeenCalled();
    });

    it('should stop connection on destroy', () => {
      component.ngOnDestroy();
      
      expect(mockChatService.stopConnection).toHaveBeenCalled();
    });

    it('should update connection state', () => {
      connectionStateSubject.next(true);
      
      expect(component.isConnected).toBe(true);

      connectionStateSubject.next(false);
      
      expect(component.isConnected).toBe(false);
    });
  });

  describe('Message Handling', () => {
    it('should send message', async () => {
      component.newMessage = 'Test message';
      component.isConnected = true;
      
      await component.sendMessage();
      
      expect(mockChatService.sendMessage).toHaveBeenCalledWith('User', 'Test message');
      expect(component.newMessage).toBe('');
    });

    it('should not send empty message', async () => {
      component.newMessage = '';
      component.isConnected = true;
      
      await component.sendMessage();
      
      expect(mockChatService.sendMessage).not.toHaveBeenCalled();
    });

    it('should not send whitespace-only message', async () => {
      component.newMessage = '   ';
      component.isConnected = true;
      
      await component.sendMessage();
      
      expect(mockChatService.sendMessage).not.toHaveBeenCalled();
    });

    it('should not send message when disconnected', async () => {
      component.newMessage = 'Test message';
      component.isConnected = false;
      
      await component.sendMessage();
      
      expect(mockChatService.sendMessage).not.toHaveBeenCalled();
    });

    it('should receive messages from service', () => {
      const messages: ChatMessage[] = [
        {
          user: 'User',
          message: 'Hello',
          timestamp: new Date(),
          isFromBot: false
        },
        {
          user: 'Bot',
          message: 'Hi there!',
          timestamp: new Date(),
          isFromBot: true
        }
      ];

      messagesSubject.next(messages);
      
      expect(component.messages).toEqual(messages);
    });

    it('should clear messages', () => {
      component.clearChat();
      
      expect(mockChatService.clearMessages).toHaveBeenCalled();
    });
  });

  describe('PDF Integration', () => {
    it('should toggle PDF upload panel', () => {
      expect(component.showPdfUpload).toBe(false);
      
      component.togglePdfUpload();
      
      expect(component.showPdfUpload).toBe(true);
      
      component.togglePdfUpload();
      
      expect(component.showPdfUpload).toBe(false);
    });

    it('should handle PDF conversion success', () => {
      const pdfResult: PdfUploadResult = {
        success: true,
        markdownContent: '# Test Document\n\nContent here...'
      };
      
      component.onPdfConversionComplete(pdfResult);
      
      expect(component.showPdfUpload).toBe(false);
      expect(mockLogger.info).toHaveBeenCalledWith('PDF conversion completed', jasmine.any(Object));
    });

    it('should handle PDF conversion failure', () => {
      const pdfResult: PdfUploadResult = {
        success: false,
        markdownContent: undefined,
        errorMessage: 'Conversion failed'
      };

      component.onPdfConversionComplete(pdfResult);
      
      expect(component.showPdfUpload).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('PDF conversion failed', jasmine.any(Object));
    });
  });

  describe('Keyboard Events', () => {
    it('should send message on Enter key', () => {
      component.newMessage = 'Test message';
      component.isConnected = true;
      spyOn(component, 'sendMessage');
      
      const event = new KeyboardEvent('keypress', { key: 'Enter' });
      component.onKeyPress(event);
      
      expect(component.sendMessage).toHaveBeenCalled();
    });

    it('should not send message on Shift+Enter', () => {
      component.newMessage = 'Test message';
      component.isConnected = true;
      spyOn(component, 'sendMessage');
      
      const event = new KeyboardEvent('keypress', { key: 'Enter', shiftKey: true });
      component.onKeyPress(event);
      
      expect(component.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('Typing Indicator', () => {
    it('should update typing state', () => {
      isTypingSubject.next(true);
      
      expect(component.isTyping).toBe(true);

      isTypingSubject.next(false);
      
      expect(component.isTyping).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors', async () => {
      mockChatService.startConnection.and.returnValue(Promise.reject(new Error('Connection failed')));
      
      await component.ngOnInit();
      
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle message send errors', async () => {
      mockChatService.sendMessage.and.returnValue(Promise.reject(new Error('Send failed')));
      component.newMessage = 'Test message';
      component.isConnected = true;
      
      await component.sendMessage();
      
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('Message Formatting', () => {
    it('should format regular messages', () => {
      const message = 'This is a test message';
      const formatted = component.formatMessage(message);
      
      expect(formatted).toContain('This is a test message');
    });

    it('should handle quiz messages', () => {
      const quizMessage = JSON.stringify({
        type: 'quiz_started',
        question: 'What is 2+2?'
      });
      
      const formatted = component.formatMessage(quizMessage);
      
      expect(formatted).toBe('');
    });

    it('should get message type for quiz', () => {
      const quizMessage = JSON.stringify({
        type: 'quiz_started',
        question: 'What is 2+2?'
      });
      
      const messageType = component.getMessageType(quizMessage);
      
      expect(messageType).toBe('quiz');
    });

    it('should get message type for regular message', () => {
      const regularMessage = 'This is a regular message';
      
      const messageType = component.getMessageType(regularMessage);
      
      expect(messageType).toBe('regular');
    });
  });

  describe('Component Integration', () => {
    it('should handle complete chat workflow', async () => {
      // Start connection
      await component.ngOnInit();
      expect(mockChatService.startConnection).toHaveBeenCalled();
      
      // Simulate connection established
      connectionStateSubject.next(true);
      expect(component.isConnected).toBe(true);
      
      // Send a message
      component.newMessage = 'Hello bot';
      await component.sendMessage();
      expect(mockChatService.sendMessage).toHaveBeenCalledWith('User', 'Hello bot');
      
      // Receive messages
      const messages: ChatMessage[] = [
        {
          user: 'User',
          message: 'Hello bot',
          timestamp: new Date(),
          isFromBot: false
        },
        {
          user: 'Bot',
          message: 'Hello! How can I help you?',
          timestamp: new Date(),
          isFromBot: true
        }
      ];
      
      messagesSubject.next(messages);
      expect(component.messages).toEqual(messages);
    });

    it('should integrate PDF upload with chat', () => {
      // Toggle PDF upload
      component.togglePdfUpload();
      expect(component.showPdfUpload).toBe(true);
      
      // Simulate successful PDF conversion
      const pdfResult: PdfUploadResult = {
        success: true,
        markdownContent: '# Document Title\n\nDocument content...'
      };
      
      component.onPdfConversionComplete(pdfResult);
      
      expect(component.showPdfUpload).toBe(false);
    });
  });

  describe('Reconnection', () => {
    it('should handle reconnection', () => {
      component.reconnect();
      
      expect(mockChatService.stopConnection).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('User initiated reconnection');
    });
  });
});
