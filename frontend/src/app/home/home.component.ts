import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import {ContractService} from "../../services/contract.service";
import {Round} from "../../model/round";
import {Web3ProviderService} from "../../services/web3-provider.service";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {

  nextRound: Round;
  rounds: Round[];
  address: any;
  constructor(private contractService: ContractService,
              private web3Service: Web3ProviderService,
              private cdr: ChangeDetectorRef) {
    this.nextRound = new Round();
    this.rounds = [] as Round[];
  }

  ngOnInit() {
    this.contractService.getCurrentRound().subscribe(result=>{
      this.nextRound = result
      this.cdr.detectChanges();
    });
   this.listRounds();
   this.web3Service.getSelectedAddress().subscribe((res:any)=>{
     this.address = res;
   })
  }

  init() {
    this.contractService.initRound(this.address,10);
    this.contractService.getCurrentRound().subscribe(result=>{
      this.nextRound = result
    });

  }

  buyTicket() {
    this.listRounds();
  }

  listRounds() {
    this.contractService.listRounds(0).subscribe((result=>{
      this.rounds = result;
      console.log(result)
      this.cdr.detectChanges();
    }))
  }
}
