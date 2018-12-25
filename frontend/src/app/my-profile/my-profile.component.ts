import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {ContractService} from "../../services/contract.service";
import {UserHistory} from "../../model/user-history";
import {Web3ProviderService} from "../../services/web3-provider.service";
import {Page} from "../../model/page";
import {PageRequest} from "../../model/page-request";

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.css'],
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class MyProfileComponent implements OnInit {

  constructor(private contractService:ContractService,
              private web3Service: Web3ProviderService,
              private cdr: ChangeDetectorRef) { }

  userHistories: Page<UserHistory>;
  requiredSignMetamask: boolean;
  address:any;
  ngOnInit() {
    this.web3Service.getSelectedAddress().subscribe((addr:any)=>{
      this.address = addr;
      this.loadUserHistory();
    })
    this.contractService.isUserConnectingToNetwork().subscribe(connected => {
      this.requiredSignMetamask = !connected;
      this.cdr.detectChanges();
    })

  }

  loadUserHistory():void {
    this.contractService.getUserHistories(this.address,new PageRequest(0)).subscribe(result=>{
      this.userHistories = result;
      console.log(result)
      this.cdr.detectChanges();
    })
  }
}
