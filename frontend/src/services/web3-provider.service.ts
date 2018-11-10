import { Injectable } from '@angular/core';
import {Observable} from "rxjs/index";
declare const window: any;
@Injectable({
  providedIn: 'root'
})
export class Web3ProviderService {

  constructor() { }

   getSelectedAddress (): Observable<any>  {
        return Observable.create((obser:any)=>{
          window.web3.eth.getAccounts((err, res)=>{
            console.log(res[0])
            obser.next(res[0]);
            obser.complete();
          })
        })

  }
}
