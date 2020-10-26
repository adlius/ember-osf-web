import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { TaskInstance } from 'ember-concurrency';
import Intl from 'ember-intl/services/intl';
import KeenDataviz from 'keen-dataviz';
import moment, { Moment } from 'moment';

import { layout } from 'ember-osf-web/decorators/component';
import Node from 'ember-osf-web/models/node';

import KeenService from 'analytics-page/services/keen';
import template from './template';

export interface ChartSpec {
    titleKey: string;
    keenQueryType: string;
    keenQueryOptions: (node: Node) => any;
    processData?: (data: any, intl: Intl, node: Node) => any;
    fakeData?: () => any;
    configureChart(chart: KeenDataviz, intl: Intl): void;
}

function excludeNonIntegers(d: any) {
    return parseInt(d, 10) === d ? d : null;
}

@layout(template)
export default class AnalyticsChart extends Component {
    @service keen!: KeenService;
    @service intl!: Intl;

    // Required arguments
    nodeTaskInstance!: TaskInstance<Node>;
    startDate!: Moment;
    endDate!: Moment;
    chartsEnabled!: boolean;

    charts: ChartSpec[] = [
        {
            titleKey: 'analytics.uniqueVisits',
            keenQueryType: 'count_unique',
            keenQueryOptions(node: Node) {
                return {
                    event_collection: `pageviews-${node.id.charAt(0)}`,
                    interval: 'daily',
                    target_property: 'anon.id',
                };
            },
            configureChart(chart: KeenDataviz, intl: Intl) {
                chart.type('line')
                    .dateFormat('%b %d')
                    .chartOptions({
                        point: {
                            sensitivity: 15,
                        },
                        tooltip: {
                            format: {
                                title: (x: Date) => x.toDateString(),
                                name: () => intl.t('analytics.visits'),
                            },
                        },
                        axis: {
                            y: {
                                tick: {
                                    format: excludeNonIntegers,
                                },
                            },
                        },
                    });
            },
            fakeData() {
                const data = [];
                for (let i = 10; i; i--) {
                    data.push({
                        value: Math.floor(Math.random() * 1000),
                        timeframe: {
                            start: moment().subtract(i, 'days').format(),
                            end: moment().subtract(i - 1, 'days').format(),
                        },
                    });
                }
                return {
                    result: data,
                };
            },
        },
        {
            titleKey: 'analytics.visitTimes',
            keenQueryType: 'count_unique',
            keenQueryOptions(node: Node) {
                return {
                    event_collection: `pageviews-${node.id.charAt(0)}`,
                    target_property: 'anon.id',
                    group_by: 'time.local.hour_of_day',
                };
            },
            configureChart(chart: KeenDataviz, intl: Intl) {
                chart.type('bar')
                    .chartOptions({
                        tooltip: {
                            format: {
                                name: () => intl.t('analytics.visits'),
                            },
                        },
                        axis: {
                            x: {
                                label: {
                                    text: intl.t('analytics.hourOfDay'),
                                    position: 'outer-center',
                                },
                                tick: {
                                    centered: true,
                                    multiline: false,
                                    values: [0, 4, 8, 12, 16, 20],
                                },
                            },
                            y: {
                                tick: {
                                    format: excludeNonIntegers,
                                },
                            },
                        },
                    });
            },
            processData(data: any) {
                interface VisitTimeResult {
                    result: number;
                    ['time.local.hour_of_day']: number;
                }

                interface ResultMap {
                    [k: number]: VisitTimeResult;
                }

                // Fill in the missing hours
                const resultMap: ResultMap = {};
                data.result.forEach((r: VisitTimeResult) => {
                    resultMap[r['time.local.hour_of_day']] = r;
                });
                const newResult = [...Array(24).keys()].map(
                    (k: number) => (resultMap[k] || {
                        result: 0,
                        'time.local.hour_of_day': k,
                    }),
                );
                return {
                    ...data,
                    result: newResult,
                };
            },
            fakeData() {
                const data = [...Array(24).keys()].map(
                    (k: number) => ({
                        result: Math.floor(Math.random() * 1000),
                        x: k,
                    }),
                );
                return {
                    result: data,
                };
            },
        },
        {
            titleKey: 'analytics.topReferrers',
            keenQueryType: 'count_unique',
            keenQueryOptions(node: Node) {
                return {
                    event_collection: `pageviews-${node.id.charAt(0)}`,
                    target_property: 'anon.id',
                    group_by: 'referrer.info.domain',
                    order_by: [{ property_name: 'result', direction: 'DESC' }],
                    limit: 10,
                };
            },
            configureChart(chart: KeenDataviz, intl: Intl) {
                chart.type('pie')
                    .chartOptions({
                        tooltip: {
                            format: {
                                name: () => intl.t('analytics.visits'),
                            },
                        },
                    });
            },
            processData(data: any, intl: Intl) {
                for (const result of data.result) {
                    if (result['referrer.info.domain'] === null) {
                        result['referrer.info.domain'] = intl.t('analytics.directLink');
                    }
                }
                return data;
            },
            fakeData() {
                const data = [];
                for (let i = 5; i; i--) {
                    data.push({
                        result: Math.floor(Math.random() * 1000),
                        label: ' '.repeat(i),
                    });
                }
                return {
                    result: data.sortBy('result').reverse(),
                };
            },
        },
        {
            titleKey: 'analytics.popularPages',
            keenQueryType: 'count',
            keenQueryOptions(node: Node) {
                return {
                    event_collection: `pageviews-${node.id.charAt(0)}`,
                    target_property: 'anon.id',
                    group_by: ['page.info.path', 'page.title'],
                    filters: [{
                        property_name: 'page.info.path',
                        operator: 'not_contains',
                        property_value: '/project/',
                    }],
                };
            },
            configureChart(chart: KeenDataviz, intl: Intl) {
                chart.type('horizontal-bar')
                    .chartOptions({
                        tooltip: {
                            format: {
                                name: () => intl.t('analytics.visits'),
                            },
                        },
                        axis: {
                            x: {
                                tick: {
                                    multilineMax: 3,
                                },
                            },
                            y: {
                                tick: {
                                    format: excludeNonIntegers,
                                },
                            },
                        },
                    });
            },
            processData(data: any, intl: Intl, node: Node) {
                interface PopularPageResult {
                    'page.info.path': string;
                    'page.title': string;
                    result: number;
                }

                const aggregatedResults: { [path: string]: PopularPageResult } = {};

                data.result.forEach((result: PopularPageResult) => {
                    const path = result['page.info.path'];
                    const [, guid, subPath] = path.split('/');

                    // if path begins with our node id: it's a project page.  Lookup the title using
                    // the second part of the path. All wiki pages are consolidated under 'Wiki'.
                    // If path begins with a guid-ish that is not the current node id, assume it's a
                    // file and use the title provided.
                    let pageTitle;
                    let pagePath;
                    if (guid === node.id) {
                        if (subPath && subPath.length) {
                            pageTitle = intl.t(`analytics.popularPageNames.${subPath}`);
                        } else {
                            pageTitle = intl.t('analytics.popularPageNames.home');
                        }
                        pagePath = `/${guid}/${subPath || ''}`;
                    } else if (/^\/[a-z0-9]{5}\/$/.test(path)) {
                        pageTitle = intl.t('analytics.popularPageNames.fileDetail', {
                            fileName: result['page.title'].replace(/^OSF \| /, ''),
                        });
                        pagePath = path;
                    } else {
                        // Didn't recognize the path, exclude the entry from the popular pages list.
                        return;
                    }

                    if (!aggregatedResults[pagePath]) {
                        aggregatedResults[pagePath] = {
                            'page.info.path': pagePath,
                            'page.title': pageTitle,
                            result: 0,
                        };
                    }
                    aggregatedResults[pagePath].result += result.result;
                });

                return {
                    result: Object.values(aggregatedResults).sortBy('result').reverse().slice(0, 10),
                };
            },
            fakeData() {
                const data = [];
                for (let i = 10; i; i--) {
                    data.push({
                        result: Math.floor(Math.random() * 1000),
                        label: ' '.repeat(i),
                    });
                }
                return {
                    result: data.sortBy('result').reverse(),
                };
            },
        },
    ];
}
