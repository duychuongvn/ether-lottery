import {Component, Input, OnInit} from '@angular/core';
import {Modal} from "../../model/modal";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  modal : Modal = {display: 'none'};

  constructor() { }

  ngOnInit() {
  }
  openModal(){
    this.modal.display = 'block';
  }
}
