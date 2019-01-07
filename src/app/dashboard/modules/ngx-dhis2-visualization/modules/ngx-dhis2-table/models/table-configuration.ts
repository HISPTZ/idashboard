export interface TableConfiguration {
  id: string;
  title: string;
  subtitle: string;
  showColumnTotal: boolean;
  showColumnSubtotal: boolean;
  showRowTotal: boolean;
  showRowSubtotal: boolean;
  showDimensionLabels: boolean;
  hideEmptyRows: boolean;
  showHierarchy: boolean;
  rows: any[];
  columns: any[];
  legendDisplayStrategy: string;
  displayList: boolean;
  legendSet: any;
  styles: any;
}
