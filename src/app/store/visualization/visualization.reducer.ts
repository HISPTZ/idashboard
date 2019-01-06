import * as visualization from './visualization.state';
import * as _ from 'lodash';
import {
  VisualizationAction,
  VisualizationActions
} from './visualization.actions';
import { Visualization } from './visualization.state';
import * as visualizationHelpers from './helpers/index';
import { deduceVisualizationSubtitle } from './helpers/deduce-visualization-subtitle.helper';

export function visualizationReducer(state: visualization.VisualizationState = visualization.INITIAL_VISUALIZATION_STATE,
  action: VisualizationAction) {
  switch (action.type) {
    case VisualizationActions.LOAD_SUCCESS:
      return {
        ...state,
        loading: false,
        loaded: true
      };
    case VisualizationActions.SET_INITIAL:
      return {
        ...state,
        visualizationObjects: [...state.visualizationObjects, ...action.payload]
      };
    case VisualizationActions.ADD_OR_UPDATE:
      const visualizationIndex = state.visualizationObjects.indexOf(
        _.find(state.visualizationObjects, [
          'id',
          action.payload.visualizationObject
            ? action.payload.visualizationObject.id
            : undefined
        ])
      );

      const newVisualizationObject = {
        ...action.payload.visualizationObject,
        layers: _.map(action.payload.visualizationObject.layers, (layer: any) => {
          const visualizationFilter = _.find(action.payload.visualizationObject.details ?
            action.payload.visualizationObject.details.filters : [], ['id', layer.settings.id]);
          const visualizationLayout = _.find(action.payload.visualizationObject.details ?
            action.payload.visualizationObject.details.layouts : [], ['id', layer.settings.id]);
          const filterDimensions = _.map(
            visualizationLayout && visualizationLayout.layout ? visualizationLayout.layout.filters : [],
            filter => filter.value);
          const visualizationFilters = _.filter(visualizationFilter ? visualizationFilter.filters : [],
            filter => filterDimensions.indexOf(filter.name) !== -1);
          return {
            ...layer, settings: {...layer.settings, subtitle: deduceVisualizationSubtitle(visualizationFilters)}
          };
        })
      };

      return visualizationIndex !== -1
        ? {
          ...state,
          visualizationObjects:
            action.payload.placementPreference === 'first'
              ? [
                newVisualizationObject,
                ...state.visualizationObjects.slice(0, visualizationIndex),
                ...state.visualizationObjects.slice(visualizationIndex + 1)
              ]
              : [
                ...state.visualizationObjects.slice(0, visualizationIndex),
                newVisualizationObject,
                ...state.visualizationObjects.slice(visualizationIndex + 1)
              ]
        }
        : {
          ...state,
          visualizationObjects:
            action.payload.placementPreference === 'first'
              ? [
                newVisualizationObject,
                ...state.visualizationObjects
              ]
              : [
                ...state.visualizationObjects,
                newVisualizationObject
              ]
        };

    case VisualizationActions.SET_CURRENT:
      return {...state, currentVisualization: action.payload};
    case VisualizationActions.UNSET_CURRENT:
      return {...state, currentVisualization: undefined};
    case VisualizationActions.RESIZE: {
      const visualizationObject: Visualization = _.find(
        state.visualizationObjects,
        ['id', action.payload.visualizationId]
      );
      const visualizationObjectIndex = state.visualizationObjects.indexOf(
        visualizationObject
      );
      return visualizationObjectIndex !== -1
        ? {
          ...state,
          visualizationObjects: [
            ...state.visualizationObjects.slice(0, visualizationObjectIndex),
            {
              ...visualizationObject,
              shape: action.payload.shape,
              details: {
                ...visualizationObject.details,
                width: visualizationHelpers.getVisualizationWidthFromShape(
                  action.payload.shape
                ),
                shape: action.payload.shape
              }
            },
            ...state.visualizationObjects.slice(visualizationObjectIndex + 1)
          ]
        }
        : state;
    }

    case VisualizationActions.TOGGLE_INTERPRETATION: {
      const visualizationObject: Visualization = _.find(
        state.visualizationObjects,
        ['id', action.payload]
      );
      const visualizationObjectIndex = state.visualizationObjects.indexOf(
        visualizationObject
      );
      /**
       * Change size of the data-statistics item
       */

      const newShape = visualizationObject
        ? visualizationObject.details.showInterpretationBlock
          ? visualizationObject.details.shape
          : visualizationObject.shape === 'NORMAL'
            ? 'DOUBLE_WIDTH'
            : 'FULL_WIDTH'
        : '';

      return visualizationObjectIndex !== -1
        ? {
          ...state,
          visualizationObjects: [
            ...state.visualizationObjects.slice(0, visualizationObjectIndex),
            {
              ...visualizationObject,
              shape: newShape,
              details: {
                ...visualizationObject.details,
                width: visualizationHelpers.getVisualizationWidthFromShape(
                  newShape
                ),
                showInterpretationBlock: !visualizationObject.details.showInterpretationBlock,
                shape: visualizationObject.shape
              }
            },
            ...state.visualizationObjects.slice(visualizationObjectIndex + 1)
          ]
        }
        : state;
    }

    case VisualizationActions.TOGGLE_FULLSCREEN: {
      const visualizationObject: Visualization = _.find(
        state.visualizationObjects,
        ['id', action.payload]
      );
      const visualizationObjectIndex = state.visualizationObjects.indexOf(
        visualizationObject
      );


      return visualizationObjectIndex !== -1
        ? {
          ...state,
          visualizationObjects: [
            ...state.visualizationObjects.slice(0, visualizationObjectIndex),
            {
              ...visualizationObject,
              details: {
                ...visualizationObject.details,
                showFullScreen: !visualizationObject.details.showFullScreen,
                cardHeight: visualizationObject.details.showFullScreen ? '450px' : '100vh',
                itemHeight: visualizationObject.details.showFullScreen ? '430px' : '96vh'
              }
            },
            ...state.visualizationObjects.slice(visualizationObjectIndex + 1)
          ]
        }
        : state;
    }

    case VisualizationActions.DELETE: {
      const visualizationObject: Visualization = _.find(
        state.visualizationObjects,
        ['id', action.payload.visualizationId]
      );
      const visualizationObjectIndex = state.visualizationObjects.indexOf(
        visualizationObject
      );
      return visualizationObjectIndex !== -1
        ? {
          ...state,
          visualizationObjects: [
            ...state.visualizationObjects.slice(0, visualizationObjectIndex),
            {
              ...visualizationObject,
              details: {...visualizationObject.details, deleting: true}
            },
            ...state.visualizationObjects.slice(visualizationObjectIndex + 1)
          ]
        }
        : state;
    }

    case VisualizationActions.DELETE_SUCCESS: {
      const visualizationObject: Visualization = _.find(
        state.visualizationObjects,
        ['id', action.payload.visualizationId]
      );
      const visualizationObjectIndex = state.visualizationObjects.indexOf(
        visualizationObject
      );

      return visualizationObjectIndex !== -1
        ? {
          ...state,
          visualizationObjects: [
            ...state.visualizationObjects.slice(0, visualizationObjectIndex),
            ...state.visualizationObjects.slice(visualizationObjectIndex + 1)
          ]
        }
        : state;
    }

    case VisualizationActions.DELETE_FAIL: {
      const visualizationObject: Visualization = _.find(
        state.visualizationObjects,
        ['id', action.payload]
      );
      const visualizationObjectIndex = state.visualizationObjects.indexOf(
        visualizationObject
      );
      return visualizationObjectIndex !== -1
        ? {
          ...state,
          visualizationObjects: [
            ...state.visualizationObjects.slice(0, visualizationObjectIndex),
            {
              ...visualizationObject,
              details: {
                ...visualizationObject.details,
                deleting: false,
                deleteFail: true
              }
            },
            ...state.visualizationObjects.slice(visualizationObjectIndex + 1)
          ]
        }
        : state;
    }

    case VisualizationActions.TOGGLE_DELETE_DIALOG: {
      const visualizationObject: Visualization = _.find(
        state.visualizationObjects,
        ['id', action.payload]
      );
      const visualizationObjectIndex = state.visualizationObjects.indexOf(
        visualizationObject
      );
      return visualizationObjectIndex !== -1
        ? {
          ...state,
          visualizationObjects: [
            ...state.visualizationObjects.slice(0, visualizationObjectIndex),
            {
              ...visualizationObject,
              details: {
                ...visualizationObject.details,
                showDeleteDialog: !visualizationObject.details.showDeleteDialog
              }
            },
            ...state.visualizationObjects.slice(visualizationObjectIndex + 1)
          ]
        }
        : state;
    }

    case VisualizationActions.VISUALIZATION_CHANGE: {
      const visualizationObject = _.find(state.visualizationObjects, ['id', action.payload.id]);

      const visualizationObjectIndex = state.visualizationObjects.indexOf(visualizationObject);

      return visualizationObjectIndex !== -1
        ? {
          ...state,
          visualizationObjects: [
            ...state.visualizationObjects.slice(0, visualizationObjectIndex),
            {
              ...visualizationObject,
              details: {
                ...visualizationObject.details,
                currentVisualization: action.payload.type
              }
            },
            ...state.visualizationObjects.slice(visualizationObjectIndex + 1)
          ]
        } : state;
    }

    case VisualizationActions.LOCAL_FILTER_CHANGE: {
      const visualizationObject = _.find(state.visualizationObjects, ['id', action.payload.visualizationObject.id]);

      const visualizationObjectIndex = state.visualizationObjects.indexOf(visualizationObject);

      return visualizationObjectIndex !== -1
        ? {
          ...state,
          visualizationObjects: [
            ...state.visualizationObjects.slice(0, visualizationObjectIndex),
            {
              ...visualizationObject,
              details: {
                ...visualizationObject.details,
                loading: true,
                loaded: false,
                errorMessage: ''
              }
            },
            ...state.visualizationObjects.slice(visualizationObjectIndex + 1)
          ]
        } : state;
    }

    case VisualizationActions.GLOBAL_FILTER_CHANGE: {
      const visualizationToUpdate: Visualization[] = _.map(_.filter(state.visualizationObjects,
        visualizationObject => visualizationObject.dashboardId === action.payload.currentDashboardId &&
          !visualizationObject.details.nonVisualizable), (visualizationObject: Visualization) => {
        return {
          ...visualizationObject,
          details: {
            ...visualizationObject.details,
            loading: true,
            loaded: false,
            errorMessage: ''
          }
        };
      });

      return {
        ...state,
        visualizationObjects: [
          ..._.map(state.visualizationObjects, (visualizationObject: Visualization) => {
            const availableVisualization: Visualization = _.find(visualizationToUpdate, ['id', visualizationObject.id]);
            return availableVisualization || visualizationObject;
          })
        ]
      };
    }

    case VisualizationActions.VISUALIZATION_ERROR_OCCURED: {
      const visualizationObject = _.find(state.visualizationObjects, ['id', action.id]);

      const visualizationObjectIndex = state.visualizationObjects.indexOf(visualizationObject);

      return visualizationObjectIndex !== -1
        ? {
          ...state,
          visualizationObjects: [
            ...state.visualizationObjects.slice(0, visualizationObjectIndex),
            {
              ...visualizationObject,
              details: {
                ...visualizationObject.details,
                loaded: true,
                loading: false,
                hasError: true,
                errorMessage: action.errorMessage
              }
            },
            ...state.visualizationObjects.slice(visualizationObjectIndex + 1)
          ]
        } : state;
    }
  }

  return state;
}
