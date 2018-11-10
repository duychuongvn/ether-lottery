export class Winner {
  private _address: string
  private _roundId: number
  private _prize: number;
  private _received:number;


  get address(): string {
    return this._address;
  }

  set address(value: string) {
    this._address = value;
  }

  get roundId(): number {
    return this._roundId;
  }

  set roundId(value: number) {
    this._roundId = value;
  }

  get prize(): number {
    return this._prize;
  }

  set prize(value: number) {
    this._prize = value;
  }

  get received(): number {
    return this._received;
  }

  set received(value: number) {
    this._received = value;
  }
}
