export class PageRequest {

  private _pageNum:number;
  private _pageSize = 10 as number;


  constructor(pageNum:number, pageSize = 10 as number) {
    this.pageNum = pageNum;
    this.pageSize = pageSize;
  }
  getOffset():number {
        return this._pageNum * this._pageSize;
  }

  getLimit(totalRecords:number):number {
    if(totalRecords < this._pageSize) {
      return totalRecords;
    }
    return this._pageSize;
  }


  get pageNum(): number {
    return this._pageNum;
  }

  set pageNum(value: number) {
    this._pageNum = value;
  }

  get pageSize(): number {
    return this._pageSize;
  }

  set pageSize(value: number) {
    this._pageSize = value;
  }
}
