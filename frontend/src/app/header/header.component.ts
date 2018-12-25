import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import {Modal} from "../../model/modal";
import {Web3ProviderService} from "../../services/web3-provider.service";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  changeDetection:ChangeDetectionStrategy.OnPush

})
export class HeaderComponent implements OnInit {
  modal : Modal = {display: 'none'};
  selectedAddress:any;
  constructor(private web3Provider:Web3ProviderService,
              private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.web3Provider.getSelectedAddress().subscribe(address=>{
      this.selectedAddress = address;
      this.cdr.detectChanges();
    })
  }
  openModal(){
    this.modal.display = 'block';
  }
}
