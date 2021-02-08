// (C) 2007-2021 GoodData Corporation
import { IMappingHeader } from "@gooddata/sdk-ui";
import { ROW_TOTAL } from "../base/constants";

/**
 * All non-grand-total rows in the grid conform to this interface.
 */
export interface IGridRow {
    /**
     * Mapping of column ID => data value
     */
    [key: string]: any;

    /**
     * Mapping of slice column ID => mapping header (detail about slice value)
     */
    headerItemMap: {
        [key: string]: IMappingHeader;
    };

    /**
     * If this is 'special' row such as total or subtotal, then the 'type' will be set to value of
     * ROW_TOTAL or ROW_SUBTOTAL constant. Otherwise the field is not present.
     */
    type?: string;

    subtotalStyle?: string;
}

/**
 * Grand total rows in the table conform to this
 */
export interface IGridTotalsRow {
    type: string;
    colSpan: {
        count: number;
        headerKey: string;
    };
    calculatedForColumns?: string[];

    [key: string]: any;
}

export interface IAgGridPage {
    rowData: IGridRow[];
    rowTotals: IGridTotalsRow[];
}

export function isGridTotalsRow(obj: unknown): obj is IGridTotalsRow {
    return (obj as IGridTotalsRow)?.type === ROW_TOTAL;
}
