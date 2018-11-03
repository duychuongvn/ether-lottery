import {Winner} from "./winner";

export class Round {
  id: number
  openTime: number
  displayOpenTime: string
  closeTime: number
  displayCloseTime: string
  winningNumber:number
  winningNumberPairs: string []
  winners: Winner[]
}
