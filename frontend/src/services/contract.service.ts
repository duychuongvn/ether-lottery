import { Injectable } from '@angular/core';
import {environment} from '../environments/environment'
import {observable, Observable} from "rxjs/index";
import {Round} from "../model/round";
import { DateTime } from 'luxon';
import {NumberUtil} from "../util/number-util";
import {observeOn} from "rxjs/internal/operators";
import {forkJoin} from 'rxjs';
import {UserHistory} from "../model/user-history";
import {Web3ProviderService} from "./web3-provider.service";
import {Page} from "../model/page";
import {PageRequest} from "../model/page-request";
import {Ticket} from "../model/ticket";
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
  constructor(private web3ProviderService: Web3ProviderService) {

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

  initRound(owner:any,amount: number):void{
     this.contract.init({from: owner, value: window.web3.toWei(amount)}, (err:any,success:any) =>{

       console.log("error: ", err)
       console.log("success: ", success)
    });
  }

  buyTickets(buyer:any,tickets: Ticket []): Observable<any> {
    return Observable.create((observable: any) =>{
      this.getCurrentRound().subscribe((round)=>{
        let amount= tickets.length* round.ticketPrice;
        this.contract.buyTickets(tickets.map(x=>x.ticketNumber),{from: buyer, value: window.web3.toWei(amount)}, (err:any,success:any) =>{

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
       this.getRoundInfo(roundId).subscribe(round=>{
         observe.next(round);
         observe.complete();
       })
      })
    });
  }

  getRoundInfo(roundId:number):Observable<Round> {
    return Observable.create((observe:any)=>{
      this.contract.getRoundInfo.call(roundId,(err:any, result:any)=>{
        let round = this.extractedRounInfo(result);
        this.contract.getRoundDifficult((err:any, result:any)=>{
          let length = 0;
          let diff = parseInt(result.toNumber()) as number;
          round.currentRoundDigit = result.toNumber();
          observe.next(round);
          observe.complete();
        })

      })
    })
  }
  private extractedRounInfo(result: any) {
    let round = new Round();
    round.id = result[0].toNumber();
    round.ticketPrice = NumberUtil.toEther((result[1].toNumber()))

    round.closeTime = result[3].toNumber()
    round.closeTimeDisplay = DateTime.fromMillis(round.closeTime * 1000).toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS);
    round.totalWinners = result[4].toNumber()
    round.prize = NumberUtil.toEther((result[5].toNumber()))
    round.winningNumber = new Ticket(result[6].toNumber()+"")
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

         let obsers = [] as Observable<Round>[];
          for(let _i = _roundId - offset - 1; _i > 0 && count <limit;_i--) {
          obsers.push(Observable.create((ob)=>{
            this.contract.getRoundInfo.call(_i,(err:any, result:any)=> {
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

  getUserHistories(address:string, pageRequest:PageRequest): Observable<Page<UserHistory>> {
    return Observable.create((obser:any)=>{
      this.contract.getUserRounds(address,(err:any, result:any)=>{
         let totalRecords = result.length;
        let obsers = [] as Observable<UserHistory>[];
         for(let i = pageRequest.getLimit(totalRecords) -1;  i >=pageRequest.getOffset();i--) {
           obsers.push(Observable.create((observe:any)=>{
             this.contract.getUserHistories.call(address, result[i],(err:any, hisotry:any)=>{
               let userHistory = new UserHistory();
               userHistory.roundId = hisotry[0].toNumber();
               userHistory.paidAmount = NumberUtil.toEther(hisotry[2].toNumber());
               userHistory.roundTime = hisotry[3].toNumber();
               for(let i = 0;i<hisotry[1].length;i++) {
                 userHistory.ticketNumbers.push(new Ticket(hisotry[1][i].toNumber()+""));
               }
               observe.next(userHistory);
               observe.complete();
             });
           }));
         }
        forkJoin(obsers).subscribe((userHistories: UserHistory[])=>{
          obser.next(new Page<UserHistory>(totalRecords, pageRequest, userHistories))
          obser.complete();
        })
      })
    });
  }
}
