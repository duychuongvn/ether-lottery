import { Component, OnInit } from '@angular/core';
import {Ticket} from "../../model/ticket";

@Component({
  selector: 'app-buy-ticket',
  templateUrl: './buy-ticket.component.html',
  styleUrls: ['./buy-ticket.component.css']
})
export class BuyTicketComponent implements OnInit {

  requiredSignMetamask: boolean;
  constructor() { }

  tickets : Ticket[]
  ngOnInit() {
    this.requiredSignMetamask = false;
    this.tickets = [];
    this.tickets.push(new Ticket());
  }

  addTicket() : void{
    this.tickets.push(new Ticket());
  }
  removeTicket(ticket: Ticket): void {
    let index = this.tickets.indexOf(ticket);
    if(index>0)
    this.tickets.splice(index, 1)
  }
}
