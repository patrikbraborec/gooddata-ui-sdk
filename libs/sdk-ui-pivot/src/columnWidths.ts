// (C) 2007-2021 GoodData Corporation
import isEmpty from "lodash/isEmpty";
import { attributeLocalId, IAttribute, Identifier, IMeasure, measureLocalId } from "@gooddata/sdk-model";

//
// types used in implementation internals
//

/**
 * @internal
 */
export enum ColumnEventSourceType {
    AUTOSIZE_COLUMNS = "autosizeColumns",
    UI_DRAGGED = "uiColumnDragged",
    FIT_GROW = "growToFit",
}

/**
 * @internal
 */
export enum UIClick {
    CLICK = 1,
    DOUBLE_CLICK = 2,
}

/**
 * @internal
 */
export interface IResizedColumns {
    [columnIdentifier: string]: IManuallyResizedColumnsItem;
}

/**
 * @internal
 */
export interface IManuallyResizedColumnsItem {
    width: number;
    allowGrowToFit?: boolean;
}

//
//
//

/**
 * @public
 */
export interface IAbsoluteColumnWidth {
    value: number;
    allowGrowToFit?: boolean;
}

/**
 * @public
 */
export interface IAutoColumnWidth {
    value: "auto";
}

/**
 * @public
 */
export type ColumnWidth = IAbsoluteColumnWidth | IAutoColumnWidth;

/**
 * @public
 */
export interface IAttributeColumnWidthItem {
    attributeColumnWidthItem: {
        width: IAbsoluteColumnWidth;
        attributeIdentifier: Identifier;
    };
}

/**
 * @public
 */
export interface IMeasureColumnWidthItem {
    measureColumnWidthItem: {
        width: ColumnWidth;
        locators: ColumnLocator[];
    };
}

/**
 * @public
 */
export interface IAllMeasureColumnWidthItem {
    measureColumnWidthItem: {
        width: IAbsoluteColumnWidth;
    };
}

/**
 * @public
 */
export interface IWeakMeasureColumnWidthItem {
    measureColumnWidthItem: {
        width: IAbsoluteColumnWidth;
        locator: IMeasureColumnLocator;
    };
}

/**
 * @public
 */
export type ColumnWidthItem =
    | IAttributeColumnWidthItem
    | IMeasureColumnWidthItem
    | IAllMeasureColumnWidthItem
    | IWeakMeasureColumnWidthItem;

/**
 * @public
 */
export type ColumnLocator = IAttributeColumnLocator | IMeasureColumnLocator;

/**
 * Locates table column by column measure's localId.
 *
 * @public
 */
export interface IMeasureColumnLocator {
    measureLocatorItem: {
        /**
         * Local identifier of the measure.
         */
        measureIdentifier: Identifier;
    };
}

/**
 * Locates all columns for an attribute or columns for particular attribute element.
 *
 * @public
 */
export interface IAttributeColumnLocator {
    attributeLocatorItem: {
        /**
         * Local identifier of the attribute
         */
        attributeIdentifier: Identifier;

        /**
         * Optionally attribute element URI / primary key.
         */
        element?: string;
    };
}

/**
 * Tests whether object is an instance of {@link IMeasureColumnLocator}
 *
 * @public
 */
export function isMeasureColumnLocator(obj: unknown): obj is IMeasureColumnLocator {
    return !isEmpty(obj) && (obj as IMeasureColumnLocator).measureLocatorItem !== undefined;
}

/**
 * Tests whether object is an instance of {@link IAttributeColumnLocator}
 *
 * @public
 */
export function isAttributeColumnLocator(obj: unknown): obj is IAttributeColumnLocator {
    return !isEmpty(obj) && (obj as IAttributeColumnLocator).attributeLocatorItem !== undefined;
}

/**
 * Tests whether object is an instance of {@link IAbsoluteColumnWidth}
 *
 * @public
 */
export function isAbsoluteColumnWidth(columnWidth: ColumnWidth): columnWidth is IAbsoluteColumnWidth {
    return Number(columnWidth.value) === columnWidth.value;
}

/**
 * Tests whether object is an instance of {@link IAttributeColumnWidthItem}
 *
 * @public
 */
export function isAttributeColumnWidthItem(obj: unknown): obj is IAttributeColumnWidthItem {
    return !isEmpty(obj) && (obj as IAttributeColumnWidthItem).attributeColumnWidthItem !== undefined;
}

/**
 * Tests whether object is an instance of {@link IMeasureColumnWidthItem}
 *
 * @public
 */
export function isMeasureColumnWidthItem(obj: unknown): obj is IMeasureColumnWidthItem {
    return (
        !isEmpty(obj) &&
        (obj as IMeasureColumnWidthItem).measureColumnWidthItem !== undefined &&
        (obj as IMeasureColumnWidthItem).measureColumnWidthItem.locators !== undefined
    );
}

/**
 * Tests whether object is an instance of {@link IAllMeasureColumnWidthItem}
 *
 * @public
 */
export function isAllMeasureColumnWidthItem(obj: unknown): obj is IAllMeasureColumnWidthItem {
    return (
        !isEmpty(obj) &&
        (obj as IAllMeasureColumnWidthItem).measureColumnWidthItem !== undefined &&
        (obj as IMeasureColumnWidthItem).measureColumnWidthItem.locators === undefined &&
        (obj as IWeakMeasureColumnWidthItem).measureColumnWidthItem.locator === undefined
    );
}

/**
 * Tests whether object is an instance of {@link IWeakMeasureColumnWidthItem}
 *
 * @public
 */
export function isWeakMeasureColumnWidthItem(obj: unknown): obj is IWeakMeasureColumnWidthItem {
    return (
        !isEmpty(obj) &&
        (obj as IWeakMeasureColumnWidthItem).measureColumnWidthItem !== undefined &&
        (obj as IWeakMeasureColumnWidthItem).measureColumnWidthItem.locator !== undefined
    );
}

/**
 * @internal
 */
export function newMeasureColumnLocator(measureOrId: IMeasure | string): IMeasureColumnLocator {
    const measureIdentifier = measureLocalId(measureOrId);

    return {
        measureLocatorItem: {
            measureIdentifier,
        },
    };
}

/**
 * Creates width item that will set width of a column which contains values of a row attribute.
 *
 * @param attributeOrId - attribute specified by value or by localId reference
 * @param width - width in pixels
 * @param allowGrowToFit - indicates whether the column is allowed to grow if the table's growToFit is enabled
 * @public
 */
export function newWidthForAttributeColumn(
    attributeOrId: IAttribute | string,
    width: number,
    allowGrowToFit?: boolean,
): IAttributeColumnWidthItem {
    const growToFitProp = allowGrowToFit !== undefined ? { allowGrowToFit } : {};

    return {
        attributeColumnWidthItem: {
            attributeIdentifier: attributeLocalId(attributeOrId),
            width: {
                value: width,
                ...growToFitProp,
            },
        },
    };
}

/**
 * Creates width item that will set width for all measure columns in the table.
 *
 * @param width - width in pixels
 * @param allowGrowToFit - indicates whether the column is allowed to grow if the table's growToFit is enabled
 * @public
 */
export function newWidthForAllMeasureColumns(
    width: number,
    allowGrowToFit?: boolean,
): IAllMeasureColumnWidthItem {
    const growToFitProp = allowGrowToFit !== undefined ? { allowGrowToFit } : {};

    return {
        measureColumnWidthItem: {
            width: {
                value: width,
                ...growToFitProp,
            },
        },
    };
}

/**
 * Creates width item that will set width for all columns containing values of the provided measure.
 *
 * @param measureOrId - measure specified either by value or by localId reference
 * @param width - width in pixels
 * @param allowGrowToFit - indicates whether the column is allowed to grow if the table's growToFit is enabled
 * @public
 */
export function newWidthForAllColumnsForMeasure(
    measureOrId: IMeasure | string,
    width: number,
    allowGrowToFit?: boolean,
): IWeakMeasureColumnWidthItem {
    const locator = newMeasureColumnLocator(measureOrId);
    const growToFitProp = allowGrowToFit !== undefined ? { allowGrowToFit } : {};

    return {
        measureColumnWidthItem: {
            width: {
                value: width,
                ...growToFitProp,
            },
            locator,
        },
    };
}

/**
 * Creates width item that will set width for all columns containing values of the provided measure.
 *
 * See also {@link newAttributeColumnLocator} to learn more about the attribute column locators.
 *
 * @param measureOrId - measure specified either by value or by localId reference
 * @param locators - attribute locators to narrow down selection
 * @param width - width in pixels
 * @param allowGrowToFit - indicates whether the column is allowed to grow if the table's growToFit is enabled
 * @public
 */
export function newWidthForSelectedColumns(
    measureOrId: IMeasure | string,
    locators: IAttributeColumnLocator[],
    width: number | "auto",
    allowGrowToFit?: boolean,
): IMeasureColumnWidthItem {
    const measureLocator = newMeasureColumnLocator(measureOrId);
    const growToFitProp = allowGrowToFit !== undefined && width !== "auto" ? { allowGrowToFit } : {};

    // Note: beware here. The attribute locators _must_ come first for some obscure, impl dependent reason
    return {
        measureColumnWidthItem: {
            width: {
                value: width,
                ...growToFitProp,
            },
            locators: [...locators, measureLocator],
        },
    };
}

/**
 * Creates a new attribute column locator - this is used to narrow down location of measure columns in pivot table, where
 * measures are further scoped by different attribute elements - imagine pivot table with defined for measure 'Amount' and column
 * attribute 'Product'. The table will have multiple columns for the 'Amount' measure - each for different element of the
 * 'Product' attribute. In this context, identifying particular measure columns needs to be more specific.
 *
 * The attribute column locator can match either single element of particular attribute, or all elements of particular
 * attribute.
 *
 * @param attributeOrId - column attribute specified by either value or by localId reference
 * @param element - optionally specify attribute element URI or primary key; if not specified, the locator will match
 *  all elements of the attribute
 * @public
 */
export function newAttributeColumnLocator(
    attributeOrId: IAttribute | string,
    element?: string,
): IAttributeColumnLocator {
    return {
        attributeLocatorItem: {
            attributeIdentifier: attributeLocalId(attributeOrId),
            element,
        },
    };
}
