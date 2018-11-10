export class NumberUtil {

  static currencyFormat(amount : number) : string {
    if(amount) {
      return amount.toFixed(3).replace(/(\d)(?=(\d{3})+\b)/g,'$1,');
    }
    return "0.000";
  }

  static toEther(wei:number) : number {
    return wei / 1000000000000000000;
  }
}
