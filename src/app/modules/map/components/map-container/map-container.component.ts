import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import * as fromStore from '../../store';
import { Layer } from '../../models/layer.model';
import * as fromUtils from '../../utils';
import { getTileLayer } from '../../constants/tile-layer.constant';
import { VisualizationObject } from '../../models/visualization-object.model';
import { MapConfiguration } from '../../models/map-configuration.model';
import { GeoFeature } from '../../models/geo-feature.model';
import * as fromLib from '../../lib';
import * as L from 'leaflet';

import { map, filter, tap, flatMap } from 'rxjs/operators';
import * as _ from 'lodash';

@Component({
  selector: 'app-map-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './map-container.component.html',
  styleUrls: ['./map-container.component.css']
})
export class MapContainerComponent implements OnInit {
  @Input() visualizationObject: VisualizationObject;
  @Input() displayConfigurations: any;
  public map: any = {};

  constructor(private store: Store<fromStore.MapState>) {}

  ngOnInit() {
    this.initializeMapContainer();
  }

  initializeMapContainer() {
    const { itemHeight, mapWidth } = this.displayConfigurations;
    const { componentId } = this.visualizationObject;
    const container = fromUtils.prepareMapContainer(componentId, itemHeight, mapWidth, false);
    const otherOptions = {
      zoomControl: false,
      scrollWheelZoom: false,
      worldCopyJump: true
    };
    this.map = L.Map(container, otherOptions);
  }

  initializeMapBaseLayer(mapConfiguration: MapConfiguration) {
    const center: L.LatLngExpression = [
      Number(fromLib._convertLatitudeLongitude(mapConfiguration.latitude)),
      Number(fromLib._convertLatitudeLongitude(mapConfiguration.longitude))
    ];
    const zoom = mapConfiguration.zoom;

    const mapTileLayer = getTileLayer(mapConfiguration.basemap);
    const baseMapLayer = fromLib.LayerType[mapTileLayer.type](mapTileLayer);

    this.map.setView(center, zoom, { reset: true });
    // Add baseMap Layer;
    this.map.addLayer(baseMapLayer);
  }

  createLayer(optionsLayer, index) {
    const { displaySettings, id, geoJsonLayer, visible } = optionsLayer;
    this.createPane(displaySettings.labels, id, index);
    this.setLayerVisibility(visible, geoJsonLayer);
  }

  createPane(labels, id, index) {
    const zIndex = 600 - index * 10;
    this.map.createPane(id);
    this.map.getPane(id).style.zIndex = zIndex.toString();

    if (labels) {
      const paneLabelId = `${id}-labels`;
      const labelPane = this.map.createPane(paneLabelId);
      this.map.getPane(paneLabelId).style.zIndex = (zIndex + 1).toString();
    }
  }

  onLayerAdd(index, optionsLayer) {}

  setLayerVisibility(isVisible, layer) {
    if (isVisible && this.map.hasLayer(layer) === false) {
      this.map.addLayer(layer);
    } else if (!isVisible && this.map.hasLayer(layer) === true) {
      this.map.removeLayer(layer);
    }
  }

  layerFitBound(bounds: L.LatLngBoundsExpression) {
    this.map.invalidateSize();
    this.map.fitBounds(bounds);
  }

  zoomIn(event) {
    this.map.zoomIn();
  }

  zoomOut(event) {
    this.map.zoomOut();
  }

  recenterMap(event) {
    // some work needs to be done
  }

  toggleLegendContainerView() {
    this.store.dispatch(new fromStore.ToggleOpenVisualizationLegend(this.visualizationObject.componentId));
  }

  drawMap() {
    const overlayLayers = fromLib.GetOverLayLayers(this.visualizationObject);
    this.initializeMapBaseLayer(this.visualizationObject.mapConfiguration);
    const layersBounds = [];
    let legendSets = [];
    overlayLayers.map((layer, index) => {
      const { bounds, legendSet } = layer;
      if (bounds) {
        layersBounds.push(bounds);
      }
      if (legendSet && legendSet.legend) {
        legendSets = [...legendSets, legendSet];
      }
      this.createLayer(layer, index);
    });

    if (layersBounds.length) {
      this.layerFitBound(layersBounds);
    }
    if (legendSets.length) {
      this.store.dispatch(new fromStore.AddLegendSet({ [this.visualizationObject.componentId]: legendSets }));
    }
  }
}
