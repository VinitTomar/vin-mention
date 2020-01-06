import { TestBed } from '@angular/core/testing';

import { CaretCoordinateService } from './caret-coordinate.service';

describe('CaretCoordinateService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CaretCoordinateService = TestBed.get(CaretCoordinateService);
    expect(service).toBeTruthy();
  });
});
