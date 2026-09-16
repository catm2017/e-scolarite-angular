import {
  AfterViewInit,
  Directive,
  DoCheck,
  ElementRef,
  OnDestroy,
  Renderer2,
} from '@angular/core';

/**
 * Rend les <select multiple> du back-office plus lisibles sans ajouter de
 * dépendance externe. La sélection reste synchronisée avec ngModel grâce au
 * <select> natif, qui demeure la source de vérité.
 */
@Directive({
  selector: 'select[multiple]',
  standalone: true,
})
export class TemplateMultiselectDirective implements AfterViewInit, DoCheck, OnDestroy {
  private readonly select: HTMLSelectElement;
  private host: HTMLDivElement | null = null;
  private open = false;
  private query = '';
  private selectionSignature = '';
  private removeNativeChangeListener: (() => void) | null = null;
  private removeDocumentClickListener: (() => void) | null = null;
  private observer: MutationObserver | null = null;

  constructor(
    elementRef: ElementRef<HTMLSelectElement>,
    private readonly renderer: Renderer2,
  ) {
    this.select = elementRef.nativeElement;
  }

  ngAfterViewInit(): void {
    this.renderer.addClass(this.select, 'template-select2-native');
    this.renderer.setAttribute(this.select, 'tabindex', '-1');
    this.renderer.setAttribute(this.select, 'aria-hidden', 'true');

    this.host = this.renderer.createElement('div') as HTMLDivElement;
    this.renderer.addClass(this.host, 'template-select2');
    this.renderer.insertBefore(this.select.parentNode, this.host, this.select.nextSibling);

    this.removeNativeChangeListener = this.renderer.listen(this.select, 'change', () => this.render());
    this.removeDocumentClickListener = this.renderer.listen('document', 'click', (event: MouseEvent) => {
      if (this.host && !this.host.contains(event.target as Node)) this.close();
    });
    this.observer = new MutationObserver(() => this.render());
    this.observer.observe(this.select, { childList: true, subtree: true, attributes: true });
    this.render();
  }

  ngDoCheck(): void {
    const signature = this.getSelectionSignature();
    if (signature !== this.selectionSignature) this.render();
  }

  ngOnDestroy(): void {
    this.removeNativeChangeListener?.();
    this.removeDocumentClickListener?.();
    this.observer?.disconnect();
    this.host?.remove();
  }

  private render(): void {
    if (!this.host) return;
    this.selectionSignature = this.getSelectionSignature();
    this.host.replaceChildren();
    this.renderer.setAttribute(this.host, 'aria-expanded', String(this.open));

    const trigger = this.renderer.createElement('button') as HTMLButtonElement;
    trigger.type = 'button';
    this.renderer.addClass(trigger, 'template-select2__trigger');
    this.renderer.setAttribute(trigger, 'aria-haspopup', 'listbox');
    this.renderer.listen(trigger, 'click', (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      this.open = !this.open;
      this.render();
    });

    const value = this.renderer.createElement('span');
    this.renderer.addClass(value, 'template-select2__value');
    const selected = this.options.filter((option) => option.selected);
    if (!selected.length) {
      this.renderer.addClass(value, 'template-select2__placeholder');
      value.textContent = this.placeholder();
    } else if (selected.length <= 2) {
      selected.forEach((option) => {
        const chip = this.renderer.createElement('span');
        this.renderer.addClass(chip, 'template-select2__chip');
        chip.textContent = option.text;
        this.renderer.appendChild(value, chip);
      });
    } else {
      value.textContent = `${selected.length} éléments sélectionnés`;
    }

    const icon = this.renderer.createElement('i');
    this.renderer.addClass(icon, 'template-select2__arrow');
    icon.textContent = this.open ? 'expand_less' : 'expand_more';
    this.renderer.appendChild(trigger, value);
    this.renderer.appendChild(trigger, icon);
    this.renderer.appendChild(this.host, trigger);

    if (!this.open) return;
    const panel = this.renderer.createElement('div');
    this.renderer.addClass(panel, 'template-select2__panel');
    this.renderer.setAttribute(panel, 'role', 'listbox');
    this.renderer.setAttribute(panel, 'aria-multiselectable', 'true');
    this.renderer.listen(panel, 'click', (event: MouseEvent) => event.stopPropagation());

    const search = this.renderer.createElement('div');
    this.renderer.addClass(search, 'template-select2__search');
    const searchIcon = this.renderer.createElement('i');
    searchIcon.textContent = 'search';
    const input = this.renderer.createElement('input') as HTMLInputElement;
    input.type = 'search';
    input.autocomplete = 'off';
    input.placeholder = 'Rechercher…';
    input.value = this.query;
    this.renderer.listen(input, 'input', () => {
      this.query = input.value;
      this.render();
    });
    this.renderer.appendChild(search, searchIcon);
    this.renderer.appendChild(search, input);
    this.renderer.appendChild(panel, search);

    const normalizedQuery = this.query.trim().toLocaleLowerCase('fr');
    const visibleOptions = this.options.filter((option) =>
      option.text.toLocaleLowerCase('fr').includes(normalizedQuery),
    );
    const list = this.renderer.createElement('div');
    this.renderer.addClass(list, 'template-select2__options');
    if (!visibleOptions.length) {
      const empty = this.renderer.createElement('p');
      this.renderer.addClass(empty, 'template-select2__empty');
      empty.textContent = 'Aucun résultat';
      this.renderer.appendChild(list, empty);
    }
    visibleOptions.forEach((option) => this.appendOption(list, option));
    this.renderer.appendChild(panel, list);
    this.renderer.appendChild(this.host, panel);

    queueMicrotask(() => input.focus());
  }

  private appendOption(list: HTMLElement, option: HTMLOptionElement): void {
    const button = this.renderer.createElement('button') as HTMLButtonElement;
    button.type = 'button';
    this.renderer.addClass(button, 'template-select2__option');
    if (option.selected) this.renderer.addClass(button, 'is-selected');
    if (option.disabled) this.renderer.addClass(button, 'is-disabled');
    this.renderer.setAttribute(button, 'role', 'option');
    this.renderer.setAttribute(button, 'aria-selected', String(option.selected));
    button.disabled = option.disabled;

    const checkbox = this.renderer.createElement('span');
    this.renderer.addClass(checkbox, 'template-select2__check');
    const checkIcon = this.renderer.createElement('i');
    checkIcon.textContent = option.selected ? 'check' : '';
    this.renderer.appendChild(checkbox, checkIcon);
    const text = this.renderer.createElement('span');
    text.textContent = option.text;
    this.renderer.appendChild(button, checkbox);
    this.renderer.appendChild(button, text);
    this.renderer.listen(button, 'click', () => {
      option.selected = !option.selected;
      this.select.dispatchEvent(new Event('change', { bubbles: true }));
      this.render();
    });
    this.renderer.appendChild(list, button);
  }

  private close(): void {
    if (!this.open) return;
    this.open = false;
    this.query = '';
    this.render();
  }

  private get options(): HTMLOptionElement[] {
    return Array.from(this.select.options);
  }

  private placeholder(): string {
    const label = this.select.closest('label')?.querySelector(':scope > span')?.textContent?.replace('*', '').trim();
    return label ? `Choisir ${label.toLocaleLowerCase('fr')}` : 'Sélectionner des éléments';
  }

  private getSelectionSignature(): string {
    return this.options.map((option) => `${option.value}:${option.selected}:${option.text}`).join('|');
  }
}
