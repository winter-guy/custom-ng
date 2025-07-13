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
  AfterViewChecked,
  EventEmitter,
  Output
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormControl,
  ReactiveFormsModule
} from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface SelectOption<T = any> {
  label: string;
  value: T;
}

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
export class SelectTypeaheadComponent<T = any>
  implements OnInit, ControlValueAccessor, AfterViewChecked
{
  @Input() options: SelectOption<T>[] = [];

  @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;
  @ViewChildren('optionRef') optionRefs!: QueryList<ElementRef>;
  @Output() valueChange = new EventEmitter<T | null>();

  formControl = new FormControl<string>('');
  filteredOptions: SelectOption<T>[] = [];

  showDropdown = false;
  highlightedIndex = -1;
  disabled = false;

  private onChange = (_: T | null) => {};
  private onTouched = () => {};
  private previousHighlightedIndex = -1;
  private clickedInside = false;
  private selectedOption: SelectOption<T> | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.formControl.valueChanges.subscribe(value => {
      if (this.inputRef?.nativeElement === document.activeElement) {
        this.showDropdown = true;
      }
      this.filterOptions(value || '');
      this.highlightedIndex = -1;
      this.onChange(null);
      this.cdr.markForCheck();
    });
  }

  writeValue(value: T | null): void {
    const match = this.options.find(opt => opt.value === value) || null;
    this.selectedOption = match;
    this.formControl.setValue(match?.label || '', { emitEvent: false });
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
      opt.label.toLowerCase().includes(val)
    );
  }

  selectOption(option: SelectOption<T>): void {
  this.selectedOption = option;
  this.formControl.setValue(option.label);
  this.showDropdown = false;
  this.highlightedIndex = -1;

  this.onChange(option.value);
  this.valueChange.emit(option.value); // ✅ emit value here
  this.onTouched();
  this.cdr.markForCheck();
}


  clearSelection(): void {
  this.formControl.setValue('');
  this.selectedOption = null;
  this.filteredOptions = [];
  this.highlightedIndex = -1;
  this.onChange(null);
  this.valueChange.emit(null); // ✅ emit null when cleared
  this.onTouched();
  this.showDropdown = false;
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
    if (!this.showDropdown || !this.filteredOptions.length) return;

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
