import { Component, Input, OnInit, Output, EventEmitter, ViewChild } from '@angular/core';
import { Visualization } from '../../../../../../store/visualization/visualization.state';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';
import { AppState } from '../../../../../../store/app.reducers';
import * as visualization from '../../../../../../store/visualization/visualization.actions';
import { CurrentUserState } from '../../../../../../store/current-user/current-user.state';
import { ChartListComponent } from '../../../../../../modules/chart/components/chart-list/chart-list.component';
import { TableListComponent } from '../../../../../../modules/table/components/table-list/table-list.component';
import * as fromMapStore from '../../../../../../modules/map/store/index';
import { VisualizationObject } from '../../../../../../modules/map/models/visualization-object.model';
import { DashboardAccess } from '../../../../../../store/dashboard/dashboard.state';

@Component({
  selector: 'app-visualization-card',
  templateUrl: './visualization-card.component.html',
  styleUrls: ['./visualization-card.component.css']
})
export class VisualizationCardComponent implements OnInit {
  @Input()
  visualizationObject: Visualization;

  @Input()
  currentUser: CurrentUserState;

  @Input()
  mapVisualizationObject: VisualizationObject;

  @Input()
  dashboardAccess: DashboardAccess;

  @Input() isItVisualizable: boolean

  @Input() isFullScreenEnabled: boolean;

  isCardFocused: boolean;
  selectedDimensions: any;
  currentVisualization: string;
  loaded: boolean;
  showDeleteDialog: boolean;
  showInfo: boolean;

  @ViewChild(ChartListComponent) chartList: ChartListComponent;
  @ViewChild(TableListComponent) tableList: TableListComponent;

  constructor(private store: Store<AppState>) {
    this.showDeleteDialog = false;
    this.showInfo = false;
  }

  ngOnInit() {
    this.selectedDimensions = this.getSelectedDimensions();

    this.currentVisualization = this.visualizationObject.details.currentVisualization;

    this.loaded = this.visualizationObject.details.loaded;
  }

  currentVisualizationChange(visualizationType: string) {
    this.store.dispatch(
      new visualization.VisualizationChangeAction({
        type: visualizationType,
        id: this.visualizationObject.id
      })
    );
  }

  setInfoStatus(status) {
    this.showInfo = status;
  }

  getSelectedItems(filters: any[], dimension: string) {
    // todo take data items based on the current layer
    if (filters && filters[0]) {
      const dataItemObject = _.find(filters[0].filters, ['name', dimension]);

      if (dataItemObject) {
        return _.map(dataItemObject.items, (dataItem: any) => {
          return {
            id: dataItem.dimensionItem,
            name: dataItem.displayName,
            type: dataItem.dimensionItemType
          };
        });
      }
    }
    return [];
  }

  private _getSelectedOrgUnitModel(orgUnitArray): any {
    const selectedOrgUnitLevels = orgUnitArray.filter(
      orgunit => orgunit.id.indexOf('LEVEL') !== -1
    );
    const selectedUserOrgUnits = orgUnitArray.filter(orgunit => orgunit.id.indexOf('USER') !== -1);
    const selectedOrgUnitGroups = orgUnitArray.filter(
      orgunit => orgunit.id.indexOf('OU_GROUP') !== -1
    );

    return {
      selectionMode: selectedOrgUnitLevels.length > 0
        ? 'Level'
        : selectedOrgUnitGroups.length > 0 ? 'Group' : 'orgUnit',
      selectedLevels: selectedOrgUnitLevels.map(orgunitlevel => {
        return {
          level: orgunitlevel.id.split('-')[1]
        };
      }),
      showUpdateButton: true,
      selectedGroups: selectedOrgUnitGroups,
      orgUnitLevels: [],
      orgUnitGroups: [],
      selectedOrgUnits: orgUnitArray.filter((orgUnit: any) => orgUnit.type === 'ORGANISATION_UNIT'),
      userOrgUnits: [],
      type: 'report',
      selectedUserOrgUnits: selectedUserOrgUnits.map(userorgunit => {
        return {
          id: userorgunit.id,
          shown: true
        };
      }),
      orgUnits: []
    };
  }

  onFilterUpdate(filterValue: any) {
    this.store.dispatch(
      new visualization.LocalFilterChangeAction({
        visualizationObject: this.visualizationObject,
        filterValue: filterValue
      })
    );
  }

  onLayoutUpdate(layoutOptions: any) {
    const newVisualizationObjectDetails = {
      ...this.visualizationObject.details
    };

    // TODO use only single place for saving layout options
    const visualizationLayouts = _.map(
      newVisualizationObjectDetails.layouts,
      (layoutObject: any) => {
        return {
          ...layoutObject,
          layout: layoutOptions
        };
      }
    );

    const visualizationLayers = _.map(this.visualizationObject.layers, (layer: any) => {
      return {
        ...layer,
        layout: layoutOptions
      };
    });

    this.store.dispatch(
      new visualization.AddOrUpdateAction({
        visualizationObject: {
          ...this.visualizationObject,
          details: {
            ...newVisualizationObjectDetails,
            layouts: [...visualizationLayouts]
          },
          layers: visualizationLayers
        },
        placementPreference: 'normal'
      })
    );
  }

  toggleCardFocusAction(e, isFocused) {
    e.stopPropagation();
    this.isCardFocused = isFocused;

    /**
     * Pass event to child components
     */
    if (this.chartList) {
      this.chartList.onParentEvent({
        focused: this.isCardFocused
      });
    }
  }

  getSelectedDimensions() {
    return this.visualizationObject.details &&
    this.visualizationObject.details.filters.length > 0 &&
    this.visualizationObject.details.layouts.length > 0
      ? {
        selectedDataItems: this.getSelectedItems(this.visualizationObject.details.filters, 'dx'),
        selectedPeriods: this.getSelectedItems(this.visualizationObject.details.filters, 'pe'),
        orgUnitModel: this._getSelectedOrgUnitModel(
          this.getSelectedItems(this.visualizationObject.details.filters, 'ou')
        ),
        layoutModel: this.visualizationObject.details.layouts[0].layout
      }
      : null;
  }

  onShowDeleteDialog(e) {
    e.stopPropagation();
    this.showDeleteDialog = true;
  }

  onDelete() {
    this.store.dispatch(
      new visualization.DeleteAction({
        dashboardId: this.visualizationObject.dashboardId,
        visualizationId: this.visualizationObject.id
      })
    );
  }

  onDownload(downloadFormat) {
    if (this.currentVisualization === 'CHART' && this.chartList) {
      this.chartList.onDownloadEvent(this.visualizationObject.name, downloadFormat);
    } else if (this.currentVisualization === 'TABLE' && this.tableList) {
      this.tableList.onDownloadEvent(this.visualizationObject.name, downloadFormat);
    } else if (this.currentVisualization === 'MAP') {

      // console.log(this.mapVisualizationObject);
      // this.store.select(fromMapStore.getAllVisualizationObjects).subscribe((visualizationObjects) => {
      //   console.log(visualizationObjects);
      // });

      this.store.select(
        fromMapStore.getCurrentVisualizationObject(this.visualizationObject.id)
      ).subscribe((visualizationObject) => {
        let mapLegends = null;
        this.mapVisualizationObject = visualizationObject;
        this.store.select(fromMapStore.getCurrentLegendSets(visualizationObject.componentId)).
          subscribe(visualizationLengends => {
            if (visualizationLengends) {
              mapLegends = Object.keys(visualizationLengends).map(
                key => visualizationLengends[key]
              );
              this.mapDownload(downloadFormat.toLowerCase(), mapLegends);
            }
          });

      });


    }
  }

  mapDownload(fileType, mapLegends) {

    if (fileType === 'csv') {
      this.store.dispatch(
        new fromMapStore.DownloadCSV({
          visualization: this.mapVisualizationObject,
          mapLegends: mapLegends
        })
      );
    }

    if (fileType === 'kml') {
      this.store.dispatch(
        new fromMapStore.DownloadKML({
          visualization: this.mapVisualizationObject,
          mapLegends: mapLegends
        })
      );
    }

    if (fileType === 'shapefile') {
      this.store.dispatch(
        new fromMapStore.DownloadShapeFile({
          visualization: this.mapVisualizationObject,
          mapLegends: mapLegends
        })
      );
    }

    if (fileType === 'geojson') {
      this.store.dispatch(
        new fromMapStore.DownloadJSON({
          visualization: this.mapVisualizationObject,
          mapLegends: mapLegends
        })
      );
    }
  }


}
