import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AgmCoreModule } from '@agm/core';
import { AgmDirectionModule } from 'agm-direction';
import { GooglePlaceModule } from "ngx-google-places-autocomplete";
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';

import { AppRoutingModule } from './app.routing';
import { AppComponent } from './app.component';
import { FieldErrorDisplayComponent } from './field-error-display/field-error-display.component';

@NgModule({
  declarations: [
    AppComponent,
    FieldErrorDisplayComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyDeiK3c8BMws7C8PXOxxaLaNXfj0x74tqg',
      libraries: ['places', 'geometry'],
      region: 'BR'
    }),
    AgmDirectionModule,
    GooglePlaceModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'pt-BR' }],
  bootstrap: [AppComponent]
})
export class AppModule { }