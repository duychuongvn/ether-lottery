import {Injectable, OnInit} from '@angular/core';
import {Observable} from "rxjs/index";
import {environment} from "../environments/environment";
declare const window: any;
declare const require: any;
import * as Web3 from 'web3';
//
@Injectable({
  providedIn: 'root'
})
export class Web3ProviderService implements OnInit{

  constructor() {
    this.initWeb3ForDisplay();
  }
  public web3Read: any;
  public  web3:any;

  initWeb3ForDisplay() {



    let web3ReadProvider = new Web3.providers.HttpProvider(environment.web3HttpProvider);
    this.web3Read = new Web3(web3ReadProvider);
    if(window.web3) {
      this.web3 = new Web3(window.web3.currentProvider);
    }
  }
   getSelectedAddress (): Observable<any>  {
        return Observable.create((obser:any)=>{
          if(window.web3) {
            window.web3.eth.getAccounts((err, res)=>{
              console.log(res[0])
              obser.next(res[0]);
              obser.complete();
            })
          }  else {
            obser.error('require metamask');
            obser.complete();
          }
       })

  }

  ngOnInit(): void {

  }
}
