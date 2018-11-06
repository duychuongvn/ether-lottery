import { Injectable } from '@angular/core';
import {environment} from '../environments/environment'
import {observable, Observable} from "rxjs/index";
import {Round} from "../model/round";
import { DateTime } from 'luxon';
import {NumberUtil} from "../util/number-util";
import {observeOn} from "rxjs/internal/operators";
import {forkJoin} from 'rxjs';
declare const require: any;
const contractABI = require('../assets/contracts/EtherLotteryABI.json');

const _uniq = require('lodash/uniq');



declare const window: any;
@Injectable({
  providedIn: 'root'
})
export class ContractService {

  pageSize = 10 as number;
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

  buyTickets(tickets: any []): Observable<any> {
    return Observable.create((observable: any) =>{
      this.getCurrentRound().subscribe((round)=>{
        let amount= tickets.length* round.ticketPrice;
        this.contract.buyTickets(tickets,{from: this.address, value: window.web3.toWei(amount)}, (err:any,success:any) =>{

          observable.next(success);
          observable.complete();
        });
      })
    })


  }

  getPrize (): Observable<number> {

    return Observable.create((observe: any) => {

      return window.web3.eth.getBalance(this.contract.address, (err:any,success:any) => {
        observe.next(success.toNumber());
        observe.complete();
      });
    });

  }

  getCurrentRound() : Observable<Round> {
    //getRoundDifficult
    return Observable.create((observe: any) => {
      this.contract._roundId.call((err:any, roundId:any)=>{
        this.contract.getRoundInfo(roundId,(err:any, result:any)=>{
          let round = this.extractedRounInfo(result);
          this.contract.getRoundDifficult((err:any, result:any)=>{
            let length = 0;
            let diff = parseInt(result.toNumber()) as number;
            while (Math.trunc(diff / 10) > 0) {
              diff = Math.trunc(diff / 10);
              length++;
            }
            round.estimateDifficult = length;
            observe.next(round);
            observe.complete();
          })

        })
      })

    });
  }

  private extractedRounInfo(result: any) {
    let round = new Round();
    round.id = result[0][0].toNumber();
    round.closeTime = result[0][1].toNumber()
    round.closeTimeDisplay = DateTime.fromMillis(round.closeTime * 1000).toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS);

    round.ticketPrice = NumberUtil.toEther((result[1][0].toNumber()))
    round.prize = NumberUtil.toEther((result[1][1].toNumber()))
    round.winningNumber = result[2][0].toNumber()
    round.totalWinners = result[2][1].toNumber()
    console.log('r',round)
    return round;
  }

  listRounds(pageNum:number):Observable<Round[]>{
    let offset = pageNum * this.pageSize;

    return Observable.create((observable:any)=>{
      let rounds= [] as Round[];
      this.contract._roundId.call((err:any, roundId:any)=>{
          let count = 0
          let _roundId = roundId.toNumber();
          let limit = this.pageSize;
          if(limit > _roundId) {
            limit = _roundId;
          }
        console.log(limit)

         let obsers = [] as Observable<Round>[];
          for(let _i = _roundId - offset; _i > 0 && count <limit;_i--) {
          obsers.push(Observable.create((ob)=>{
            this.contract.getRoundInfo(_i,(err:any, result:any)=> {
              let round = this.extractedRounInfo(result);
              ob.next(round)
              ob.complete();
              })
            }));
          }
        forkJoin(obsers).subscribe((rounds: Round[])=>{
          observable.next(rounds)
          observable.complete();
        })
      })


    })
  }

}
