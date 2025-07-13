import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  ViewChildren,
  QueryList,
  Input,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  forwardRef,
  HostListener,
  AfterViewChecked
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormControl,
  ReactiveFormsModule
} from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-select-typeahead',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectTypeaheadComponent),
      multi: true
    }
  ]
})
export class SelectTypeaheadComponent
  implements OnInit, ControlValueAccessor, AfterViewChecked
{
  @Input() options: string[] = [];

  @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;
  @ViewChildren('optionRef') optionRefs!: QueryList<ElementRef>;

  formControl = new FormControl<string>('');
  filteredOptions: string[] = [];

  showDropdown = false;
  highlightedIndex = -1;
  disabled = false;

  private onChange = (_: any) => {};
  private onTouched = () => {};
  private previousHighlightedIndex = -1;
  private clickedInside = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.formControl.valueChanges.subscribe(value => {
      if (this.inputRef?.nativeElement === document.activeElement) {
        this.showDropdown = true;
      }
      this.filterOptions(value || '');
      this.onChange(value);
      this.highlightedIndex = -1;
      this.cdr.markForCheck();
    });
  }

  writeValue(value: string): void {
    this.formControl.setValue(value, { emitEvent: false });
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    isDisabled ? this.formControl.disable() : this.formControl.enable();
  }

  filterOptions(query: string): void {
    const val = query.toLowerCase();
    this.filteredOptions = this.options.filter(opt =>
      opt.toLowerCase().includes(val)
    );
    this.cdr.markForCheck();
  }

  selectOption(option: string): void {
    this.formControl.setValue(option);
    this.showDropdown = false;
    this.highlightedIndex = -1;
    this.onTouched();
    this.cdr.markForCheck();
  }

  onFocus(): void {
    this.showDropdown = true;
    this.filterOptions(this.formControl.value || '');
  }

  onInputMouseDown(): void {
    this.clickedInside = true;
  }

  @HostListener('document:mousedown', ['$event.target'])
  onDocumentClick(target: HTMLElement): void {
    const isInside = this.inputRef?.nativeElement.contains(target);
    if (!isInside && !this.clickedInside) {
      this.showDropdown = false;
      this.highlightedIndex = -1;
      this.cdr.markForCheck();
    }
    this.clickedInside = false;
  }

  onKeydown(event: KeyboardEvent): void {
    if (!this.showDropdown || this.filteredOptions.length === 0) return;

    const lastIndex = this.filteredOptions.length - 1;

    const keyMap: Record<string, () => void> = {
      ArrowDown: () => {
        this.highlightedIndex =
          (this.highlightedIndex + 1) % this.filteredOptions.length;
      },
      ArrowUp: () => {
        this.highlightedIndex =
          (this.highlightedIndex - 1 + this.filteredOptions.length) %
          this.filteredOptions.length;
      },
      Enter: () => {
        if (this.highlightedIndex >= 0) {
          this.selectOption(this.filteredOptions[this.highlightedIndex]);
        }
      },
      Escape: () => {
        this.showDropdown = false;
        this.highlightedIndex = -1;
      }
    };

    if (event.key in keyMap) {
      keyMap[event.key]!();
      event.preventDefault();
      this.cdr.markForCheck();
    }
  }

  ngAfterViewChecked(): void {
    if (
      this.highlightedIndex !== this.previousHighlightedIndex &&
      this.highlightedIndex >= 0 &&
      this.optionRefs?.length
    ) {
      this.scrollToHighlighted();
      this.previousHighlightedIndex = this.highlightedIndex;
    }
  }

  private scrollToHighlighted(): void {
    const el = this.optionRefs.get(this.highlightedIndex);
    el?.nativeElement?.scrollIntoView({
      block: 'nearest',
      behavior: 'auto'
    });
  }
}
