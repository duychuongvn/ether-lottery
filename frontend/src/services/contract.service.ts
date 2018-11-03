import { Injectable } from '@angular/core';
import {environment} from '../environments/environment'
import {Observable} from "rxjs/index";

declare const require: any;
const contractABI = require('../assets/contracts/EtherLotteryABI.json');

const _uniq = require('lodash/uniq');



declare const window: any;
@Injectable({
  providedIn: 'root'
})
export class ContractService {

  address: any;
  contract: any;
  constructor() {

    this.init();
  }
  init(): void{

    if(window.web3) {
      const etherContract = window.web3.eth.contract(contractABI);
      this.contract = etherContract.at(environment.contactAddress);
      let state = window.web3.currentProvider.publicConfigStore.getState();

        this.address = state.selectedAddress

    }
  }

  initRound(amount: number):void{
     this.contract.init({from: this.address, value: window.web3.toWei(amount)}, (err:any,success:any) =>{

       console.log("error: ", err)
       console.log("success: ", success)
    });
  }

  buyTickets(tickets: any []):void {
    this.contract.buyTickets([0,2,3],{from: this.address, value: window.web3.toWei(3)}, (err:any,success:any) =>{

      console.log("error: ", err)
      console.log("success: ", success)
    });
  }

  getPrize (): Observable<number> {

    return Observable.create((observe: any) => {

      return window.web3.eth.getBalance(this.contract.address, (err:any,success:any) => {
        observe.next(success.toNumber());
        observe.complete();
      });
    });

  }
}
