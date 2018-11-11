import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { FormsModule } from '@angular/forms';
import { BuyTicketComponent } from './buy-ticket/buy-ticket.component';
import { CountdownComponent } from './countdown/countdown.component';
import { ModalNetworkComponent } from './modal-network/modal-network.component';
import { MyProfileComponent } from './my-profile/my-profile.component';
import { RoundHistoryComponent } from './round-history/round-history.component';
import { AdminComponent } from './admin/admin.component';


const appRoutes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'buy-ticket', component: BuyTicketComponent },
  { path: 'my-profile', component: MyProfileComponent },
  { path: 'round/:id', component: RoundHistoryComponent },
  { path: 'admin', component: AdminComponent },
  { path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  { path: '**', component: PageNotFoundComponent }
];
@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    HeaderComponent,
    FooterComponent,
    PageNotFoundComponent,
    BuyTicketComponent,
    CountdownComponent,
    ModalNetworkComponent,
    MyProfileComponent,
    RoundHistoryComponent,
    AdminComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    RouterModule.forRoot(
      appRoutes, {enableTracing: false}
    )
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
