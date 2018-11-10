import {Winner} from "./winner";
import {NumberUtil} from "../util/number-util";
import {Ticket} from "./ticket";

export class Round {
  id: number
  openTime: number
  openTimeDisplay: string
  closeTime: number
  closeTimeDisplay: string
  winningNumber:Ticket
  winningNumberPairs: string []
  ticketPrice:number
  prize:number
  totalWinners:number
  status: number
  statusDisplay:string
  private _prize:number
  winners: Winner[]
  currentRoundDigit:number;


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
}
