import {
    Component,
    OnInit,
    ElementRef,
    ViewChild,
    ViewChildren,
    QueryList,
    Input,
    Output,
    EventEmitter,
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
export class SelectTypeaheadComponent<T = any> implements OnInit, ControlValueAccessor, AfterViewChecked {
    @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;
    @ViewChildren('optionRef') optionRefs!: QueryList<ElementRef>;

    @Input() compareWith: (a: T | null, b: T | null) => boolean = (a, b) =>
        JSON.stringify(a) === JSON.stringify(b);
    @Input() autoSelectOnPartialMatch: boolean = false;
    @Input() suggestFirstMatch: boolean = false;

    private _options: SelectOption<T>[] = [];
    @Input()
    set options(value: SelectOption<T>[]) {
        this._options = value || [];
        this.optionsInitialized = true;
        if (this.initialValue !== null) {
            this.setValueFromOptions(this.initialValue);
        }
        this.filterOptions(this.formControl.value || '');
    }
    get options(): SelectOption<T>[] {
        return this._options;
    }

    @Output() valueChange = new EventEmitter<T | null>();
    @Output() autoMatched = new EventEmitter<'exact' | 'fuzzy' | null>();

    formControl = new FormControl<string>('');
    filteredOptions: SelectOption<T>[] = [];

    showDropdown = false;
    highlightedIndex = -1;
    disabled = false;

    private onChange = (_: T | null) => { };
    private onTouched = () => { };
    private previousHighlightedIndex = -1;
    private selectedOption: SelectOption<T> | null = null;
    private initialValue: T | null = null;
    private optionsInitialized = false;
    private clickedInside = false;

    constructor(private cdr: ChangeDetectorRef) { }

    ngOnInit(): void {
        this.formControl.valueChanges.subscribe(value => {
            if (this.inputRef?.nativeElement === document.activeElement) {
                this.showDropdown = true;
            }

            this.filterOptions(value || '');
            this.highlightedIndex = -1;

            const exactMatch = this.options.find(opt =>
                opt.label.toLowerCase() === (value || '').toLowerCase()
            );

            if (!exactMatch) {
                this.onChange(null);
                this.valueChange.emit(null);
            }

            // ✅ Suggest the first match only if enabled
            if (this.suggestFirstMatch && this.filteredOptions.length === 1) {
                const first = this.filteredOptions[0];
                const typedValue = (value || '').toLowerCase();
                if (first.label.toLowerCase().startsWith(typedValue)) {
                    this.formControl.setValue(first.label, { emitEvent: false });
                }
            }

            this.cdr.markForCheck();
        });
    }

    writeValue(value: T | null): void {
        this.initialValue = value;
        if (this.optionsInitialized) {
            this.setValueFromOptions(value);
        }
    }

    private setValueFromOptions(value: T | null): void {
        const match = this.options.find(opt => this.compareWith(opt.value, value)) || null;
        this.selectedOption = match;
        this.formControl.setValue(match?.label || '', { emitEvent: false });

        if (match) {
            this.onChange(match.value);
            this.valueChange.emit(match.value);
        } else {
            this.onChange(null);
            this.valueChange.emit(null);
        }

        this.cdr.markForCheck();
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
        this.cdr.markForCheck();
    }

    selectOption(option: SelectOption<T>): void {
        this.selectedOption = option;
        this.formControl.setValue(option.label, { emitEvent: false });
        this.showDropdown = false;
        this.highlightedIndex = -1;

        this.onChange(option.value);
        this.valueChange.emit(option.value);
        this.onTouched();
        this.cdr.markForCheck();
    }

    clearSelection(): void {
        this.formControl.setValue('');
        this.selectedOption = null;
        this.filteredOptions = [];
        this.highlightedIndex = -1;

        this.onChange(null);
        this.valueChange.emit(null);
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
        const clickedInput = this.inputRef?.nativeElement.contains(target);
        const clickedDropdown = !!this.optionRefs.find(ref =>
            ref.nativeElement.contains(target)
        );

        if (!clickedInput && !clickedDropdown) {
            this.autoSelectIfMatch();

            this.showDropdown = false;
            this.highlightedIndex = -1;
            this.cdr.markForCheck();
        }

        this.clickedInside = false;
    }

    private autoSelectIfMatch(): void {
        const inputValue = (this.formControl.value || '').toLowerCase().trim();
        if (!inputValue) return;

        const exactMatch = this.options.find(
            opt => opt.label.toLowerCase().trim() === inputValue
        );

        if (exactMatch) {
            this.selectOption(exactMatch);
            this.autoMatched.emit('exact');
            return;
        }

        if (this.autoSelectOnPartialMatch) {
            const partialMatches = this.options.filter(opt =>
                opt.label.toLowerCase().includes(inputValue)
            );

            if (partialMatches.length === 1) {
                this.selectOption(partialMatches[0]);
                this.autoMatched.emit('fuzzy');
            } else {
                this.autoMatched.emit(null);
            }
        }

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
