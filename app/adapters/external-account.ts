import OsfAdapter from './osf-adapter';

export default class ExternalAccountAdapter extends OsfAdapter {
}

declare module 'ember-data/types/registries/adapter' {
    export default interface AdapterRegistry {
        'external-account': ExternalAccountAdapter;
    } // eslint-disable-line semi
}
