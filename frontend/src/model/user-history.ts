import {NumberUtil} from "../util/number-util";
import {DateTime} from "luxon";
import {Ticket} from "./ticket";

export class UserHistory {

  private _roundId:number;
  private _ticketNumbers = [] as Ticket [];
  private _paidAmount:number
  private _winAmount:number;
  private _roundTime:number;
  private _roundTimeDisplay:string;

  get roundId(): number {
    return this._roundId;
  }

  set roundId(value: number) {
    this._roundId = value;
  }


  get ticketNumbers(): Ticket[] {
    return this._ticketNumbers;
  }

  get paidAmount(): number {
    return this._paidAmount;
  }
  get getFormatPaidAmount(): string {
    return NumberUtil.currencyFormat(this._paidAmount);
  }

  set paidAmount(value: number) {
    this._paidAmount = value;
  }

  get winAmount(): number {
    return this._winAmount;
  }

  set winAmount(value: number) {
    this._winAmount = value;
  }

  get roundTime(): number {
    return this._roundTime;
  }

  set roundTime(value: number) {
    this._roundTime = value;
  }

  get roundTimeDisplay(): string {
    return DateTime.fromMillis(this.roundTime * 1000).toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS);
  }

}
