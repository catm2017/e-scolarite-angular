import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  Directive,
  ElementRef,
  OnDestroy,
  effect,
  inject,
} from '@angular/core';
import { LanguageService } from '../service/language.service';
import {
  PLATFORM_TRANSLATIONS,
  translatePlatformText,
} from './platform-translations';

const TRANSLATABLE_ATTRIBUTES = ['aria-label', 'placeholder', 'title', 'alt'];

@Directive({
  selector: '[appPlatformI18n]',
  standalone: true,
})
export class PlatformI18nDirective implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject<Document>(DOCUMENT);
  private readonly language = inject(LanguageService);
  private readonly originals = new WeakMap<Node, string>();
  private readonly rendered = new WeakMap<Node, string>();
  private readonly attributeOriginals = new WeakMap<Element, Map<string, string>>();
  private observer?: MutationObserver;

  constructor() {
    effect(() => {
      this.language.locale();
      queueMicrotask(() => this.translateTree(this.document.body ?? this.host));
    });
  }

  ngAfterViewInit(): void {
    const root = this.document.body ?? this.host;
    this.translateTree(root);
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          this.translateTextNode(mutation.target);
        } else if (mutation.type === 'attributes') {
          this.translateAttributes(mutation.target as Element);
        } else {
          mutation.addedNodes.forEach((node) => this.translateTree(node));
        }
      }
    });
    this.observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: TRANSLATABLE_ATTRIBUTES,
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private translateTree(root: Node): void {
    if (root.nodeType === Node.TEXT_NODE) {
      this.translateTextNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const element = root as Element;
    this.translateAttributes(element);
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    );
    let node: Node | null = walker.nextNode();
    while (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        this.translateTextNode(node);
      } else {
        this.translateAttributes(node as Element);
      }
      node = walker.nextNode();
    }
  }

  private translateTextNode(node: Node): void {
    const current = node.nodeValue ?? '';
    const trimmed = current.trim();
    if (!trimmed) {
      return;
    }

    const lastRendered = this.rendered.get(node);
    if (!this.originals.has(node) || (lastRendered !== undefined && current !== lastRendered)) {
      this.originals.set(node, trimmed);
    }
    const original = this.originals.get(node) ?? trimmed;
    const translated = translatePlatformText(original, this.language.locale());
    if (translated === original && !PLATFORM_TRANSLATIONS[original]) {
      return;
    }

    const leading = current.match(/^\s*/)?.[0] ?? '';
    const trailing = current.match(/\s*$/)?.[0] ?? '';
    const next = `${leading}${translated}${trailing}`;
    this.rendered.set(node, next);
    if (current !== next) {
      node.nodeValue = next;
    }
  }

  private translateAttributes(element: Element): void {
    let originals = this.attributeOriginals.get(element);
    if (!originals) {
      originals = new Map<string, string>();
      this.attributeOriginals.set(element, originals);
    }

    for (const attribute of TRANSLATABLE_ATTRIBUTES) {
      const current = element.getAttribute(attribute);
      if (!current) {
        continue;
      }
      const previousOriginal = originals.get(attribute);
      const previousRendered = previousOriginal
        ? translatePlatformText(previousOriginal, this.language.locale())
        : undefined;
      if (!previousOriginal || (current !== previousRendered && PLATFORM_TRANSLATIONS[current])) {
        originals.set(attribute, current);
      }
      const original = originals.get(attribute) ?? current;
      const translated = translatePlatformText(original, this.language.locale());
      if (translated !== current) {
        element.setAttribute(attribute, translated);
      }
    }
  }
}
