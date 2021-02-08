// (C) 2021 GoodData Corporation
import { DataColLeaf, SliceCol } from "./tableDescriptorTypes";
import {
    IAttributeLocatorItem,
    IMeasureLocatorItem,
    isAttributeLocator,
    isAttributeSort,
    isMeasureSort,
    ISortItem,
    sortMeasureLocators,
} from "@gooddata/sdk-model";
import invariant from "ts-invariant";

function attributeLocatorMatch(col: DataColLeaf, locator: IAttributeLocatorItem): boolean {
    const { attributeDescriptors, attributeHeaders } = col.seriesDescriptor;
    const { attributeIdentifier, element } = locator.attributeLocatorItem;

    if (!attributeDescriptors || !attributeHeaders) {
        return false;
    }

    const attributeIdx = attributeDescriptors.findIndex(
        (d) => d.attributeHeader.localIdentifier === attributeIdentifier,
    );

    if (attributeIdx === -1) {
        return false;
    }

    // if this happens then either data access infrastructure or the col descriptor method is hosed. there must
    // always be same number of descriptors and headers.
    invariant(attributeHeaders[attributeIdx]);

    return attributeHeaders[attributeIdx].attributeHeaderItem.uri === element;
}

function measureLocatorMatch(col: DataColLeaf, locator: IMeasureLocatorItem): boolean {
    const { measureDescriptor } = col.seriesDescriptor;
    const { measureIdentifier } = locator.measureLocatorItem;

    return measureDescriptor.measureHeaderItem.localIdentifier === measureIdentifier;
}

export function measureSortMatcher(col: DataColLeaf, sortItem: ISortItem): boolean {
    return (
        isMeasureSort(sortItem) &&
        sortMeasureLocators(sortItem).every((locator) => {
            if (isAttributeLocator(locator)) {
                return attributeLocatorMatch(col, locator);
            } else {
                return measureLocatorMatch(col, locator);
            }
        })
    );
}

export function attributeSortMatcher(col: SliceCol, sortItem: ISortItem): boolean {
    return (
        isAttributeSort(sortItem) &&
        col.attributeDescriptor.attributeHeader.localIdentifier ===
            sortItem.attributeSortItem.attributeIdentifier
    );
}
