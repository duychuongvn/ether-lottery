import {Winner} from "./winner";
import {NumberUtil} from "../util/number-util";

export class Round {
  id: number
  openTime: number
  openTimeDisplay: string
  closeTime: number
  closeTimeDisplay: string
  winningNumber:number
  winningNumberPairs: string []
  estimateDifficult: number
  ticketPrice:number
  prize:number
  totalWinners:number
  status: number
  statusDisplay:string
  private _prize:number
  winners: Winner[]

  get prizeFormated(): string {
    return NumberUtil.currencyFormat(this.prize);
  }
  get winningNumberFormated (): string {
    if(this.winningNumber) {
      return this.winningNumber + "";// TODO will do later
    }
    return "N/A";
  }
}
