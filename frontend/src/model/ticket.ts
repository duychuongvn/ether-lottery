export class Ticket {
  ticketNumber = "" as string;

  constructor(ticketNumber = "" as string) {
    this.ticketNumber = ticketNumber;
  }

  setTicketNumber(tickNumber:number) {
    this.ticketNumber = tickNumber +"";
  }

  get ticketIterators():string[] {
      let ticketArrays = [] as string[];
      for(let i = 0; i < this.ticketNumber.length;i++) {
        ticketArrays.push(this.ticketNumber.charAt(i));
      }
    return ticketArrays;
  }
}
