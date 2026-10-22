import { Directive, ElementRef, EventEmitter, HostBinding, HostListener, Input, Output, inject } from '@angular/core';

/** Keep plain text in the existing block model without replacing DOM on each keystroke. */
@Directive({ selector: '[appInlineText]', standalone: true })
export class InlineTextDirective {
  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;
  @Input() @HostBinding('attr.aria-readonly') inlineDisabled = false;
  @HostBinding('attr.contenteditable') get editable(): string { return this.inlineDisabled ? 'false' : 'plaintext-only'; }
  @HostBinding('attr.role') readonly role = 'textbox';
  @HostBinding('attr.aria-multiline') readonly multiline = 'true';
  @HostBinding('attr.spellcheck') readonly spellcheck = 'true';
  @HostBinding('attr.tabindex') readonly tabIndex = 0;
  @Output() appInlineTextChange = new EventEmitter<string>();
  @Input() set appInlineText(value: string) {
    const text = value || '';
    if (this.element.innerText !== text) this.element.textContent = text;
  }
  @HostListener('input', ['$event']) input(event: InputEvent): void {
    if (!this.inlineDisabled && !event.isComposing) this.emit();
  }
  @HostListener('compositionend') compositionEnd(): void { if (!this.inlineDisabled) this.emit(); }
  @HostListener('paste', ['$event']) paste(event: ClipboardEvent): void {
    event.preventDefault();
    if (this.inlineDisabled) return;
    this.insert(event.clipboardData?.getData('text/plain') || '');
  }
  // Prevent dropped HTML/images from entering the editable DOM.
  @HostListener('drop', ['$event']) drop(event: DragEvent): void { event.preventDefault(); }
  private insert(text: string): void {
    const selection = this.element.ownerDocument.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (!this.element.contains(range.commonAncestorContainer)) return;
    range.deleteContents();
    const node = this.element.ownerDocument.createTextNode(text);
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    this.emit();
  }
  private emit(): void { this.appInlineTextChange.emit(this.element.innerText.replace(/\r\n/g, '\n')); }
}
