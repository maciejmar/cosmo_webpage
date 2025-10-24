import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoPlComponent } from './info-pl.component';

describe('InfoPlComponent', () => {
  let component: InfoPlComponent;
  let fixture: ComponentFixture<InfoPlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoPlComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfoPlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
