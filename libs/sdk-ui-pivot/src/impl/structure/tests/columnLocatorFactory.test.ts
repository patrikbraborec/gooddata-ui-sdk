// (C) 2007-2021 GoodData Corporation

import {
    SingleMeasureWithRowAttribute,
    SingleMeasureWithTwoRowAndTwoColumnAttributes,
} from "./table.fixture";
import { TableDescriptor } from "../tableDescriptor";
import { createColumnLocator } from "../colLocatorFactory";
import { DataColGroup } from "../tableDescriptorTypes";

describe("createColumnLocator", () => {
    it("creates valid leaf column locator in table without column attributes", () => {
        const t = TableDescriptor.for(SingleMeasureWithRowAttribute);

        expect(createColumnLocator(t.headers.leafDataCols[0])).toMatchSnapshot();
    });

    it("creates valid leaf column locator in table with column attributes", () => {
        const t = TableDescriptor.for(SingleMeasureWithTwoRowAndTwoColumnAttributes);

        expect(createColumnLocator(t.headers.leafDataCols[0])).toMatchSnapshot();
    });

    it("creates valid group column locator for top-level group in table with column attributes", () => {
        const t = TableDescriptor.for(SingleMeasureWithTwoRowAndTwoColumnAttributes);

        const topLevelGroup = t.headers.rootDataCols[0].children[0] as DataColGroup;

        expect(createColumnLocator(topLevelGroup)).toMatchSnapshot();
    });

    it("creates valid group column locator for second-level group in table with column attributes", () => {
        const t = TableDescriptor.for(SingleMeasureWithTwoRowAndTwoColumnAttributes);

        const secondLevelGroup = t.headers.rootDataCols[0].children[0].children[0] as DataColGroup;

        expect(createColumnLocator(secondLevelGroup)).toMatchSnapshot();
    });
});
