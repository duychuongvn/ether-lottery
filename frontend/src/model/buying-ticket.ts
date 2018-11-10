import {Ticket} from "./ticket";
import {NumberUtil} from "../util/number-util";

export class BuyingTicket {

  private _tickPrice:number;
  private _tickets = [] as Ticket[];


  constructor(ticketPrice:number) {
    this._tickPrice = ticketPrice;
  }

  public addTickets(tickets: Ticket[]) {
   this._tickets = tickets.filter(x=>x.ticketNumber != null);
  }


  get totalTicket(): number {
    return this.tickets.length;
  }


  get totalPaid(): number|string {
    return NumberUtil.currencyFormat(this.tickets.length * this.tickPrice);
  }


  get tickPrice(): number {
    return this._tickPrice;
  }

  get ticketPriceDisplay():string {
    return NumberUtil.currencyFormat(this.tickPrice);
  }

  get tickets(): Ticket[] {
    return this._tickets;
  }

}
