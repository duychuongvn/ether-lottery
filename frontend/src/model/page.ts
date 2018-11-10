import {PageRequest} from "./page-request";

export class Page<T> {
  pageSize = 10 as number;
  totalRecords: number;
  currentPage:number;
  content = [] as T[]

  constructor(totalRecords:number,  pageRequest: PageRequest, content: T[]) {
    this.totalRecords = totalRecords;
    this.pageSize = pageRequest.pageSize;
    this.currentPage = pageRequest.pageNum;
    this.content = content;
  }

  public hasNext():boolean {
    return (this.currentPage+1)*this.pageSize < this.totalRecords;
  }

  public hasPrevious():boolean {
    return this.currentPage > 0;
  }

  public getPreviousPage():number {
    if(this.hasPrevious()) {
      return this.currentPage - 1;
    }
    return this.currentPage;
  }

  public getNextPage():number {
    if(this.hasNext()) {
      return this.currentPage+1;
    }
    return this.currentPage;
  }
  public getContent(): T[] {
    return this.content;
  }


}
