import {Winner} from "./winner";
import {NumberUtil} from "../util/number-util";
import {Ticket} from "./ticket";

export class Round {
  id: number;
  openTime: number;
  openTimeDisplay: string;
  closeTime = 0 as  number;
  closeTimeDisplay: string;
  winningNumber:Ticket;
  ticketPrice:number;
  prize:number;
  status: number;
  statusDisplay:string;
  private _prize:number;
  winners = [] as  Winner[];
  currentRoundDigit:number;
  totalPaid:number;

  get prizeFormated(): string {
    return NumberUtil.currencyFormat(this.prize);
  }

  get estimateDifficult():number {
    let diff = this.currentRoundDigit;
    let length = 0;
    while (Math.trunc(diff / 10) > 0) {
      diff = Math.trunc(diff / 10);
      length++;
    }
    return length;
  }

  get winningChance():number {
    return 1/this.currentRoundDigit * 100;
  }
  get ticketPriceDisplay():string {
    return NumberUtil.currencyFormat(this.ticketPrice);
  }

  get totalWinners():number {
    return this.winners.length;
  }

  get isFinished():boolean {
    console.log(this.closeTime)
    console.log(this.closeTime < new Date().getTime() /1000)
    return this.closeTime < new Date().getTime() /1000;
  }
}
