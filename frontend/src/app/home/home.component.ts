import {Component, Input, OnInit} from '@angular/core';
import {ContractService} from "../../services/contract.service";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  nextPrize: number;
  constructor(private contractService: ContractService) {

  }

  ngOnInit() {
    this.contractService.getPrize().subscribe(result=>{
      this.nextPrize = result
    });
  }

  init() {
    this.contractService.initRound(10);
    this.contractService.getPrize().subscribe(result=>{
      this.nextPrize = result
    });
  }

  buyTicket() {
    this.contractService.getPrize().subscribe(result=>{
      this.nextPrize = result
    });
    this.contractService.buyTickets([1]);
    this.contractService.getPrize().subscribe(result=>this.nextPrize = result);
  }
}
