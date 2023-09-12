import { ModelInstance } from 'ember-cli-mirage';
import config from 'ember-get-config';
import PreprintModel from 'ember-osf-web/models/preprint';
import ApplicationSerializer, { SerializedRelationships } from './application';

const { OSF: { apiUrl } } = config;

export default class PreprintSerializer extends ApplicationSerializer<PreprintModel> {
    buildNormalLinks(model: ModelInstance) {
        return {
            self: `${apiUrl}/v2/${model.id}/`,
            doi: model.doi ?  `https://doi.org/${model.doi}` : null,
            preprint_doi: `https://doi.org/10.31219/osf.io/${model.id}`,
        };
    }

    buildRelationships(model: ModelInstance<PreprintModel>) {
        const relationships: SerializedRelationships<PreprintModel> = {
            provider: {
                links: {
                    related: {
                        href: `${apiUrl}/v2/providers/preprints/${model.provider.id}`,
                        meta: {},
                    },
                },
            },
            contributors: {
                links: {
                    related: {
                        href: `${apiUrl}/v2/preprints/${model.id}/contributors`,
                        meta: this.buildRelatedLinkMeta(model, 'contributors'),
                    },
                },
            },
            bibliographicContributors: {
                links: {
                    related: {
                        href: `${apiUrl}/v2/preprints/${model.id}/bibliographic_contributors/`,
                        meta: this.buildRelatedLinkMeta(model, 'bibliographicContributors'),
                    },
                },
            },
            files: {
                links: {
                    related: {
                        href: `${apiUrl}/v2/preprints/${model.id}/files/`,
                        meta: this.buildRelatedLinkMeta(model, 'files'),
                    },
                },
            },
            primaryFile: {
                links: {
                    related: {
                        href: `${apiUrl}/v2/files/${model.primaryFile.id}/`,
                        meta: this.buildRelatedLinkMeta(model, 'files'),
                    },
                },
            },
            license: {
                links: {
                    related: {
                        href: `${apiUrl}/v2/licenses/${model.license.id}/`,
                        meta: {},
                    },
                },
            },
            subjects: {
                links: {
                    related: {
                        href: `${apiUrl}/v2/preprints/${model.id}/subjects/`,
                        meta: this.buildRelatedLinkMeta(model, 'subjects'),
                    },
                },
            },
            citation: {
                links: {
                    related: {
                        href: `${apiUrl}/v2/preprints/${model.id}/citation/`,
                        meta: {},
                    },
                },
            },
            node: {
                links: {
                    related: {
                        href: `${apiUrl}/v2/nodes/${model.node.id}`,
                        meta: this.buildRelatedLinkMeta(model, 'node'),
                    },
                },
            },
        };

        if (model.license !== null) {
            const { id } = model.license;
            relationships.license = {
                data: {
                    id: id as string,
                    type: 'licenses',
                },
                links: {
                    related: {
                        href: `${apiUrl}/v2/licenses/${id}`,
                        meta: {},
                    },
                },
            };
        }

        /*
        if (model.brand) {
            relationships.brand = {
                links: {
                    related: {
                        href: `${apiUrl}/v2/brands/${model.brand.id}/`,
                        meta: {},
                    },
                },
            };
        }
        */

        return relationships;
    }
}
