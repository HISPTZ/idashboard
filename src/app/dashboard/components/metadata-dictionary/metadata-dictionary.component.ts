import {Component, Input, OnInit} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';
import {Headers, Http, Response} from '@angular/http';

@Component({
  selector: 'app-metadata-dictionary',
  templateUrl: './metadata-dictionary.component.html',
  styleUrls: ['./metadata-dictionary.component.css']
})
export class MetadataDictionaryComponent implements OnInit {
  private indicators=[];
  private CompleteData=[];
  private dataelements=[];
  private dataelementsNumerator=[];
  private datasets=[];
  private events=[];
  private programInd=[];
  private isIndicator=false;
  private isDataelements=false;
  private isDataset=false;
  private isEvents=false;
  private isProgramInd=false;
  private showingLoading:boolean=false;
  private progressMessage:string='Preparing metadata dictionary'
  @Input() metadataidentifiers:string;
  subscription:Subscription;
  public oneAtATime: boolean = true;
  public isFirstOpen: boolean = false;
  constructor(private http:Http) {
    this.indicators=[];
    this.CompleteData=[];
    this.dataelements=[];
    this.datasets=[];
    this.events=[];
    this.programInd=[];
    this.dataelementsNumerator=[];
    this.subscription
  }

  ngOnInit() {
    //console.log(this.metadataidentifiers);
    const uid=this.metadataidentifiers;
    console.log(this.metadataFromAnalyticsLink(uid));
    this.displayDetail(uid);
  }
  displayDetail(uid){
    this.showingLoading=true;
    var self=this.http;
    var count =0;
    let Completeindicators=[]
    this.metadataFromAnalyticsLink(uid).forEach(value => {
      count++
      this.subscription=self.get('../../../api/identifiableObjects/'+value+'.json')
        .map((response:Response)=>response.json())
        .subscribe(data=>{
          const metadataLink=data.href;
          if (metadataLink.indexOf('indicators')>=1){
            const indicatorUrl=metadataLink+'.json?fields=:all,displayName,id,name,numeratorDescription,denominatorDescription,denominator,numerator,annualized,decimals,indicatorType[name],user[name],attributeValues[value,attribute[name]],indicatorGroups[name,indicators~size],legendSet[name,symbolizer,legends~size],dataSets[name]';
            this.subscription=self.get(indicatorUrl)
              .map((res:Response)=>res.json())
              .subscribe(data=>{
                  // console.log(this.dataElementAvailable(data.numerator));
                  let indicatorObject=data;
                  let numeratorExp=self.get('../../../api/expressions/description?expression='+encodeURIComponent(data.numerator)).map((res:Response)=>res.json())
                  let numeratorDataset=self.get('../../../api/dataSets.json?fields=periodType,id,name,timelyDays,formType,created,expiryDays&filter=dataSetElements.dataElement.id:in:['+this.dataElementAvailable(data.numerator)+']&paging=false)').map((res:Response)=>res.json())
                  let denominatorExp=self.get('../../../api/expressions/description?expression='+encodeURIComponent(data.denominator)).map((res:Response)=>res.json())
                  let denominatorDataSet=self.get('../../../api/dataSets.json?fields=periodType,id,name,timelyDays,formType,created,expiryDays&filter=dataSetElements.dataElement.id:in:['+this.dataElementAvailable(data.denominator)+']&paging=false)').map((res:Response)=>res.json())
                  this.subscription= Observable.forkJoin([numeratorExp,numeratorDataset,denominatorExp,denominatorDataSet])
                    .subscribe(results=>{
                        let numerator=results[0].description;
                        let numeratorDataEl=results[1];
                        let denominator=results[2].description;
                        let denominatorDataEl=results[3];
                        Completeindicators.push({object:indicatorObject,numeratorDaset:numeratorDataEl,denominatorDaset:denominatorDataEl,name:indicatorObject.name,uid:indicatorObject.id,denominatorDescription:indicatorObject.denominatorDescription,numeratorDescription:indicatorObject.numeratorDescription,numerator:numerator,denominator:denominator,indicatorType:indicatorObject.indicatorType,dataSets:indicatorObject.dataSets,numeratorForm:indicatorObject.numerator,demonitorForm:indicatorObject.denominator});
                        this.CompleteData=Completeindicators;

                      },
                      error=>{
                        this.progressMessage='Sorry we are still looking what might be wrong'
                      },
                      ()=>{
                        this.progressMessage='Compiling'+data.name +' for consumptions'
                        if(count==this.metadataFromAnalyticsLink(uid).length){
                          console.log(count);
                          console.log(this.indicators=this.CompleteData);
                          this.showingLoading=false
                        }

                      }

                    )
                  this.progressMessage='Organising extracted metadata dictionary'

                },
                error=>{
                  this.progressMessage='Sorry we are still looking what might be wrong'

                },
                ()=>{
                  this.progressMessage='Metadata dictionary ready for consumption'

                }

              )

            this.isIndicator=true

          }else if(metadataLink.indexOf('dataElements')>=1){
            const dataelementUrl=metadataLink+'.json?fields=:all,id,name,aggregationType,displayName,categoryCombo[id,name,categories[id,name,categoryOptions[id,name]]],dataSets[:all,!compulsoryDataElementOperands]'
            this.subscription=self.get(dataelementUrl)
              .map((res:Response)=>res.json())
              .subscribe(dataelement=>{
                  this.dataelements.push(dataelement);
                  console.log(this.dataelements)// It brings undefined
                },
                error=>{
                  this.progressMessage='Sorry we are still looking what might be wrong'
                },
                ()=>{
                  this.progressMessage='Compiling data for consumptions'
                  if(count==this.metadataFromAnalyticsLink(uid).length){
                    console.log(count);
                    this.showingLoading=false
                  }
                }
              )
            this.isDataelements=true;

          }else if(metadataLink.indexOf('dataSets')>=1){
            const datasetUrl=metadataLink+'.json?fields=:all,user[:all],id,name,periodType,shortName,categoryCombo[id,name,categories[id,name,categoryOptions[id,name]]]'
            this.subscription=self.get(datasetUrl)
              .map((res:Response)=>res.json())
              .subscribe(dataset=>{
                  this.datasets.push(dataset)
                  console.log(this.datasets)// It brings undefined
                },
                error=>{
                  this.progressMessage='Sorry we are still looking what might be wrong'
                },
                ()=>{
                  this.progressMessage='Compiling data for consumptions'
                  if(count==this.metadataFromAnalyticsLink(uid).length){
                    console.log(count);
                    this.showingLoading=false
                  }
                }
              )
            this.isDataset=true;
          }else if(metadataLink.indexOf('programs')>=1){
            const eventUrl=metadataLink+'.json?fields=:all,programStages[:all,programStageDataElements[:all]]'
            this.subscription=self.get(eventUrl)
              .map((res:Response)=>res.json())
              .subscribe(event=>{
                  this.events.push(event)
                  console.log(this.events)
                },
                error=>{
                  this.progressMessage='Sorry we are still looking what might be wrong'
                },
                ()=>{
                  this.progressMessage='Compiling data for consumptions'
                  if(count==this.metadataFromAnalyticsLink(uid).length){
                    console.log(count);
                    this.showingLoading=false
                  }
                }
              )
            this.isEvents=true;
          }else if(metadataLink.indexOf('programIndicators')>=1){
            const programUrl=metadataLink+'.json?fields=:all,user[:all],program[:all]'
            this.subscription=self.get(programUrl)
              .map((res:Response)=>res.json())
              .subscribe(progInd=>{
                  var headers = new Headers();
                  headers.append('Content-Type', 'application/json;charset=UTF-8');
                  const url='../../../api/programIndicators/filter/description';
                  const expr='../../../api/programIndicators/expression/description';
                  if(progInd.hasOwnProperty('filter')){
                    this.http.post(url,progInd.filter,{headers:headers})
                      .map((res:Response)=>res.json())
                      .subscribe(
                        data=>{
                          this.http.post(expr, progInd.expression, {headers: headers})
                            .map((res: Response)=>res.json())
                            .subscribe(
                              expres=> {
                                this.programInd.push({
                                  object: progInd,
                                  filterName: data.description,
                                  expressionName: expres.description
                                })
                                console.log(this.programInd)
                              },
                              error=> {
                                this.progressMessage = 'Sorry we are still looking what might be wrong'
                              },
                              ()=> {
                                this.progressMessage='Compiling data for consumptions'
                                if(count==this.metadataFromAnalyticsLink(uid).length){
                                  console.log(count);
                                  this.showingLoading=false
                                }
                              }
                            )

                        }

                      )
                  }else{
                    this.http.post(expr, progInd.expression, {headers: headers})
                      .map((res: Response)=>res.json())
                      .subscribe(
                        expres=> {
                          this.programInd.push({
                            object: progInd,
                            expressionName: expres.description
                          })
                          console.log(this.programInd)
                        },
                        error=> {
                          this.progressMessage = 'Sorry we are still looking what might be wrong'
                        },
                        ()=> {
                          this.progressMessage='Compiling data for consumptions'
                          if(count==this.metadataFromAnalyticsLink(uid).length){
                            console.log(count);
                            this.showingLoading=false
                          }
                        }
                      )
                  }
                },
                error=>{
                  this.progressMessage='Sorry we are still looking what might be wrong'
                },
                ()=>{
                  this.progressMessage='Metadata dictionary ready for consumption'

                }
              )
            this.isProgramInd=true;
            //this.showingLoading=false
          }

        })
    })


  }

  metadataFromAnalyticsLink(dx){
    var separatedx=[]
    if(dx.indexOf(';')>=1){
      dx.split(';').forEach(data=>{
        if(data.indexOf('.')>=1){
          if(separatedx.indexOf(data.split('.')[0])!=-1){
          }else{
            separatedx.push(data.split('.')[0])
          }
        }else {
          separatedx.push(data)
        }
      })
    }else{
      if(dx.indexOf('.')>=1){
        separatedx.push(dx.split('.')[0]);
      }else{
        separatedx.push(dx);
      }

    }
    return separatedx;

  }
  dataElementAvailable(data){
    let dataelementuid=[];
    var separators = [' ', '\\\+', '-', '\\\(', '\\\)', '\\*', '/', ':', '\\\?'];
    let numeratorDataelemnt=data.split(new RegExp(separators.join('|'), 'g'));
    numeratorDataelemnt.forEach(sinngeDa=> {
      dataelementuid=this.dataElementWithCatOptionCheck(sinngeDa)
    })
    return dataelementuid.join()

  }
  dataElementWithCatOptionCheck(dx){
    let uid=[];
    if(dx.indexOf('.')>=1){
      uid.push((dx.replace(/#/g, '').replace(/{/g, '').replace(/}/g, '')).split('.')[0])
    }else {
      uid.push((dx.replace(/#/g, '').replace(/{/g, '').replace(/}/g, '')))
    }

    return uid;
  }

  private HandleError(error:any){
    let errMsg:string;
    if( error instanceof Response){
      const body=error.json()|| '';
      const err=body.error || JSON.stringify(body)
      errMsg=`${error.status}-${error.statusText || ''} ${err}`
    }else{
      errMsg=error.message? error.message:error.string();
    }
    console.log(errMsg);
    return Observable.throw(errMsg)
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
