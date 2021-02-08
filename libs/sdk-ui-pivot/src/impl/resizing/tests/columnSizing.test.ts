// (C) 2007-2021 GoodData Corporation

import { TableDescriptor } from "../../structure/tableDescriptor";
import {
    ColumnWidthItem,
    IMeasureColumnWidthItem,
    newAttributeColumnLocator,
    newWidthForAllColumnsForMeasure,
    newWidthForAllMeasureColumns,
    newWidthForAttributeColumn,
    newWidthForSelectedColumns,
} from "../../../columnWidths";
import {
    getMaxWidth,
    getMaxWidthCached,
    getUpdatedColumnDefs,
    IWeakMeasureColumnWidthItemsMap,
    MANUALLY_SIZED_MAX_WIDTH,
    MIN_WIDTH as AG_GRID_COLUMN_SIZING_MIN_WIDTH,
    MIN_WIDTH,
    ResizedColumnsStore,
    SORT_ICON_WIDTH,
} from "../agGridColumnSizing";
import {
    ColumnOnlyResultDescriptor,
    SingleMeasureWithRowAttributeDescriptor,
    testStore,
    TwoMeasuresWithRowAttributeDescriptor,
    TwoMeasuresWithTwoRowAndTwoColumnAttributesDescriptor,
} from "./columnSizing.fixture";
import { ReferenceData, ReferenceLdm } from "@gooddata/reference-workspace";
import { getFakeColumn } from "./_old_agGridMock";
import { COLUMN_ATTRIBUTE_COLUMN, MEASURE_COLUMN, ROW_ATTRIBUTE_COLUMN } from "../../base/constants";
import { measureLocalId } from "@gooddata/sdk-model";

// This cannot be created using factory functions & it's very awkward case for which
export const ColumnOnlyWidth: IMeasureColumnWidthItem = {
    measureColumnWidthItem: {
        width: {
            value: 400,
        },
        locators: [
            newAttributeColumnLocator(ReferenceLdm.Product.Name, ReferenceData.ProductName.GrammarPlus.uri),
        ],
    },
};

describe("ResizedColumnStore", () => {
    const Scenarios: Array<[string, TableDescriptor, ColumnWidthItem[]]> = [
        [
            "for attribute column width on table with single row attribute",
            SingleMeasureWithRowAttributeDescriptor,
            [newWidthForAttributeColumn(ReferenceLdm.Product.Name, 200)],
        ],
        [
            "for first attribute column width on table with two row attributes",
            TwoMeasuresWithTwoRowAndTwoColumnAttributesDescriptor,
            [newWidthForAttributeColumn(ReferenceLdm.Product.Name, 200)],
        ],
        [
            "for second attribute column width on table with two row attributes",
            TwoMeasuresWithTwoRowAndTwoColumnAttributesDescriptor,
            [newWidthForAttributeColumn(ReferenceLdm.Department, 200)],
        ],
        [
            "for both attribute columns width on table with two row attributes",
            TwoMeasuresWithTwoRowAndTwoColumnAttributesDescriptor,
            [
                newWidthForAttributeColumn(ReferenceLdm.Department, 200),
                newWidthForAttributeColumn(ReferenceLdm.Product.Name, 300),
            ],
        ],
        [
            "for first measure column on non-pivoted table with two measures",
            TwoMeasuresWithRowAttributeDescriptor,
            [newWidthForSelectedColumns(ReferenceLdm.Amount, [], 100)],
        ],
        [
            "for second measure column on non-pivoted table with two measures",
            TwoMeasuresWithRowAttributeDescriptor,
            [newWidthForSelectedColumns(ReferenceLdm.Won, [], 100)],
        ],
        [
            "for both measure columns on non-pivoted table with two measures",
            TwoMeasuresWithRowAttributeDescriptor,
            [
                newWidthForSelectedColumns(ReferenceLdm.Amount, [], 100),
                newWidthForSelectedColumns(ReferenceLdm.Won, [], 200),
            ],
        ],
        [
            "for exactly one measure column on pivoted table",
            TwoMeasuresWithTwoRowAndTwoColumnAttributesDescriptor,
            [
                newWidthForSelectedColumns(
                    ReferenceLdm.Amount,
                    [
                        newAttributeColumnLocator(
                            ReferenceLdm.ForecastCategory,
                            ReferenceData.ForecastCategory.Include.uri,
                        ),
                        newAttributeColumnLocator(ReferenceLdm.Region, ReferenceData.Region.EastCoast.uri),
                    ],
                    100,
                ),
            ],
        ],
        [
            "for auto-sizing exactly one measure column on pivoted table",
            TwoMeasuresWithTwoRowAndTwoColumnAttributesDescriptor,
            [
                newWidthForSelectedColumns(
                    ReferenceLdm.Amount,
                    [
                        newAttributeColumnLocator(
                            ReferenceLdm.ForecastCategory,
                            ReferenceData.ForecastCategory.Include.uri,
                        ),
                        newAttributeColumnLocator(ReferenceLdm.Region, ReferenceData.Region.EastCoast.uri),
                    ],
                    "auto",
                ),
            ],
        ],
        [
            "for exactly two measure columns of same measure on pivoted table",
            TwoMeasuresWithTwoRowAndTwoColumnAttributesDescriptor,
            [
                newWidthForSelectedColumns(
                    ReferenceLdm.Amount,
                    [
                        newAttributeColumnLocator(
                            ReferenceLdm.ForecastCategory,
                            ReferenceData.ForecastCategory.Include.uri,
                        ),
                        newAttributeColumnLocator(ReferenceLdm.Region, ReferenceData.Region.EastCoast.uri),
                    ],
                    100,
                ),
                newWidthForSelectedColumns(
                    ReferenceLdm.Amount,
                    [
                        newAttributeColumnLocator(
                            ReferenceLdm.ForecastCategory,
                            ReferenceData.ForecastCategory.Exclude.uri,
                        ),
                        newAttributeColumnLocator(ReferenceLdm.Region, ReferenceData.Region.WestCoast.uri),
                    ],
                    200,
                ),
            ],
        ],
        [
            "for exactly two measure columns of two different measures on pivoted table",
            TwoMeasuresWithTwoRowAndTwoColumnAttributesDescriptor,
            [
                newWidthForSelectedColumns(
                    ReferenceLdm.Amount,
                    [
                        newAttributeColumnLocator(
                            ReferenceLdm.ForecastCategory,
                            ReferenceData.ForecastCategory.Include.uri,
                        ),
                        newAttributeColumnLocator(ReferenceLdm.Region, ReferenceData.Region.EastCoast.uri),
                    ],
                    100,
                ),
                newWidthForSelectedColumns(
                    ReferenceLdm.Won,
                    [
                        newAttributeColumnLocator(
                            ReferenceLdm.ForecastCategory,
                            ReferenceData.ForecastCategory.Include.uri,
                        ),
                        newAttributeColumnLocator(ReferenceLdm.Region, ReferenceData.Region.EastCoast.uri),
                    ],
                    200,
                ),
            ],
        ],
        [
            "for auto-sizing exactly two measure columns of two different measures on pivoted table",
            TwoMeasuresWithTwoRowAndTwoColumnAttributesDescriptor,
            [
                newWidthForSelectedColumns(
                    ReferenceLdm.Amount,
                    [
                        newAttributeColumnLocator(
                            ReferenceLdm.ForecastCategory,
                            ReferenceData.ForecastCategory.Include.uri,
                        ),
                        newAttributeColumnLocator(ReferenceLdm.Region, ReferenceData.Region.EastCoast.uri),
                    ],
                    "auto",
                ),
                newWidthForSelectedColumns(
                    ReferenceLdm.Won,
                    [
                        newAttributeColumnLocator(
                            ReferenceLdm.ForecastCategory,
                            ReferenceData.ForecastCategory.Include.uri,
                        ),
                        newAttributeColumnLocator(ReferenceLdm.Region, ReferenceData.Region.EastCoast.uri),
                    ],
                    "auto",
                ),
            ],
        ],
        [
            "for all columns of a first measure on pivoted table",
            TwoMeasuresWithTwoRowAndTwoColumnAttributesDescriptor,
            [newWidthForAllColumnsForMeasure(ReferenceLdm.Amount, 155)],
        ],
        [
            "for all columns of a second measure on pivoted table",
            TwoMeasuresWithTwoRowAndTwoColumnAttributesDescriptor,
            [newWidthForAllColumnsForMeasure(ReferenceLdm.Won, 175)],
        ],
        [
            "for all measure columns on pivoted table",
            TwoMeasuresWithTwoRowAndTwoColumnAttributesDescriptor,
            [newWidthForAllMeasureColumns(125)],
        ],
        [
            "for combination of single measure and all measure widths on pivoted table",
            TwoMeasuresWithTwoRowAndTwoColumnAttributesDescriptor,
            [
                newWidthForSelectedColumns(
                    ReferenceLdm.Amount,
                    [
                        newAttributeColumnLocator(
                            ReferenceLdm.ForecastCategory,
                            ReferenceData.ForecastCategory.Include.uri,
                        ),
                        newAttributeColumnLocator(ReferenceLdm.Region, ReferenceData.Region.EastCoast.uri),
                    ],
                    200,
                ),
                newWidthForAllColumnsForMeasure(ReferenceLdm.Won, 175),
            ],
        ],
        [
            "for combination of attribute, single measure and all measure widths on pivoted table",
            TwoMeasuresWithTwoRowAndTwoColumnAttributesDescriptor,
            [
                newWidthForSelectedColumns(
                    ReferenceLdm.Amount,
                    [
                        newAttributeColumnLocator(
                            ReferenceLdm.ForecastCategory,
                            ReferenceData.ForecastCategory.Include.uri,
                        ),
                        newAttributeColumnLocator(ReferenceLdm.Region, ReferenceData.Region.EastCoast.uri),
                    ],
                    200,
                ),
                newWidthForAttributeColumn(ReferenceLdm.Product.Name, 300),
                newWidthForAllColumnsForMeasure(ReferenceLdm.Won, 175),
            ],
        ],
        ["for measureless column width on column-only table", ColumnOnlyResultDescriptor, [ColumnOnlyWidth]],
    ];

    describe("initial state", () => {
        it.each(Scenarios)("should create valid store %s", (_desc, t, widths) => {
            const store = testStore(t, ...widths);

            expect(store).toMatchSnapshot();
        });

        it("should enforce min-width for column", () => {
            const store = testStore(
                TwoMeasuresWithTwoRowAndTwoColumnAttributesDescriptor,
                newWidthForAllMeasureColumns(10),
            );

            expect(
                store.getManuallyResizedColumn2(
                    TwoMeasuresWithTwoRowAndTwoColumnAttributesDescriptor.getCol("c_0"),
                )!.width,
            ).toEqual(MIN_WIDTH);
        });

        it("should enforce max-width for column", () => {
            const store = testStore(
                TwoMeasuresWithTwoRowAndTwoColumnAttributesDescriptor,
                newWidthForAllMeasureColumns(100000),
            );

            expect(
                store.getManuallyResizedColumn2(
                    TwoMeasuresWithTwoRowAndTwoColumnAttributesDescriptor.getCol("c_0"),
                )!.width,
            ).toEqual(MANUALLY_SIZED_MAX_WIDTH);
        });

        it("should ignore width if using string as value of width", () => {
            const store = testStore(
                TwoMeasuresWithTwoRowAndTwoColumnAttributesDescriptor,
                newWidthForAllMeasureColumns("why, why, why?!" as any),
            );

            expect(
                store.getManuallyResizedColumn2(
                    TwoMeasuresWithTwoRowAndTwoColumnAttributesDescriptor.getCol("c_0"),
                ),
            ).toBeUndefined();
        });
    });

    describe("getColumnWidthsFromMap", () => {
        it.each(Scenarios)("should extract valid width items %s", (_desc, t, widths) => {
            const store = testStore(t, ...widths);

            expect(store.getColumnWidthsFromMap(t)).toEqual(widths);
        });
    });

    describe("removeFromManuallyResizedColumn", () => {
        it("should remove measure from manual resizing", () => {
            const store = testStore(
                TwoMeasuresWithRowAttributeDescriptor,
                newWidthForSelectedColumns(ReferenceLdm.Amount, [], 100),
            );

            const column = getFakeColumn({
                colId: "c_0",
                type: MEASURE_COLUMN,
                suppressSizeToFit: true,
            });

            store.removeFromManuallyResizedColumn(TwoMeasuresWithRowAttributeDescriptor, column);
            expect(column.getColDef().suppressSizeToFit).toBeFalsy();
            expect(
                store.getManuallyResizedColumn(TwoMeasuresWithRowAttributeDescriptor, column),
            ).toBeUndefined();
        });

        it("should remove attribute from manual resizing AND disable suppressSizeToFit", () => {
            const store = testStore(
                TwoMeasuresWithRowAttributeDescriptor,
                newWidthForAttributeColumn(ReferenceLdm.Product.Name, 100),
            );

            const column = getFakeColumn({
                colId: "r_0",
                type: ROW_ATTRIBUTE_COLUMN,
                suppressSizeToFit: true,
            });

            store.removeFromManuallyResizedColumn(TwoMeasuresWithRowAttributeDescriptor, column);
            expect(column.getColDef().suppressSizeToFit).toBeFalsy();
            expect(
                store.getManuallyResizedColumn(TwoMeasuresWithRowAttributeDescriptor, column),
            ).toBeUndefined();
        });

        it("should remove attribute from manual resizing AND disable suppressSizeToFit even when all measures have column width set", () => {
            const store = testStore(
                TwoMeasuresWithRowAttributeDescriptor,
                newWidthForAttributeColumn(ReferenceLdm.Product.Name, 100),
                newWidthForAllMeasureColumns(200),
            );

            const column = getFakeColumn({
                colId: "r_0",
                type: ROW_ATTRIBUTE_COLUMN,
                suppressSizeToFit: true,
            });

            store.removeFromManuallyResizedColumn(TwoMeasuresWithRowAttributeDescriptor, column);
            expect(column.getColDef().suppressSizeToFit).toBeFalsy();
            expect(
                store.getManuallyResizedColumn(TwoMeasuresWithRowAttributeDescriptor, column),
            ).toBeUndefined();
        });

        it("should set auto-width for measure column when column not sized but auto-width is used", () => {
            const store = testStore(TwoMeasuresWithRowAttributeDescriptor, newWidthForAllMeasureColumns(155));

            const column = getFakeColumn({
                colId: "c_0",
                type: MEASURE_COLUMN,
            });

            store.removeFromManuallyResizedColumn(TwoMeasuresWithRowAttributeDescriptor, column);
            expect(store).toMatchSnapshot();
        });

        it("should set auto-width for measure column when column sized but auto-width is used", () => {
            const store = testStore(
                TwoMeasuresWithRowAttributeDescriptor,
                newWidthForAllMeasureColumns(155),
                newWidthForSelectedColumns(ReferenceLdm.Amount, [], 175),
            );

            const column = getFakeColumn({
                colId: "c_0",
                type: MEASURE_COLUMN,
            });

            store.removeFromManuallyResizedColumn(TwoMeasuresWithRowAttributeDescriptor, column);
            expect(store).toMatchSnapshot();
        });
    });

    describe("removeAllMeasureColumns", () => {
        const Scenarios: Array<[string, TableDescriptor, ColumnWidthItem[], string | number | undefined]> = [
            [
                "keep fixed-size single measure column setting",
                TwoMeasuresWithRowAttributeDescriptor,
                [newWidthForSelectedColumns(ReferenceLdm.Amount, [], 100)],
                100,
            ],
            [
                "remove measure column settings when using auto-size",
                TwoMeasuresWithRowAttributeDescriptor,
                [newWidthForSelectedColumns(ReferenceLdm.Amount, [], "auto")],
                undefined,
            ],
            [
                "remove all measure width setting",
                TwoMeasuresWithRowAttributeDescriptor,
                [newWidthForAllMeasureColumns(100)],
                undefined,
            ],
        ];

        it.each(Scenarios)("should %s", (_desc, t, widths, expected) => {
            const store = testStore(t, ...widths);

            store.removeAllMeasureColumns();
            const column = getFakeColumn({
                colId: "c_0",
                type: MEASURE_COLUMN,
            });

            expect(store.getManuallyResizedColumn(t, column)?.width).toEqual(expected);
        });
    });

    describe("removeWeakMeasureColumn", () => {
        it("should remove weak column with auto-size", () => {
            const store = testStore(
                TwoMeasuresWithTwoRowAndTwoColumnAttributesDescriptor,
                newWidthForAllColumnsForMeasure(ReferenceLdm.Amount, 150),
            );

            const column = getFakeColumn({
                colId: "c_0",
                type: MEASURE_COLUMN,
                width: 111,
            });

            store.removeWeakMeasureColumn(TwoMeasuresWithTwoRowAndTwoColumnAttributesDescriptor, column);
            expect(
                store.getManuallyResizedColumn(TwoMeasuresWithTwoRowAndTwoColumnAttributesDescriptor, column),
            ).toBeUndefined();
        });

        it("should clear auto-width for measure column", () => {
            const store = testStore(
                TwoMeasuresWithRowAttributeDescriptor,
                newWidthForAllColumnsForMeasure(ReferenceLdm.Amount, 100),
                newWidthForSelectedColumns(ReferenceLdm.Amount, [], 175),
            );

            const column = getFakeColumn({
                colId: "c_0",
                type: MEASURE_COLUMN,
            });

            // after this call, store has entry for col c_0 with width 'auto'
            store.removeFromManuallyResizedColumn(TwoMeasuresWithRowAttributeDescriptor, column);
            // this call should clean it up
            store.removeWeakMeasureColumn(TwoMeasuresWithTwoRowAndTwoColumnAttributesDescriptor, column);
            expect(store).toMatchSnapshot();
        });
    });

    describe("addWeekMeasureColumn", () => {
        it("should do nothing when column type is not MEASURE_COLUMN", () => {
            const store = testStore(ColumnOnlyResultDescriptor);

            // first column (c_0) is for the Amount measure
            const column = getFakeColumn({
                colId: "cg_0",
                type: COLUMN_ATTRIBUTE_COLUMN,
                width: 111,
            });

            store.addWeekMeasureColumn(ColumnOnlyResultDescriptor, column);
            expect(store).toMatchSnapshot();
        });

        it("should add weak column", () => {
            const store = testStore(TwoMeasuresWithTwoRowAndTwoColumnAttributesDescriptor);

            // first column (c_0) is for the Amount measure
            const column = getFakeColumn({
                colId: "c_0",
                type: MEASURE_COLUMN,
                width: 111,
            });

            store.addWeekMeasureColumn(TwoMeasuresWithTwoRowAndTwoColumnAttributesDescriptor, column);
            expect(store).toMatchSnapshot();
        });

        it("should replace single row measure width with weak column", () => {
            const store = testStore(
                TwoMeasuresWithTwoRowAndTwoColumnAttributesDescriptor,
                newWidthForSelectedColumns(
                    ReferenceLdm.Amount,
                    [
                        newAttributeColumnLocator(
                            ReferenceLdm.ForecastCategory,
                            ReferenceData.ForecastCategory.Include.uri,
                        ),
                        newAttributeColumnLocator(ReferenceLdm.Region, ReferenceData.Region.EastCoast.uri),
                    ],
                    100,
                ),
            );

            // first column (c_0) is for the Amount measure
            const column = getFakeColumn({
                colId: "c_0",
                type: MEASURE_COLUMN,
                width: 111,
            });

            store.addWeekMeasureColumn(TwoMeasuresWithTwoRowAndTwoColumnAttributesDescriptor, column);
            expect(store).toMatchSnapshot();
        });
    });

    describe("addAllMeasureColumns", () => {
        const weakMeasuresColumnWidths: IWeakMeasureColumnWidthItemsMap = {};
        weakMeasuresColumnWidths[measureLocalId(ReferenceLdm.Amount)] = {
            measureColumnWidthItem: {
                width: {
                    value: 350,
                },
                locator: {
                    measureLocatorItem: {
                        measureIdentifier: measureLocalId(ReferenceLdm.Amount),
                    },
                },
            },
        };

        it("should add all measure columns", () => {
            const resizedColumnsStore = new ResizedColumnsStore();
            const columnsMock = [
                getFakeColumn({
                    type: MEASURE_COLUMN,
                }),
            ];
            resizedColumnsStore.addAllMeasureColumn(42, columnsMock);
            const expectedResult = 42;
            const result = (resizedColumnsStore as any).allMeasureColumnWidth;
            expect(result).toEqual(expectedResult);
        });

        it("should omit from manually resized map by colId", () => {
            const resizedColumnsStore = new ResizedColumnsStore({
                m_0: {
                    width: {
                        value: 400,
                    },
                },
            });
            const columnsMock = [
                getFakeColumn({
                    colId: "m_0",
                    type: MEASURE_COLUMN,
                }),
                getFakeColumn({
                    type: MEASURE_COLUMN,
                }),
            ];
            resizedColumnsStore.addAllMeasureColumn(42, columnsMock);
            const result = (resizedColumnsStore as any).manuallyResizedColumns.m_0;
            expect(result).toBeUndefined();
        });

        it("should omit from manually resized map by colId and kept other items", () => {
            const resizedColumnsStore = new ResizedColumnsStore({
                m_0: { width: { value: 400 } },
                a_1055: { width: { value: 200 } },
            });
            const columnsMock = [
                getFakeColumn({
                    colId: "m_0",
                    type: MEASURE_COLUMN,
                }),
                getFakeColumn({
                    type: MEASURE_COLUMN,
                }),
            ];
            resizedColumnsStore.addAllMeasureColumn(42, columnsMock);
            const result = (resizedColumnsStore as any).manuallyResizedColumns.a_1055.width.value;
            const correctWidth = 200;
            expect(result).toEqual(correctWidth);
        });

        it("should clear all weakMeasuresColumnWidths", () => {
            const resizedColumnsStore = new ResizedColumnsStore(
                {
                    m_0: { width: { value: 400 } },
                    a_4DOTdf: { width: { value: 200 } },
                },
                null,
                weakMeasuresColumnWidths,
            );

            const columnsMock = [
                getFakeColumn({
                    colId: "m_0",
                    type: MEASURE_COLUMN,
                }),
                getFakeColumn({
                    type: MEASURE_COLUMN,
                }),
            ];
            resizedColumnsStore.addAllMeasureColumn(42, columnsMock);

            expect((resizedColumnsStore as any).weakMeasuresColumnWidths).toEqual({});
        });
    });

    describe("addToManuallyResizedColumn", () => {
        it("should add manually resized column to map", () => {
            const resizedColumnsStore = new ResizedColumnsStore();
            const correctWidth = 42;
            const columnMock = getFakeColumn({
                colId: "m_1",
                width: correctWidth,
            });
            resizedColumnsStore.addToManuallyResizedColumn(columnMock);
            const result = (resizedColumnsStore as any).manuallyResizedColumns.m_1.width.value;
            expect(result).toBe(correctWidth);
        });
    });

    describe("getManuallyResizedColumn", () => {
        const TestTable = TwoMeasuresWithTwoRowAndTwoColumnAttributesDescriptor;
        const TestCol = getFakeColumn({ colId: "c_0" });

        it("should return all measure column width", () => {
            const store = testStore(TestTable, newWidthForAllMeasureColumns(125));

            expect(store.getManuallyResizedColumn(TestTable, TestCol)?.width).toEqual(125);
        });

        it("should return after adding weak column", () => {
            const store = testStore(TestTable);

            const column = getFakeColumn({ colId: "c_0", width: 125 });
            store.addWeekMeasureColumn(TestTable, column);

            expect(store.getManuallyResizedColumn(TestTable, TestCol)?.width).toEqual(125);
        });

        it("should return after adding manual column", () => {
            const store = testStore(TestTable);

            const column = getFakeColumn({ colId: "c_0", width: 125 });
            store.addToManuallyResizedColumn(column);

            expect(store.getManuallyResizedColumn(TestTable, TestCol)?.width).toEqual(125);
        });

        it("should return manual size column after adding both manual and weak columns", () => {
            const store = testStore(TestTable);

            const column = getFakeColumn({ colId: "c_0", width: 125 });
            const weak = getFakeColumn({ colId: "c_0", width: 150 });
            store.addToManuallyResizedColumn(column);
            store.addWeekMeasureColumn(TestTable, weak);

            expect(store.getManuallyResizedColumn(TestTable, TestCol)?.width).toEqual(125);
        });

        it("should return single column with when added measure-less column", () => {
            const store = testStore(ColumnOnlyResultDescriptor);

            // first column (c_0) is for the Amount measure
            const column = getFakeColumn({
                colId: "cg_0",
                type: COLUMN_ATTRIBUTE_COLUMN,
                width: 111,
            });

            store.addToManuallyResizedColumn(column);
            expect(store.getManuallyResizedColumn(ColumnOnlyResultDescriptor, column)?.width).toEqual(111);
        });

        it("should not return with after adding weak column and removing manual resize column", () => {
            const store = testStore(TestTable);

            const column = getFakeColumn({ colId: "c_0", width: 125 });
            store.addWeekMeasureColumn(TestTable, column);
            store.removeFromManuallyResizedColumn(TestTable, column);

            expect(store.getManuallyResizedColumn(TestTable, TestCol)?.width).toBeUndefined();
        });

        it("should return all measure for columns width", () => {
            const store = testStore(TestTable, newWidthForAllColumnsForMeasure(ReferenceLdm.Amount, 125));

            expect(store.getManuallyResizedColumn(TestTable, TestCol)?.width).toEqual(125);
        });

        it("should return explicit measure column width", () => {
            const store = testStore(
                TestTable,
                newWidthForSelectedColumns(
                    ReferenceLdm.Amount,
                    [
                        newAttributeColumnLocator(
                            ReferenceLdm.ForecastCategory,
                            ReferenceData.ForecastCategory.Exclude.uri,
                        ),
                        newAttributeColumnLocator(ReferenceLdm.Region, ReferenceData.Region.EastCoast.uri),
                    ],
                    125,
                ),
            );

            expect(store.getManuallyResizedColumn(TestTable, TestCol)?.width).toEqual(125);
        });
    });

    describe("getMaxWidth", () => {
        const width = 20;
        const measureTextMock = jest.fn();
        const context: any = {
            measureText: measureTextMock.mockReturnValue({ width }),
        };

        it("should return correct new max width when sort is set to true", () => {
            const correctWidth = width + SORT_ICON_WIDTH;
            expect(getMaxWidth(context, "text", true, 15)).toBe(correctWidth);
        });

        it("should return correct new max width when sort is set to false", () => {
            const correctWidth = width;
            expect(getMaxWidth(context, "text", false, 15)).toBe(correctWidth);
        });

        it("should return undefined when maxWidth is bigger than the measured width", () => {
            const maxWidth = 100;
            expect(getMaxWidth(context, "text", true, maxWidth)).toBeUndefined();
        });
    });

    describe("getMaxWidthCached", () => {
        const width = 20;
        const measureTextMock = jest.fn();
        const context: any = {
            measureText: measureTextMock.mockReturnValue({ width }),
        };
        const widthsCache: Map<string, number> = new Map();

        it("should return correct width from cache", () => {
            const correctWidth = width;
            widthsCache.set("text", correctWidth);
            expect(getMaxWidthCached(context, "text", 15, widthsCache)).toBe(correctWidth);
        });

        it("should return correct width when string is not in cache", () => {
            const correctWidth = width;
            widthsCache.set("text", 100);
            expect(getMaxWidthCached(context, "new_text", 15, widthsCache)).toBe(correctWidth);
        });

        it("should return undefined when maxWidth is bigger than the measured width", () => {
            const maxWidth = 100;
            widthsCache.set("text", 20);
            expect(getMaxWidthCached(context, "text", maxWidth, widthsCache)).toBeUndefined();
        });
    });

    describe("getUpdatedColumnDefs", () => {
        const column1 = {
            getColDef: jest.fn().mockReturnValue({ field: "text1" }),
        };
        const column2 = {
            getColDef: jest.fn().mockReturnValue({ field: "text2" }),
        };
        const column3 = {
            getColDef: jest.fn().mockReturnValue({ field: "text3" }),
        };
        const column4 = {
            getColDef: jest.fn().mockReturnValue({ field: "text4" }),
        };
        const columns: any = [column1, column2, column3];
        const padding = 10;

        it("should return correct column definitions with calculated width", () => {
            const width = 100;
            const maxWidths: Map<string, number> = new Map();
            maxWidths.set("text1", width);
            maxWidths.set("text2", width);
            maxWidths.set("text3", width);
            const correctColDefs: any = [
                {
                    field: "text1",
                    width: width + padding,
                },
                {
                    field: "text2",
                    width: width + padding,
                },
                {
                    field: "text3",
                    width: width + padding,
                },
            ];
            expect(getUpdatedColumnDefs(columns, maxWidths, padding)).toStrictEqual(correctColDefs);
        });

        it("should return correct column definitions with calculated width and one column definition with min width", () => {
            const width = 100;
            const maxWidths: Map<string, number> = new Map();
            maxWidths.set("text1", width);
            maxWidths.set("text2", width);
            maxWidths.set("text3", width);
            const newColumns = [...columns, column4];
            const correctColDefs: any = [
                {
                    field: "text1",
                    width: width + padding,
                },
                {
                    field: "text2",
                    width: width + padding,
                },
                {
                    field: "text3",
                    width: width + padding,
                },
                {
                    field: "text4",
                    width: AG_GRID_COLUMN_SIZING_MIN_WIDTH,
                },
            ];
            expect(getUpdatedColumnDefs(newColumns, maxWidths, padding)).toStrictEqual(correctColDefs);
        });
    });
});
