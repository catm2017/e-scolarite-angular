import { Component, ElementRef, inject, viewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { AiService } from '@core/service/ai.service';

interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ai-chat',
  templateUrl: './ai-chat.component.html',
  styleUrls: ['./ai-chat.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule, DragDropModule]
})
export class AiChatComponent {
    private cdr = inject(ChangeDetectorRef);
  private readonly chatBody = viewChild.required<ElementRef>('chatBody');
  private aiService = inject(AiService);

  isOpen = false;
  isLoading = false;
  userInput = '';
  messages: ChatMessage[] = [];
  isDragging = false;

  onDragStart() {
    this.isDragging = true;
  }

  onDragEnd() {
    setTimeout(() => {
      this.isDragging = false;
      this.cdr.markForCheck();
    }, 50);
  }

  toggleChat() {
    if (this.isDragging) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen && this.messages.length > 0) {
      this.scrollToBottom();
    }
  }

  sendShortcut(message: string) {
    this.userInput = message;
    this.sendMessage();
  }

  sendMessage() {
    const text = this.userInput.trim();
    if (!text || this.isLoading) return;

    // Add user message
    this.messages.push({
      text: text,
      isUser: true,
      timestamp: new Date()
    });

    this.userInput = '';
    this.isLoading = true;
    this.scrollToBottom();

    this.aiService.postPrompt(text).subscribe({
      next: (response) => {
        this.messages.push({
          text: response,
          isUser: false,
          timestamp: new Date()
        });
        this.isLoading = false;
        this.scrollToBottom();
            this.cdr.markForCheck();
      },
      error: (err) => {
        this.messages.push({
          text: 'Oops! ' + err.message,
          isUser: false,
          timestamp: new Date()
        });
        this.isLoading = false;
        this.scrollToBottom();
        this.cdr.markForCheck();
      }
    });
  }

  private scrollToBottom() {
    setTimeout(() => {
      try {
        this.chatBody().nativeElement.scrollTop = this.chatBody().nativeElement.scrollHeight;
      } catch (err) {
        console.error(err);
      }
    }, 100);
  }
}
