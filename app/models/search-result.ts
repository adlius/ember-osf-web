import Model, { attr, belongsTo } from '@ember-data/model';
import { inject as service } from '@ember/service';
import { htmlSafe } from '@ember/template';
import IntlService from 'ember-intl/services/intl';
import { languageFromLanguageCode } from 'osf-components/components/file-metadata-manager/component';

import IndexCardModel from './index-card';

const textMatchEvidenceType = 'https://share.osf.io/vocab/2023/trove/TextMatchEvidence';

export interface IriMatchEvidence {
    '@type': [string];
    matchingIri: string;
    osfmapPropertyPath: string[];
}

export interface TextMatchEvidence {
    '@type': [string];
    matchingHighlight: string;
    osfmapPropertyPath: string[];
}

export default class SearchResultModel extends Model {
    @service intl!: IntlService;

    @attr('array') matchEvidence!: Array<IriMatchEvidence | TextMatchEvidence>;
    @attr('number') cardSearchResultCount!: number;

    @belongsTo('index-card', { inverse: null })
    indexCard!: IndexCardModel;

    get resourceMetadata() {
        return this.indexCard.get('resourceMetadata');
    }

    // TODO: double check how matchEvidence works
    get context() {
        if (this.matchEvidence) {
            const matchEvidenceString = this.matchEvidence.reduce(
                (acc, current) => acc.concat(
                    `${current.osfmapPropertyPath[0]}: ${current['@type'][0] === textMatchEvidenceType
                        ? (current as TextMatchEvidence).matchingHighlight
                        : (current as IriMatchEvidence).matchingIri}; `,
                ),
                '',
            );
            return htmlSafe(matchEvidenceString);
        }
        return null;
    }

    get displayTitle() {
        if (this.resourceType === 'user') {
            return this.resourceMetadata['name'][0]['@value'];
        } else if (this.resourceType === 'file') {
            return this.resourceMetadata['fileName'][0]['@value'];
        }
        return this.resourceMetadata['title']?.[0]['@value'];
    }

    get fileTitle() {
        if (this.resourceType === 'file') {
            return this.resourceMetadata.title?.[0]['@value'];
        }
        return null;
    }

    get description() {
        return this.resourceMetadata.description?.[0]?.['@value'];
    }

    get absoluteUrl() {
        return this.resourceMetadata['@id'];
    }

    // returns list of contributors for osf objects
    // returns list of affiliated institutions for osf users
    get affiliatedEntities() {
        if (this.resourceType === 'user') {
            // return something
        } else if (this.resourceMetadata.creator) {
            return this.resourceMetadata.creator?.map((item: any) =>
                ({ name: item.name[0]['@value'], absoluteUrl: item['@id'] }));
        } else if (this.isContainedBy?.[0]?.creator) {
            return this.isContainedBy[0].creator.map((item: any) =>
                ({ name: item.name?.[0]?.['@value'], absoluteUrl: item['@id'] }));
        }
    }

    get dateFields() {
        switch (this.resourceType) {
        case 'user':
            return [];
        case 'registration':
        case 'registration_component':
            return [
                {
                    label: this.intl.t('osf-components.search-result-card.date_registered'),
                    date: this.resourceMetadata.dateCreated?.[0]['@value'],
                },
                {
                    label: this.intl.t('osf-components.search-result-card.date_modified'),
                    date: this.resourceMetadata.dateModified?.[0]['@value'],
                },
            ];
        default:
            return [
                {
                    label: this.intl.t('osf-components.search-result-card.date_created'),
                    date: this.resourceMetadata.dateCreated?.[0]['@value'],
                },
                {
                    label: this.intl.t('osf-components.search-result-card.date_modified'),
                    date: this.resourceMetadata.dateModified?.[0]['@value'],
                },
            ];
        }
    }

    get isPartOf() {
        return this.resourceMetadata.isPartOf;
    }

    get isContainedBy() {
        return this.resourceMetadata.isContainedBy;
    }

    get isPartOfTitleAndUrl() {
        if (this.isPartOf) {
            return {
                title: this.isPartOf[0]?.title?.[0]?.['@value'],
                absoluteUrl: this.isPartOf[0]?.['@id'],
            };
        }
        return null;
    }

    get isContainedByTitleAndUrl() {
        if (this.isContainedBy) {
            return {
                title: this.isContainedBy[0]?.title?.[0]?.['@value'],
                absoluteUrl: this.isContainedBy[0]?.['@id'],
            };
        }
        return null;
    }

    get isPartOfCollection() {
        const isPartOfCollection = this.resourceMetadata.isPartOfCollection;
        if (isPartOfCollection) {
            return {
                title: this.resourceMetadata.isPartOfCollection?.[0]?.title?.[0]?.['@value'],
                absoluteUrl: this.resourceMetadata.isPartOfCollection?.[0]?.['@id'],
            };
        }
        return null;
    }

    get languageFromCode() {
        if (this.resourceMetadata.language) {
            return languageFromLanguageCode(this.resourceMetadata.language[0]['@value']);
        }
        return null;
    }

    get funders() {
        if (this.resourceMetadata.funder) {
            return this.resourceMetadata.funder.map( (item: any) => ({
                name: item.name[0]['@value'],
                identifier: item.identifier?.[0]['@value'],
            }));
        }
        return null;
    }

    get nodeFunders() {
        if (this.resourceMetadata.isContainedBy?.[0]?.funder) {
            return this.resourceMetadata.isContainedBy[0].funder.map( (item: any) => ({
                name: item.name[0]['@value'],
                identifier: item.identifier?.[0]['@value'],
            }));
        }
        return null;
    }

    get provider() {
        if (this.resourceMetadata.publisher) {
            return {
                name: this.resourceMetadata.publisher[0]?.name?.[0]['@value'],
                identifier: this.resourceMetadata.publisher[0]['@id'],
            };
        }
        return null;
    }

    get doi() {
        return this.indexCard.get('resourceIdentifier').filter(id => id.includes('https://doi.org'));
    }

    get license() {
        if (this.resourceMetadata.rights) {
            return {
                name: this.resourceMetadata.rights?.[0]?.name?.[0]?.['@value'],
                identifier: this.resourceMetadata.rights?.[0]?.['@id'],
            };
        }
        return null;
    }

    get nodeLicense() {
        if (this.resourceMetadata.isContainedBy?.[0]?.rights) {
            return {
                name: this.resourceMetadata.isContainedBy[0].rights?.[0]?.name?.[0]?.['@value'],
                identifier: this.resourceMetadata.rights?.[0]?.['@id'] ||
                    this.resourceMetadata.isContainedBy[0].rights[0]?.['@id'],
            };
        }
        return null;
    }

    get resourceType() {
        const types = this.resourceMetadata.resourceType.map( (item: any) => item['@id']);
        if (types.includes('Project')) {
            return 'project';
        } else if (types.includes('Registration')) {
            return 'registration';
        } else if (types.includes('Preprint')) {
            return 'preprint';
        } else if (types.includes('ProjectComponent')) {
            return 'project_component';
        } else if (types.includes('RegistrationComponent')) {
            return 'registration_component';
        } else if (types.includes('Person')) {
            return 'user';
        } else if(types.includes('File')) {
            return 'file';
        }
        return 'unknown';
    }

    get orcids() {
        if (this.resourceMetadata.identifier) {
            const orcids = this.resourceMetadata.identifier.filter(
                (item: any) => item['@value'].includes('http://orcid.org/'),
            );
            return orcids.map( (item: any) => item['@value']);
        }
        return null;
    }

    get resourceNature() {
        return this.resourceMetadata.resourceNature?.[0]?.displayLabel?.[0]?.['@value'];
    }

    get hasDataResource() {
        return this.resourceMetadata.hasDataResource;
    }

    get hasAnalyticCodeResource() {
        return this.resourceMetadata.hasAnalyticCodeResource;
    }

    get hasMaterialsResource() {
        return this.resourceMetadata.hasMaterialsResource;
    }

    get hasPapersResource() {
        return this.resourceMetadata.hasPapersResource;
    }

    get hasSupplementalResource() {
        return this.resourceMetadata.hasSupplementalResource;
    }

    get registrationTemplate() {
        return this.resourceMetadata.conformsTo?.[0]?.title?.[0]?.['@value'];
    }

    get isWithdrawn() {
        return this.resourceMetadata.dateWithdrawn || this.resourceMetadata['https://osf.io/vocab/2022/withdrawal'];
    }
}

declare module 'ember-data/types/registries/model' {
    export default interface ModelRegistry {
        'search-result': SearchResultModel;
    } // eslint-disable-line semi
}
