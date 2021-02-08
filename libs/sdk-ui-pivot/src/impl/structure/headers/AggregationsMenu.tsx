// (C) 2019 GoodData Corporation
import { attributeDescriptorLocalId, IAttributeDescriptor } from "@gooddata/sdk-backend-spi";
import {
    IExecutionDefinition,
    isMeasureValueFilter,
    ITotal,
    TotalType,
    measureValueFilterCondition,
    isRankingFilter,
} from "@gooddata/sdk-model";
import cx from "classnames";
import React from "react";
import { IntlShape } from "react-intl";
import { Bubble, BubbleHoverTrigger, Header, Item, ItemsWrapper } from "@gooddata/sdk-ui-kit";
import noop from "lodash/noop";

import Menu from "../../../menu/Menu";
import { IOnOpenedChangeParams } from "../../../menu/MenuSharedTypes";
import { IMenuAggregationClickConfig } from "../../../types";
import menuHelper from "./aggregationsMenuHelper";
import AggregationsSubMenu from "./AggregationsSubMenu";
import { AVAILABLE_TOTALS } from "../../base/constants";
import { IColumnTotal } from "./aggregationsMenuTypes";
import { DataViewFacade } from "@gooddata/sdk-ui";
import { TableDescriptor } from "../tableDescriptor";
import { isDataColGroup, isDataColLeaf, isDataColRootGroup, isSliceCol } from "../tableDescriptorTypes";

/*
 * TODO: same thing is in sdk-ui-ext .. but pivot must not depend on it. we may be in need of some lower-level
 *  project on which both of filters and ext can depend. perhaps the purpose of the new project would be to provide
 *  thin layer on top of goodstrap (?)
 */
const SHOW_DELAY_DEFAULT = 200;
const HIDE_DELAY_DEFAULT = 0;

export interface IAggregationsMenuProps {
    intl: IntlShape;
    isMenuOpened: boolean;
    isMenuButtonVisible: boolean;
    showSubmenu: boolean;
    colId: string;
    getTableDescriptor: () => TableDescriptor;
    getExecutionDefinition: () => IExecutionDefinition;
    getDataView: () => DataViewFacade;
    getTotals?: () => ITotal[];
    onAggregationSelect: (clickConfig: IMenuAggregationClickConfig) => void;
    onMenuOpenedChange: ({ opened, source }: IOnOpenedChangeParams) => void;
}

export default class AggregationsMenu extends React.Component<IAggregationsMenuProps> {
    public render(): React.ReactNode {
        const { intl, colId, getTableDescriptor, getDataView, isMenuOpened, onMenuOpenedChange } = this.props;

        if (!colId) {
            return null;
        }

        // Because of Ag-grid react wrapper does not rerender the component when we pass
        // new gridOptions we need to pull the data manually on each render
        const dv: DataViewFacade = getDataView();
        const tableDescriptor = getTableDescriptor();

        if (!dv) {
            return null;
        }

        if (!tableDescriptor.canTableHaveTotals()) {
            return null;
        }

        const col = tableDescriptor.getCol(colId);

        if (isSliceCol(col) || isDataColRootGroup(col)) {
            // aggregation menu should not appear on headers of the slicing columns or on the
            // very to header which describes table grouping
            return null;
        }

        const measures = isDataColLeaf(col)
            ? [col.seriesDescriptor.measureDescriptor]
            : tableDescriptor.getMeasures();
        const measureLocalIdentifiers = measures.map((m) => m.measureHeaderItem.localIdentifier);
        const totalsForHeader = this.getColumnTotals(measureLocalIdentifiers, isDataColGroup(col));

        return (
            <Menu
                toggler={<div className="menu-icon" />}
                togglerWrapperClassName={this.getTogglerClassNames()}
                opened={isMenuOpened}
                onOpenedChange={onMenuOpenedChange}
                openAction={"click"}
                closeOnScroll={true}
            >
                <ItemsWrapper>
                    <div className="s-table-header-menu-content">
                        <Header>{intl.formatMessage({ id: "visualizations.menu.aggregations" })}</Header>
                        {this.renderMainMenuItems(
                            totalsForHeader,
                            measureLocalIdentifiers,
                            tableDescriptor.getSlicingAttributes(),
                        )}
                    </div>
                </ItemsWrapper>
            </Menu>
        );
    }

    private getColumnTotals(measureLocalIdentifiers: string[], isGroupedHeader: boolean): IColumnTotal[] {
        const columnTotals = this.props.getTotals?.() ?? [];

        if (isGroupedHeader) {
            return menuHelper.getTotalsForAttributeHeader(columnTotals, measureLocalIdentifiers);
        }

        return menuHelper.getTotalsForMeasureHeader(columnTotals, measureLocalIdentifiers[0]);
    }

    private getTogglerClassNames() {
        const { isMenuButtonVisible, isMenuOpened } = this.props;

        return cx("s-table-header-menu", "gd-pivot-table-header-menu", {
            "gd-pivot-table-header-menu--show": isMenuButtonVisible,
            "gd-pivot-table-header-menu--hide": !isMenuButtonVisible,
            "gd-pivot-table-header-menu--open": isMenuOpened,
        });
    }

    private renderMenuItemContent(
        totalType: TotalType,
        onClick: () => void,
        isSelected: boolean,
        hasSubMenu = false,
        disabled: boolean,
        tooltipMessage?: string,
    ) {
        const { intl } = this.props;
        const onClickHandler = disabled ? noop : onClick;
        const itemElement = (
            <Item checked={isSelected} subMenu={hasSubMenu} disabled={disabled}>
                <div
                    onClick={onClickHandler}
                    className="gd-aggregation-menu-item-inner s-menu-aggregation-inner"
                >
                    {intl.formatMessage({
                        id: `visualizations.totals.dropdown.title.${totalType}`,
                    })}
                </div>
            </Item>
        );
        return disabled ? (
            <BubbleHoverTrigger showDelay={SHOW_DELAY_DEFAULT} hideDelay={HIDE_DELAY_DEFAULT}>
                {itemElement}
                <Bubble className="bubble-primary" alignPoints={[{ align: "bc tc" }]}>
                    {tooltipMessage}
                </Bubble>
            </BubbleHoverTrigger>
        ) : (
            itemElement
        );
    }

    private getItemClassNames(totalType: TotalType): string {
        return cx("gd-aggregation-menu-item", "s-menu-aggregation", `s-menu-aggregation-${totalType}`);
    }

    private isTableFilteredByMeasureValue(): boolean {
        const definition = this.props.getExecutionDefinition();

        // ignore measure value filters without condition, these are not yet specified by the user and are not sent as part of the execution
        return definition.filters.some(
            (filter) => isMeasureValueFilter(filter) && !!measureValueFilterCondition(filter),
        );
    }

    private isTableFilteredByRankingFilter(): boolean {
        const definition = this.props.getExecutionDefinition();
        return definition.filters.some(isRankingFilter);
    }

    private renderMainMenuItems(
        columnTotals: IColumnTotal[],
        measureLocalIdentifiers: string[],
        rowAttributeDescriptors: IAttributeDescriptor[],
    ) {
        const { intl, onAggregationSelect, showSubmenu } = this.props;
        const firstAttributeIdentifier = attributeDescriptorLocalId(rowAttributeDescriptors[0]);
        const isFilteredByMeasureValue = this.isTableFilteredByMeasureValue();
        const isFilteredByRankingFilter = this.isTableFilteredByRankingFilter();

        return AVAILABLE_TOTALS.map((totalType: TotalType) => {
            const isSelected = menuHelper.isTotalEnabledForAttribute(
                firstAttributeIdentifier,
                totalType,
                columnTotals,
            );
            const attributeDescriptor = rowAttributeDescriptors[0];
            const onClick = () =>
                this.props.onAggregationSelect({
                    type: totalType,
                    measureIdentifiers: measureLocalIdentifiers,
                    include: !isSelected,
                    attributeIdentifier: attributeDescriptor.attributeHeader.localIdentifier,
                });
            const itemClassNames = this.getItemClassNames(totalType);

            const disabled = totalType === "nat" && (isFilteredByMeasureValue || isFilteredByRankingFilter);
            const cause = isFilteredByMeasureValue ? "mvf" : "ranking";
            const tooltipMessage = disabled
                ? intl.formatMessage({ id: `visualizations.totals.dropdown.tooltip.nat.disabled.${cause}` })
                : undefined;

            const renderSubmenu = !disabled && showSubmenu && rowAttributeDescriptors.length > 0;
            const toggler = this.renderMenuItemContent(
                totalType,
                onClick,
                isSelected,
                renderSubmenu,
                disabled,
                tooltipMessage,
            );

            return (
                <div className={itemClassNames} key={totalType}>
                    {renderSubmenu ? (
                        <AggregationsSubMenu
                            intl={intl}
                            totalType={totalType}
                            rowAttributeDescriptors={rowAttributeDescriptors}
                            columnTotals={columnTotals}
                            measureLocalIdentifiers={measureLocalIdentifiers}
                            onAggregationSelect={onAggregationSelect}
                            toggler={toggler}
                        />
                    ) : (
                        toggler
                    )}
                </div>
            );
        });
    }
}
