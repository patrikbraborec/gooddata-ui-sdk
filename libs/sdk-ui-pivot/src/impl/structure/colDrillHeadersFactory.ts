// (C) 2007-2021 GoodData Corporation
import { AnyCol, DataColLeaf, isDataColLeaf, isSliceCol, SliceCol } from "./tableDescriptorTypes";
import { IMappingHeader } from "@gooddata/sdk-ui";
import { IAttributeDescriptor, isResultAttributeHeader } from "@gooddata/sdk-backend-spi";
import invariant, { InvariantError } from "ts-invariant";
import { IGridRow } from "../data/resultTypes";

export function createDataColLeafHeaders(col: DataColLeaf): IMappingHeader[] {
    const mappingHeaders: IMappingHeader[] = [];
    if (col.seriesDescriptor.attributeDescriptors) {
        col.seriesDescriptor.attributeDescriptors.forEach(
            (attributeDescriptor: IAttributeDescriptor, index: number) => {
                const attributeElementDescriptor = col.seriesDescriptor.attributeHeaders![index];
                mappingHeaders.push(attributeElementDescriptor);
                mappingHeaders.push(attributeDescriptor);
            },
        );
    }
    mappingHeaders.push(col.seriesDescriptor.measureDescriptor);

    return mappingHeaders;
}

export function createSliceColHeaders(col: SliceCol, row: IGridRow): IMappingHeader[] {
    const result: IMappingHeader[] = [];

    const attributeElement = row.headerItemMap[col.id];

    invariant(attributeElement, `unable to obtain attribute element for row of a slicing column ${col.id}`);
    invariant(isResultAttributeHeader(attributeElement), `bad header for row data ${col.id}`);

    result.push(attributeElement);
    result.push(col.attributeDescriptor);

    return result;
}

export function createDrillHeaders(col: AnyCol, row?: IGridRow): IMappingHeader[] {
    if (isDataColLeaf(col)) {
        return createDataColLeafHeaders(col);
    } else if (isSliceCol(col)) {
        // if this bombs, then the client is not calling the function at the right time. in order
        // to construct drilling headers for a slice col, both the column & the row data must be
        // available because the attribute element (essential part) is only available in the data itself
        invariant(row);

        return createSliceColHeaders(col, row);
    }

    throw new InvariantError(`unable to obtain drill headers for column of type ${col.type}`);
}
