import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoEnComponent } from './info-en.component';

describe('InfoEnComponent', () => {
  let component: InfoEnComponent;
  let fixture: ComponentFixture<InfoEnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoEnComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfoEnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
