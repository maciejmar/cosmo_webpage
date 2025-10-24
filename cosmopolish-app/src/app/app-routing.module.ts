import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InfoPlComponent } from './info-pl/info-pl.component';
import { InfoEnComponent } from './info-en/info-en.component';
import { ContactComponent } from './contact/contact.component';

const routes: Routes = [
  { path: '', redirectTo: '/info-pl', pathMatch: 'full' },
  { path: 'info-pl', component: InfoPlComponent },
  { path: 'info-en', component: InfoEnComponent },
  { path: 'contact', component: ContactComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
