// (C) 2007-2018 GoodData Corporation
import { IAttributeOrMeasure, IAttribute, IFilter, newBucket, ISortItem } from "@gooddata/sdk-model";
import { BucketNames } from "@gooddata/sdk-ui";
import { roundChartDimensions } from "../_commons/dimensions";
import { IBucketChartProps } from "../../interfaces";
import { CoreFunnelChart } from "./CoreFunnelChart";
import { IChartDefinition } from "../_commons/chartDefinition";
import { withChart } from "../_base/withChart";

//
// Internals
//

const funnelChartDefinition: IChartDefinition<IFunnelChartBucketProps, IFunnelChartProps> = {
    bucketPropsKeys: ["measures", "viewBy", "filters", "sortBy"],
    bucketsFactory: props => {
        return [
            newBucket(BucketNames.MEASURES, ...props.measures),
            newBucket(BucketNames.VIEW, props.viewBy),
        ];
    },
    executionFactory: (props, buckets) => {
        const { backend, workspace } = props;

        return backend
            .withTelemetry("FunnelChart", props)
            .workspace(workspace)
            .execution()
            .forBuckets(buckets, props.filters)
            .withDimensions(roundChartDimensions);
    },
};

//
// Public interface
//

/**
 * TODO: SDK8: add docs
 *
 * @public
 */
export interface IFunnelChartBucketProps {
    measures: IAttributeOrMeasure[];
    viewBy?: IAttribute;
    filters?: IFilter[];
    sortBy?: ISortItem[];
}

/**
 * TODO: SDK8: add docs
 *
 * @public
 */
export interface IFunnelChartProps extends IBucketChartProps, IFunnelChartBucketProps {}

/**
 *
 * @public
 */
export const FunnelChart = withChart(funnelChartDefinition)(CoreFunnelChart);
