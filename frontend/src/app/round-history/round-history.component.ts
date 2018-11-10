import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {Round} from "../../model/round";
import {ContractService} from "../../services/contract.service";
import {environment} from "../../environments/environment";
import {AppInfo} from "../../model/app-info";

@Component({
  selector: 'app-round-history',
  templateUrl: './round-history.component.html',
  styleUrls: ['./round-history.component.css'],
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class RoundHistoryComponent implements OnInit {

  roundId:number;
  round: Round;
  appInfo=new  AppInfo();
  constructor(private route: ActivatedRoute,
              private contractService: ContractService,
              private cdr: ChangeDetectorRef) { }


  ngOnInit() {
    this.route.params.subscribe(params => {
      this.roundId = +params['id'];
      this.contractService.getRoundInfo(this.roundId).subscribe(round=>{
        this.round = round;
        this.cdr.detectChanges();
      })

    });
  }

}
