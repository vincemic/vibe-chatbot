import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';
import { NGXLogger } from 'ngx-logger';

export interface ChatMessage {
  user: string;
  message: string;
  timestamp: Date;
  isFromBot: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private hubConnection: HubConnection | null = null;
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private connectionStateSubject = new BehaviorSubject<boolean>(false);
  private isTypingSubject = new BehaviorSubject<boolean>(false);

  public messages$ = this.messagesSubject.asObservable();
  public connectionState$ = this.connectionStateSubject.asObservable();
  public isTyping$ = this.isTypingSubject.asObservable();

  constructor(private logger: NGXLogger) {}

  public async startConnection(): Promise<void> {
    try {
      // Use HTTP in development for better browser compatibility
      const hubUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:5204/chathub'  // HTTP for localhost
        : 'https://localhost:7271/chathub'; // HTTPS for production
        
      this.hubConnection = new HubConnectionBuilder()
        .withUrl(hubUrl)
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();

      this.hubConnection.on('ReceiveMessage', (user: string, message: string) => {
        this.logger.info('Message received from SignalR', { user, message });
        this.addMessage(user, message, user === 'Assistant');
        this.isTypingSubject.next(false);
      });

      this.hubConnection.onreconnecting(() => {
        this.logger.info('SignalR connection lost, attempting to reconnect...');
        this.connectionStateSubject.next(false);
      });

      this.hubConnection.onreconnected(() => {
        this.logger.info('SignalR connection reestablished');
        this.connectionStateSubject.next(true);
      });

      this.hubConnection.onclose(() => {
        this.logger.info('SignalR connection closed');
        this.connectionStateSubject.next(false);
      });

      await this.hubConnection.start();
      this.connectionStateSubject.next(true);
      this.logger.info('SignalR connection established successfully');
    } catch (error) {
      this.logger.error('Error starting SignalR connection', error);
      this.connectionStateSubject.next(false);
    }
  }

  public async sendMessage(user: string, message: string): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === 'Connected') {
      try {
        this.addMessage(user, message, false);
        this.isTypingSubject.next(true);
        this.logger.info('Sending message via SignalR', { user, message });
        await this.hubConnection.invoke('SendMessage', user, message);
      } catch (error) {
        this.logger.error('Error sending message via SignalR', error);
        this.isTypingSubject.next(false);
      }
    } else {
      this.logger.warn('Cannot send message: SignalR connection not established');
    }
  }

  public async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
        this.logger.info('SignalR connection stopped');
      } catch (error) {
        this.logger.error('Error stopping SignalR connection', error);
      }
    }
  }

  private addMessage(user: string, message: string, isFromBot: boolean): void {
    const currentMessages = this.messagesSubject.value;
    const newMessage: ChatMessage = {
      user,
      message,
      timestamp: new Date(),
      isFromBot
    };
    this.messagesSubject.next([...currentMessages, newMessage]);
  }

  public clearMessages(): void {
    this.messagesSubject.next([]);
    this.logger.info('Chat messages cleared');
  }
}
