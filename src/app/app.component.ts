import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SelectOption, SelectTypeaheadComponent } from './select-typeahead/selct.component';
interface User {
  id: number;
  fullName: string;
}
@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule, SelectTypeaheadComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'custom-ng';

  fb = inject(FormBuilder);
  form!: FormGroup;
 compareUser = (a: User | null, b: User | null): boolean =>
  !!a && !!b && a.id === b.id;

  options: SelectOption<User>[] = [
    { label: 'Alice Johnson', value: { id: 1, fullName: 'Alice Johnson' } },
    { label: 'Bob Smith', value: { id: 2, fullName: 'Bob Smith' } },
    { label: 'Charlie Brown', value: { id: 3, fullName: 'Charlie Brown' } }
  ];


  ngOnInit(): void {

    this.form = this.fb.group({
      fruit: [{ id: 1, fullName: 'Alice Johnson' }]
    });
  }

  onFruitChange(selectedValue: any) {
    console.log('Selected fruit:', selectedValue);
  }
}
