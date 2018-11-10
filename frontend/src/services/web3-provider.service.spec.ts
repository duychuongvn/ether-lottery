import { TestBed, inject } from '@angular/core/testing';

import { Web3ProviderService } from './web3-provider.service';

describe('Web3ProviderService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Web3ProviderService]
    });
  });

  it('should be created', inject([Web3ProviderService], (service: Web3ProviderService) => {
    expect(service).toBeTruthy();
  }));
});
