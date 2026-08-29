import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface AssistantMessage {
  author: 'assistant' | 'user';
  text: string;
  time: string;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './ai-assistant.component.html',
  styleUrl: './ai-assistant.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiAssistantComponent {
  private readonly router = inject(Router);

  readonly isOpen = signal(false);
  readonly isListening = signal(false);
  readonly isThinking = signal(false);
  readonly messages = signal<AssistantMessage[]>([
    {
      author: 'assistant',
      text: 'Bonjour 👋 Je suis votre assistant E‑Scolarité. Comment puis-je vous aider ?',
      time: this.currentTime(),
    },
  ]);

  draft = '';

  toggle(): void {
    this.isOpen.update((value) => !value);
  }

  close(): void {
    this.isOpen.set(false);
  }

  sendShortcut(text: string): void {
    this.draft = text;
    this.send();
  }

  send(): void {
    const text = this.draft.trim();
    if (!text || this.isThinking()) {
      return;
    }

    this.messages.update((messages) => [
      ...messages,
      { author: 'user', text, time: this.currentTime() },
    ]);
    this.draft = '';
    this.isThinking.set(true);

    window.setTimeout(() => {
      this.messages.update((messages) => [
        ...messages,
        {
          author: 'assistant',
          text: this.contextualReply(),
          time: this.currentTime(),
        },
      ]);
      this.isThinking.set(false);
    }, 650);
  }

  toggleVoice(): void {
    this.isListening.update((value) => !value);
  }

  private contextualReply(): string {
    const url = this.router.url;

    if (url.startsWith('/saas')) {
      return 'Je peux vous aider à analyser les souscriptions, configurer une offre ou retrouver un établissement.';
    }

    if (url.startsWith('/institut/site-web')) {
      return 'Je peux rédiger un contenu, préparer une actualité ou vous guider dans la publication du site.';
    }

    if (url.startsWith('/institut')) {
      return 'Je peux vous assister pour les inscriptions, les paiements, les absences et les communications aux familles.';
    }

    return 'Je peux vous présenter E‑Scolarité et vous orienter vers les fonctionnalités adaptées à votre établissement.';
  }

  private currentTime(): string {
    return new Intl.DateTimeFormat('fr-SN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());
  }
}
