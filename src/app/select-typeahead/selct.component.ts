import { CommonModule } from '@angular/common';
import {
    Component,
    OnInit,
    ElementRef,
    ViewChild,
    forwardRef,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    HostListener,
    Input,
    QueryList,
    ViewChildren
} from '@angular/core';
import {
    ControlValueAccessor,
    NG_VALUE_ACCESSOR,
    FormControl,
    ReactiveFormsModule
} from '@angular/forms';

@Component({
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule],
    selector: 'app-select-typeahead',
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
export class SelectTypeaheadComponent implements ControlValueAccessor, OnInit {
    @Input() options: string[] = [];
    @ViewChildren('optionRef') optionRefs!: QueryList<ElementRef>;


    formControl = new FormControl('');
    filteredOptions: string[] = [];

    showDropdown = false;
    highlightedIndex = -1;
    disabled = false;

    @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;

    private onChange = (_: any) => { };
    private onTouched = () => { };

    constructor(private cdr: ChangeDetectorRef) { }

    ngOnInit(): void {
        this.formControl.valueChanges.subscribe(value => {
            // Only open dropdown if user typed something
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
        this.onTouched();
        this.cdr.markForCheck();
    }

    onFocus(): void {
        this.showDropdown = true;
        this.filterOptions(this.formControl.value || '');
    }

    onBlur(): void {
        setTimeout(() => {
            this.showDropdown = false;
            this.cdr.markForCheck();
        }, 100);
    }

    onKeydown(event: KeyboardEvent): void {
        if (!this.showDropdown || this.filteredOptions.length === 0) return;

        const lastIndex = this.filteredOptions.length - 1;

        if (event.key === 'ArrowDown') {
            this.highlightedIndex =
                this.highlightedIndex < lastIndex ? this.highlightedIndex + 1 : 0;
            event.preventDefault();
            this.cdr.markForCheck();
        } else if (event.key === 'ArrowUp') {
            this.highlightedIndex =
                this.highlightedIndex > 0 ? this.highlightedIndex - 1 : lastIndex;
            event.preventDefault();
            this.cdr.markForCheck();
        } else if (event.key === 'Enter' && this.highlightedIndex >= 0) {
            this.selectOption(this.filteredOptions[this.highlightedIndex]);
            event.preventDefault();
        } else if (event.key === 'Escape') {
            this.showDropdown = false;
            this.highlightedIndex = -1;
            event.preventDefault();
            this.cdr.markForCheck();
        }
    }



    @HostListener('document:click', ['$event.target'])
    onDocumentClick(target: HTMLElement) {
        if (!this.inputRef?.nativeElement.contains(target)) {
            this.showDropdown = false;
            this.cdr.markForCheck();
        }
    }

    private previousHighlightedIndex = -1;

    // ...

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

