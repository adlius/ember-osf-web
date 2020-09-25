import DS from 'ember-data';
import NodeRequestActionModel from 'ember-osf-web/models/node-request-action';
import RegistrationRequestModel from 'ember-osf-web/models/registration-request';

import RegistrationSchemaModel from 'ember-osf-web/models/registration-schema';
import BrandModel from './brand';
import ModeratorModel from './moderator';
import ProviderModel from './provider';
import RegistrationModel from './registration';

const { attr, hasMany, belongsTo } = DS;

export default class RegistrationProviderModel extends ProviderModel {
    @hasMany('registration', { inverse: 'provider' })
    registrations!: DS.PromiseManyArray<RegistrationModel>;

    @belongsTo('brand')
    brand!: DS.PromiseObject<BrandModel> & BrandModel;

    @hasMany('registration-schema', { inverse: null })
    schemas!: DS.PromiseManyArray<RegistrationSchemaModel> | RegistrationSchemaModel[];

    @hasMany('moderator', { inverse: 'provider' })
    moderators!: DS.PromiseManyArray<ModeratorModel> | ModeratorModel[];

    @hasMany('registration-request', { inverse: null })
    requests!: DS.PromiseManyArray<RegistrationRequestModel> | RegistrationRequestModel[];

    @hasMany('node-request-action', { inverse: 'target' })
    actions!: DS.PromiseManyArray<NodeRequestActionModel> | NodeRequestActionModel[];

    @attr('fixstring')
    shareSourceKey?: string;
}

declare module 'ember-data/types/registries/model' {
    export default interface ModelRegistry {
        'registration-provider': RegistrationProviderModel;
    } // eslint-disable-line semi
}
