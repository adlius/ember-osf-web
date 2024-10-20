import { tracked } from '@glimmer/tracking';
import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import IndexCardModel from 'ember-osf-web/models/index-card';
import { waitFor } from '@ember/test-waiters';
import { taskFor } from 'ember-concurrency-ts';
import { task, timeout } from 'ember-concurrency';
import Intl from 'ember-intl/services/intl';
import { A } from '@ember/array';
import Store from '@ember-data/store';
import { action } from '@ember/object';
import Media from 'ember-responsive';

import { ShareMoreThanTenThousand } from 'ember-osf-web/models/index-card-search';
import SearchResultModel from 'ember-osf-web/models/search-result';
import ProviderModel from 'ember-osf-web/models/provider';
import RelatedPropertyPathModel from 'ember-osf-web/models/related-property-path';
import uniqueId from 'ember-osf-web/utils/unique-id';

import { booleanFilterProperties } from './filter-facet/component';

interface ResourceTypeOption {
    display: string;
    value?: ResourceTypeFilterValue | null;
}

export enum ResourceTypeFilterValue {
    Registrations = 'Registration,RegistrationComponent',
    Projects = 'Project,ProjectComponent',
    Preprints = 'Preprint',
    Users = 'Agent',
    Files = 'File',
}

interface SortOption {
    display: string;
    value: string;
}

export interface Filter {
    propertyVisibleLabel: string;
    propertyShortFormLabel: string; // OSFMAP shorthand label
    value: string;
    label: string;
}

export interface OnSearchParams {
    cardSearchText?: string;
    page?: string;
    sort?: string;
    resourceType?: ResourceTypeFilterValue | null;
}

interface SearchArgs {
    onSearch?: (obj: OnSearchParams) => void;
    cardSearchText: string;
    cardSearchFilters: Filter[];
    propertyCard: IndexCardModel;
    propertySearch: SearchResultModel;
    toggleFilter: (filter: Filter) => void;
    sort: string;
    resourceType?: ResourceTypeFilterValue;
    defaultQueryOptions: Record<string, string>;
    provider?: ProviderModel;
    showResourceTypeFilter: boolean;
    page: string;
}

const searchDebounceTime = 100;

export default class SearchPage extends Component<SearchArgs> {
    @service intl!: Intl;
    @service toast!: Toastr;
    @service store!: Store;
    @service media!: Media;

    @tracked cardSearchText?: string;
    @tracked searchResults?: SearchResultModel[];
    @tracked relatedProperties?: RelatedPropertyPathModel[] = [];
    @tracked page?: string = '';
    @tracked totalResultCount?: string | number;
    @tracked firstPageCursor?: string | null;
    @tracked prevPageCursor?: string | null;
    @tracked nextPageCursor?: string | null;

    @tracked filterQueryObject: Record<string, string> = {};

    constructor( owner: unknown, args: SearchArgs) {
        super(owner, args);
        this.cardSearchText = this.args.cardSearchText;
        this.sort = this.args.sort;
        this.resourceType = this.args.resourceType;
        taskFor(this.search).perform();
    }

    showTooltip1?: boolean;
    showTooltip2?: boolean;
    showTooltip3?: boolean;

    sidePanelToggleId = uniqueId(['side-panel-toggle']);
    leftPanelObjectDropdownId = uniqueId(['left-panel-object-dropdown']);
    firstTopbarObjectTypeLinkId = uniqueId(['first-topbar-object-type-link']);
    searchInputWrapperId = uniqueId(['search-input-wrapper']);
    leftPanelHeaderId = uniqueId(['left-panel-header']);
    firstFilterId = uniqueId(['first-filter']);

    get tooltipTarget1Id() {
        if (this.showSidePanelToggle) {
            return this.sidePanelToggleId;
        }
        if (this.args.showResourceTypeFilter) {
            return this.firstTopbarObjectTypeLinkId;
        }
        return this.searchInputWrapperId;
    }

    get tooltipTarget2Id() {
        if (this.showSidePanelToggle) {
            return this.sidePanelToggleId;
        }
        return this.leftPanelHeaderId;
    }

    get tooltipTarget3Id() {
        if (this.showSidePanelToggle) {
            return this.sidePanelToggleId;
        }
        if (this.relatedProperties) {
            return this.firstFilterId;
        }
        return this.leftPanelHeaderId;
    }

    get showSidePanelToggle() {
        return this.media.isMobile || this.media.isTablet;
    }

    get selectedResourceTypeOption() {
        return this.resourceTypeOptions.find(option => option.value === this.resourceType);
    }

    get showResultCountMiddle() {
        return this.totalResultCount && !this.args.showResourceTypeFilter && !this.showSidePanelToggle;
    }

    get showResultCountLeft() {
        return this.totalResultCount && this.args.showResourceTypeFilter;
    }

    get selectedSortOption() {
        return this.sortOptions.find(option => option.value === this.sort);// || this.sortOptions[0];
    }

    // Resource type
    resourceTypeOptions: ResourceTypeOption[] = [
        {
            display: this.intl.t('search.resource-type.all'),
            value: null,
        },
        {
            display: this.intl.t('search.resource-type.projects'),
            value: ResourceTypeFilterValue.Projects,
        },
        {
            display: this.intl.t('search.resource-type.registrations'),
            value: ResourceTypeFilterValue.Registrations,
        },
        {
            display: this.intl.t('search.resource-type.preprints'),
            value: ResourceTypeFilterValue.Preprints,
        },
        {
            display: this.intl.t('search.resource-type.files'),
            value: ResourceTypeFilterValue.Files,
        },
        {
            display: this.intl.t('search.resource-type.users'),
            value: ResourceTypeFilterValue.Users,
        },
    ];

    // Sort
    sortOptions: SortOption[] = [
        { display: this.intl.t('search.sort.relevance'), value: '-relevance' },
        { display: this.intl.t('search.sort.created-date-descending'), value: '-dateCreated' },
        { display: this.intl.t('search.sort.created-date-ascending'), value: 'dateCreated' },
        { display: this.intl.t('search.sort.modified-date-descending'), value: '-dateModified' },
        { display: this.intl.t('search.sort.modified-date-ascending'), value: 'dateModified' },
    ];

    @tracked resourceType?: ResourceTypeFilterValue | null;
    @tracked sort: string;
    @tracked activeFilters = A<Filter>([]);

    @task({ restartable: true })
    @waitFor
    async search() {
        try {
            const cardSearchText = this.cardSearchText;
            const { page, sort, activeFilters, resourceType } = this;
            let filterQueryObject = activeFilters.reduce((acc, filter) => {
                // boolean filters should look like cardSearchFilter[hasDataResource][is-present]
                if (booleanFilterProperties.includes(filter.propertyShortFormLabel)) {
                    acc[filter.propertyShortFormLabel] = {};
                    acc[filter.propertyShortFormLabel][filter.value] = true;
                    return acc;
                }
                // other filters should look like cardSearchFilter[propertyName]=IRI
                const currentValue = acc[filter.propertyShortFormLabel];
                acc[filter.propertyShortFormLabel] = currentValue ? currentValue.concat(filter.value) : [filter.value];
                return acc;
            }, {} as { [key: string]: any });
            let resourceTypeFilter = this.resourceType as string;
            // If resourceType is null, we want to search all resource types
            if (!resourceTypeFilter) {
                resourceTypeFilter = Object.values(ResourceTypeFilterValue).join(',');
            }
            filterQueryObject['resourceType'] = resourceTypeFilter;
            filterQueryObject = { ...filterQueryObject, ...this.args.defaultQueryOptions };
            this.filterQueryObject = filterQueryObject;
            const searchResult = await this.store.queryRecord('index-card-search', {
                cardSearchText,
                'page[cursor]': page,
                sort,
                cardSearchFilter: filterQueryObject,
                'page[size]': 10,
            });
            await searchResult.relatedProperties;
            this.relatedProperties = searchResult.relatedProperties;
            this.firstPageCursor = searchResult.firstPageCursor;
            this.nextPageCursor = searchResult.nextPageCursor;
            this.prevPageCursor = searchResult.prevPageCursor;
            this.searchResults = searchResult.searchResultPage.toArray();
            this.totalResultCount = searchResult.totalResultCount === ShareMoreThanTenThousand ? '10,000+' :
                searchResult.totalResultCount;
            if (this.args.onSearch) {
                this.args.onSearch({cardSearchText, sort, resourceType});
            }
        } catch (e) {
            this.toast.error(e);
        }
    }

    @action
    switchPage(pageCursor: string) {
        this.page = pageCursor;
        taskFor(this.search).perform();
        document.querySelector('[data-test-topbar-wrapper]')?.scrollIntoView({ behavior: 'smooth' });
    }

    @task({ restartable: true })
    @waitFor
    async doDebounceSearch() {
        await timeout(searchDebounceTime);
        this.page = '';
        taskFor(this.search).perform();
    }

    @action
    toggleFilter(filter: Filter) {
        const filterIndex = this.activeFilters.findIndex(
            f => f.propertyShortFormLabel === filter.propertyShortFormLabel && f.value === filter.value,
        );
        if (filterIndex > -1) {
            this.activeFilters.removeAt(filterIndex);
        } else {
            this.activeFilters.pushObject(filter);
        }
        this.page = '';
        taskFor(this.search).perform();
    }

    @action
    updateSort(sortOption: SortOption) {
        this.sort = sortOption.value;
        this.page = '';
        taskFor(this.search).perform();
    }

    @action
    updateResourceType(resourceTypeOption: ResourceTypeOption) {
        this.resourceType = resourceTypeOption.value;
        this.activeFilters = A<Filter>([]);
        this.page = '';
        taskFor(this.search).perform();
    }
}
