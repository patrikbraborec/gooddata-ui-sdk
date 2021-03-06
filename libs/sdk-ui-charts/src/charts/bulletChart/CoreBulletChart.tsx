// (C) 2007-2018 GoodData Corporation
import React from "react";
import { BaseChart } from "../_base/BaseChart";
import { ICoreChartProps } from "../../interfaces";

export class CoreBulletChart extends React.PureComponent<ICoreChartProps> {
    public render(): React.ReactNode {
        return <BaseChart type="bullet" {...this.props} />;
    }
}
