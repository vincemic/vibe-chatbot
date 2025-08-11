import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { NGXLogger } from 'ngx-logger';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  messages: ChatMessage[] = [];
  newMessage: string = '';
  isConnected: boolean = false;
  isTyping: boolean = false;
  userName: string = 'User';
  
  private subscriptions: Subscription[] = [];

  constructor(
    private chatService: ChatService,
    private logger: NGXLogger
  ) {}

  async ngOnInit(): Promise<void> {
    this.logger.info('Chat component initialized');
    
    // Subscribe to messages
    this.subscriptions.push(
      this.chatService.messages$.subscribe(messages => {
        this.messages = messages;
        setTimeout(() => this.scrollToBottom(), 100);
      })
    );

    // Subscribe to connection state
    this.subscriptions.push(
      this.chatService.connectionState$.subscribe(state => {
        this.isConnected = state;
        this.logger.info('Connection state changed', { isConnected: state });
      })
    );

    // Subscribe to typing indicator
    this.subscriptions.push(
      this.chatService.isTyping$.subscribe(typing => {
        this.isTyping = typing;
        if (typing) {
          setTimeout(() => this.scrollToBottom(), 100);
        }
      })
    );

    // Start SignalR connection
    try {
      await this.chatService.startConnection();
    } catch (error) {
      this.logger.error('Failed to start chat service', error);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.chatService.stopConnection();
    this.logger.info('Chat component destroyed');
  }

  async sendMessage(): Promise<void> {
    if (this.newMessage.trim() && this.isConnected) {
      const message = this.newMessage.trim();
      this.newMessage = '';
      
      try {
        await this.chatService.sendMessage(this.userName, message);
        this.logger.info('Message sent successfully', { message });
      } catch (error) {
        this.logger.error('Failed to send message', error);
      }
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = 
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (error) {
      this.logger.error('Error scrolling to bottom', error);
    }
  }

  clearChat(): void {
    this.chatService.clearMessages();
    this.logger.info('Chat cleared by user');
  }

  reconnect(): void {
    this.logger.info('User initiated reconnection');
    this.chatService.stopConnection().then(() => {
      setTimeout(() => this.chatService.startConnection(), 1000);
    });
  }
}
