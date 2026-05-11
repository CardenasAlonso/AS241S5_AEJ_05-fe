import { Routes } from '@angular/router';
import { IaCrudComponent } from './features/ia-crud/ia-crud';

export const routes: Routes = [
  { path: '', component: IaCrudComponent },

  { path: '**', redirectTo: '' } 
];