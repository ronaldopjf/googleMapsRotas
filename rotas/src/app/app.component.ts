/// <reference path="./../../node_modules/@types/googlemaps/index.d.ts"/>
import { Component, ViewChild } from '@angular/core';
import { GooglePlaceDirective } from 'ngx-google-places-autocomplete';
import { Address } from 'ngx-google-places-autocomplete/objects/address';
import { FormGroup, FormBuilder, Validators, FormArray, FormControl } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  @ViewChild("originPlacesRef") originPlacesRef: GooglePlaceDirective;
  @ViewChild("destinationPlacesRef") destinationPlacesRef: GooglePlaceDirective;
  @ViewChild("pointPlacesRef") pointPlacesRef: GooglePlaceDirective;

  public title = 'Uncle Chico using google maps';
  public latitude: number = -21.70;
  public longitude: number = -43.60;
  public origin = { lat: 0, lng: 0 };
  public destination = { lat: 0, lng: 0 };
  public waypoints = [];
  public googlePlacesOptions = {
    travelMode: 'DRIVING',
    componentRestrictions: { country: 'BR' }
  };
  public zoom: number = 15;
  public time: number = null;
  public distance: number = null;
  public searchForm: FormGroup;
  public formSubmitAttempt: boolean = false;
  public todayDate = new Date().toJSON().split('T')[0];

  public constructor(
    private formBuilder: FormBuilder
  ) { }

  public ngOnInit(): void {
    this.searchForm = this.formBuilder.group({
      originLocation: [null, Validators.required],
      originDate: [null, Validators.required],
      destinationLocation: [null, Validators.required],
      destinationDate: [null, Validators.required],
      way_points: this.formBuilder.array([this.formBuilder.group({
        point: '',
        pointDate: '',
        pointDateValid: true
      })])
    });
  }

  public onSubmit(originAddress: Address, destinationAddress: Address): void {
    this.formSubmitAttempt = true;

    if (this.searchForm.valid) {
      this.validWaypointDates();
      if (this.validDates()) {
        this.setOriginAndDestination(originAddress, destinationAddress);
        this.setTimeAndDistance();
      }
    } else {
      this.validateAllFormFields(this.searchForm);
    }
  }

  private validDates(): boolean {
    return this.validOriginDate('originDate') && this.validDestinationDate('destinationDate');
  }

  public validOriginDate(field: string): boolean {
    return new Date(this.formControls[field].value) <= new Date(this.searchForm.controls['destinationDate'].value);
  }

  public validDestinationDate(field: string): boolean {
    return new Date(this.formControls[field].value) >= new Date(this.searchForm.controls['originDate'].value);
  }

  public validWaypointDates(): void {
    let previousPoint;
    for (let waypoint of this.searchForm.controls['way_points'].value) {
      waypoint.pointDateValid = true;
      if (previousPoint && (
        new Date(waypoint.pointDate) < new Date(this.searchForm.controls['originDate'].value) ||
        new Date(waypoint.pointDate) > new Date(this.searchForm.controls['destinationDate'].value) ||
        new Date(waypoint.pointDate) < new Date(previousPoint.pointDate)
      )) {
        waypoint.pointDateValid = false;
        return;
      } else if (
        new Date(waypoint.pointDate) < new Date(this.searchForm.controls['originDate'].value) ||
        new Date(waypoint.pointDate) > new Date(this.searchForm.controls['destinationDate'].value)
      ) {
        waypoint.pointDateValid = false;
        return;
      }
      previousPoint = waypoint;
    }
  }

  private setOriginAndDestination(originAddress: Address, destinationAddress: Address): void {
    if (originAddress)
      this.origin = { lat: originAddress.geometry.location.lat(), lng: originAddress.geometry.location.lng() };
    if (destinationAddress)
      this.destination = { lat: destinationAddress.geometry.location.lat(), lng: destinationAddress.geometry.location.lng() };
  }

  private setTimeAndDistance(): void {
    this.time = 0;
    this.distance = 0;
    let latLngOrigin = new google.maps.LatLng(this.origin.lat, this.origin.lng);
    let latLngDestination;

    if (this.waypoints.length > 0) {
      for (let point of this.waypoints) {
        latLngDestination = new google.maps.LatLng(point.location.lat, point.location.lng);
        this.setEstimatedTimeAndDistance(latLngOrigin.lat() + ',' + latLngOrigin.lng(), latLngDestination.lat() + ',' + latLngDestination.lng());
        latLngOrigin = latLngDestination;
      }
    }

    latLngDestination = new google.maps.LatLng(this.destination.lat, this.destination.lng);
    this.setEstimatedTimeAndDistance(latLngOrigin.lat() + ',' + latLngOrigin.lng(), latLngDestination.lat() + ',' + latLngDestination.lng());
  }

  private async setEstimatedTimeAndDistance(origin: string, destination: string) {
    const service = new google.maps.DistanceMatrixService();

    const { response, status } = await new Promise(resolve =>
      service.getDistanceMatrix({
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC
      }, (response, status) => resolve({ response, status }))
    );
    if (status !== "OK") {
      alert("Error: " + status);
      return;
    }
    this.time += response.rows[0].elements[0].duration.value;
    this.distance += response.rows[0].elements[0].distance.value;
  }

  private validateAllFormFields(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof FormGroup) {
        this.validateAllFormFields(control);
      }
    });
  }

  public getDuration(time: number): string {
    let stringTime;
    let array;
    let hours;
    let minuts;
    if (time > 3600) {
      stringTime = (time / 60 / 60).toFixed(2).toString();
      array = stringTime.split('.');
      hours = parseInt(array[0]);
      minuts = (array.length > 1) ? (parseInt(array[1]) / 10 * 60).toString().substring(0, 2) : 0;
    } else {
      stringTime = (time / 60).toFixed(2).toString();
      array = stringTime.split('.');
      minuts = parseInt(array[0]).toString().substring(0, 2);
    }

    if (hours > 0) {
      return `${hours} hora(s) e ${minuts} minuto(s)`;
    }

    return `${minuts} minutos`;
  }

  public cleanForm(): void {
    this.time = null;
    this.distance = null;
    this.origin = { lat: 0, lng: 0 };
    this.destination = { lat: 0, lng: 0 };
    this.waypoints = [];
    this.searchForm.reset();
    this.formSubmitAttempt = false;
  }

  public isFieldValid(field: string): boolean {
    return (!this.searchForm.get(field).valid && this.searchForm.get(field).touched) ||
      (this.searchForm.get(field).untouched && this.formSubmitAttempt);
  }

  public displayFieldCss(field: string): any {
    return {
      'has-error': this.isFieldValid(field),
      'has-feedback': this.isFieldValid(field)
    };
  }

  public get formControls(): any {
    return this.searchForm.controls;
  }

  public get wayPoints(): any {
    return this.searchForm.get('way_points') as FormArray;
  }

  public addWayPoint(): void {
    this.wayPoints.push(this.formBuilder.group({
      point: '',
      pointDate: '',
      pointDateValid: true
    }));
  }

  public deleteWayPoint(index: number): void {
    this.waypoints.splice(index, 1);
    this.wayPoints.removeAt(index);
  }

  public handleAddressChangePoint(index: number, address: Address, originAddress: Address, destinationAddress: Address): void {
    let point = { location: { lat: 0, lng: 0 } };
    point.location.lat = +address.geometry.location.lat();
    point.location.lng = +address.geometry.location.lng();
    this.waypoints.splice(index, 1, point);
    this.setOriginAndDestination(originAddress, destinationAddress);
  }
}