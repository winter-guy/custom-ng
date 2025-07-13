import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SelectTypeaheadComponent } from './select-typeahead/selct.component';

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
  ngOnInit(): void {

    this.form = this.fb.group({
      fruit: ['']
    });
  }
}
