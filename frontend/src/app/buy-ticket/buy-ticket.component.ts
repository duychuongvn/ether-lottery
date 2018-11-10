import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {Ticket} from "../../model/ticket";
import {ContractService} from "../../services/contract.service";
import {Web3ProviderService} from "../../services/web3-provider.service";
import {Round} from "../../model/round";
import {BuyingTicket} from "../../model/buying-ticket";
import {Modal} from "../../model/modal";
import {AppInfo} from "../../model/app-info";

@Component({
  selector: 'app-buy-ticket',
  templateUrl: './buy-ticket.component.html',
  styleUrls: ['./buy-ticket.component.css'],
  changeDetection:ChangeDetectionStrategy.OnPush

})
export class BuyTicketComponent implements OnInit {

  requiredSignMetamask: boolean;
  constructor(private contractService: ContractService,
              private web3Service:Web3ProviderService,
              private cdr: ChangeDetectorRef) { }

  tickets : Ticket[];
  round: Round;
  address:any;
  modal:Modal;
  buyingTicket: BuyingTicket;
  appInfo = new AppInfo();

  ngOnInit() {
    this.requiredSignMetamask = false;
    this.tickets = [];
    this.modal = new Modal();
    this.tickets.push(new Ticket());
    this.web3Service.getSelectedAddress().subscribe((res:any)=>{
      this.address = res;
    })
    this.contractService.getCurrentRound().subscribe(round=>{
      this.round = round;
      this.cdr.detectChanges();
      this.buyingTicket = new BuyingTicket(round.ticketPrice);
    })
  }

  addTicket() : void{
    this.tickets.push(new Ticket());
  }
  removeTicket(ticket: Ticket): void {
    let index = this.tickets.indexOf(ticket);
    if(index>0)
    this.tickets.splice(index, 1)
  }


   buyTicket() : void {
     this.buyingTicket.addTickets(this.tickets);
     this.modal.display = 'block';
   }
  confirmPayment() : void {
    this.contractService.buyTickets(this.address, this.buyingTicket.tickets).subscribe(result=>{
      this.onCloseHandled();
    })
    this.modal.display = 'block';
  }

  onCloseHandled():void{
    this.modal.display = 'none';
  }
}
