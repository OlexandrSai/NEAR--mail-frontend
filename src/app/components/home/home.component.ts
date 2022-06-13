import { Component, OnInit } from '@angular/core';
import {MailService} from "../../services/mail.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor(public mailService: MailService, public router: Router) { }

  ngOnInit(): void {
    if (this.mailService.nearService.accountId !== '') {
      this.router.navigate(['dashboard']);
    }
  }

  async signIn() {
    await this.mailService.nearService.handleSignIn();
  }

}
