import {Component, OnInit, ViewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {ApplicationState} from '../store/application-state';
import {ActivatedRoute} from '@angular/router';
import * as fromAction from '../store/actions';
import {Observable} from 'rxjs/Observable';
import {currentDashboardNameSelector} from '../store/selectors/current-dashboard-name.selector';
import {Visualization} from './model/visualization';
import {visualizationObjectsSelector} from '../store/selectors/visualization-objects.selector';
import {Subject} from 'rxjs/Subject';
import {dashboardLoadedSelector} from '../store/selectors/dashboard-loaded.selector';
import {DragulaService} from 'ng2-dragula';
import {DashboardMenuComponent} from './components/dashboard-menu/dashboard-menu.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  dashboardName$: Observable<string>;
  visualizationObjects$: Observable<Visualization[]>;
  dashboardLoaded$: Observable<boolean>;
  dashboardId: string;
  globalFilters: Observable<any>;
  globalFilters$: Subject<any> = new Subject<any>();
  showBookmarkedDashboards: boolean;
  dashboardConfig: any = {
    showNotification: true,
    showSearch: true,
    showName: true
  };
  welcomingTitle: string;
  welcomingDescription: string;
  @ViewChild(DashboardMenuComponent)
    dashboardMenu: DashboardMenuComponent;
  constructor(
    private store: Store<ApplicationState>,
    private route: ActivatedRoute,
  ) {
    this.dashboardName$ = store.select(currentDashboardNameSelector);
    this.visualizationObjects$ = store.select(visualizationObjectsSelector);
    this.dashboardLoaded$ = store.select(dashboardLoadedSelector);
    this.globalFilters$.next(null);
    this.globalFilters = this.globalFilters$.asObservable();
    this.showBookmarkedDashboards = false;
    this.welcomingTitle = 'Welcome to the most interactive dashboard';
    this.welcomingDescription = 'Enjoy interactive features with support for one click switching between tables, charts and maps, changing data selections as well as layouts'
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.dashboardId = params.id;

      this.store.select(dashboardLoadedSelector)
        .subscribe(dashboardLoaded => {
          if (dashboardLoaded) {
            this.store.dispatch(new fromAction.LoadCurrentDashboard(params.id))
          }
        })
    })
  }

  updateFilters(filterData) {
    this.store.dispatch(new fromAction.GlobalFilterChangeAction({dashboardId: this.dashboardId, filterObject: filterData}));
  }

  toggleDashboardBookmarkOption(e) {
    e.stopPropagation();
    this.showBookmarkedDashboards = !this.showBookmarkedDashboards;
    if (this.dashboardMenu) {
      this.dashboardMenu.toggleBookmarkShowOption(this.showBookmarkedDashboards);
    }
  }

}
