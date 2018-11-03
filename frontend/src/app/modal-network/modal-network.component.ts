import {Component, Input, OnInit} from '@angular/core';
import {Modal} from "../../model/modal";

@Component({
  selector: 'app-modal-network',
  templateUrl: './modal-network.component.html',
  styleUrls: ['./modal-network.component.css']
})
export class ModalNetworkComponent implements OnInit {
  @Input() modal : Modal;
  constructor() { }

  ngOnInit() {
  }

  onCloseHandled(){
    this.modal.display='none';
  }
}
