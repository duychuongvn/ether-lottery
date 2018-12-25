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
import {Winner} from "../model/winner";
declare const require: any;
const contractABI = require('../assets/contracts/EtherLotteryABI.json');


declare const window: any;
@Injectable({
  providedIn: 'root'
})
export class ContractService {

  pageSize = 10 as number;
  address: any;
  contract: any;
  contractRead:any;
  constructor(private web3ProviderService: Web3ProviderService) {

    this.init();
  }
  init(): void{
    const etherContractRead = this.web3ProviderService.web3Read.eth.contract(contractABI);
    this.contractRead = etherContractRead.at(environment.contactAddress);
    if(window.web3) {
      const etherContract = window.web3.eth.contract(contractABI);
      this.contract = etherContract.at(environment.contactAddress);
    }
  }

  isUserConnectingToNetwork() :Observable<boolean> {
    return Observable.create((observable:any)=>{
      // some networks use same network version with Ethereum so we have to work around to check the contract is deployed on
      // selected network or not
      if(window.web3) {
        window.web3.eth.getCode(environment.contactAddress, (e,r)=>{
          observable.next( r != '0x');
          observable.complete();
        });
      } else {
        observable.next(false);
        observable.complete();
      }

    })

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
        if(err) {
          observe.error(err);
        } else {
          observe.next(success.toNumber());
        }

        observe.complete();
      });
    });

  }

  getCurrentRound() : Observable<Round> {
    //getRoundDifficult
    return Observable.create((observe: any) => {
      this.contractRead._roundId.call((err:any, roundId:any)=>{
       this.getRoundInfo(roundId).subscribe(round=>{
         if(err) {
           observe.error(err);
         } else {
           observe.next(round);
         }
         observe.complete();
       })
      })
    });
  }

  getRoundInfo(roundId:number):Observable<Round> {
    return Observable.create((observe:any)=>{
      this.contractRead.getRoundInfo.call(roundId,(err:any, result:any)=>{

        if(err) {
          observe.error(err);
          observe.complete();
        } else {
          let round = this.extractedRounInfo(result);
          this.contractRead.getRoundDifficult.call((err:any, result:any)=>{
            console.log('diff',err, result.toNumber())
            if(err) {
              observe.error(err);
              observe.complete();
            } else {
              let length = 0;
              let diff = parseInt(result.toNumber()) as number;
              round.currentRoundDigit = result.toNumber();
              observe.next(round);
              observe.complete();
            }

          })

        }


      })
    })
  }
  private extractedRounInfo(result: any) {
    let round = new Round();
    round.id = result[0].toNumber();
    round.ticketPrice = NumberUtil.toEther((result[1].toNumber()))

    round.closeTime = result[3].toNumber()
    round.closeTimeDisplay = DateTime.fromMillis(round.closeTime * 1000).toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS);
    round.winningNumber = new Ticket(result[4].toNumber()+"")
    round.prize = NumberUtil.toEther((result[5].toNumber()));
    round.totalPaid = NumberUtil.toEther(result[6].toNumber());
    for(let i=0;i<result[7].length;i++) {
      let winner = new Winner();
      winner.address = result[7][i];
      winner.prize = round.prize;
      winner.received = round.totalPaid/result[7].length;
      winner.roundId = round.id;
      round.winners.push(winner);
    }
    return round;
  }

  listRounds(pageNum:number):Observable<Round[]>{
    let offset = pageNum * this.pageSize;

    return Observable.create((observable:any)=>{
      let rounds= [] as Round[];
      this.contractRead._roundId.call((err:any, roundId:any)=>{
        if(err) {
          observable.error(err);
        } else {


          let count = 0
          let _roundId = roundId.toNumber();
          let limit = this.pageSize;
          if(limit > _roundId) {
            limit = _roundId;
          }

           let obsers = [] as Observable<Round>[];
            for(let _i = _roundId - offset - 1; _i > 0 && count <limit;_i--) {
            obsers.push(Observable.create((ob)=>{
              this.contractRead.getRoundInfo.call(_i,(err:any, result:any)=> {
                if(err) {
                  ob.error(err);
                } else {
                  let round = this.extractedRounInfo(result);
                  ob.next(round)
                }
                ob.complete();
                })
              }));
            }
          forkJoin(obsers).subscribe((rounds: Round[])=>{
            observable.next(rounds)
            observable.complete();
          })
        }
      })


    })
  }

  getUserHistories(address:string, pageRequest:PageRequest): Observable<Page<UserHistory>> {
    return Observable.create((obser:any)=>{
      this.contractRead.getUserRounds(address,(err:any, result:any)=>{
        if(err){
          obser.error(err);
          obser.complete();
        } else  {
          let totalRecords = result.length;
          let obsers = [] as Observable<UserHistory>[];
          for(let i = pageRequest.getLimit(totalRecords) -1;  i >=pageRequest.getOffset();i--) {
            obsers.push(Observable.create((observe:any)=>{
              this.contractRead.getUserHistories.call(address, result[i],(err:any, hisotry:any)=>{
                if(err) {
                  observe.error(err);

                } else {
                  let userHistory = new UserHistory();
                  userHistory.roundId = hisotry[0].toNumber();
                  userHistory.paidAmount = NumberUtil.toEther(hisotry[2].toNumber());
                  userHistory.roundTime = hisotry[3].toNumber();
                  for(let i = 0;i<hisotry[1].length;i++) {
                    userHistory.ticketNumbers.push(new Ticket(hisotry[1][i].toNumber()+""));
                  }
                  observe.next(userHistory);

                }
                observe.complete();
              });
            }));
          }
          forkJoin(obsers).subscribe((userHistories: UserHistory[])=>{
            obser.next(new Page<UserHistory>(totalRecords, pageRequest, userHistories))
            obser.complete();
          })
        }
      })
    });
  }
}
