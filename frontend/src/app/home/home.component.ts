import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import {ContractService} from "../../services/contract.service";
import {Round} from "../../model/round";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {

  nextRound: Round;
  rounds: Round[];
  constructor(private contractService: ContractService,
              private cdr: ChangeDetectorRef) {
    this.nextRound = new Round();
    this.rounds = [] as Round[];
  }

  ngOnInit() {
    this.contractService.getCurrentRound().subscribe(result=>{
      this.nextRound = result
      this.cdr.detectChanges();
    });
   this.listRounds();
  }

  init() {
    this.contractService.initRound(10);
    this.contractService.getCurrentRound().subscribe(result=>{
      this.nextRound = result
    });
  }

  buyTicket() {
    this.listRounds();
  }

  listRounds() {
    this.contractService.listRounds(0).subscribe((result=>{
      this.rounds = result;
      this.cdr.detectChanges();
    }))
  }
}
