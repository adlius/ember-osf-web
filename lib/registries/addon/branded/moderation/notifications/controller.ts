import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { alias } from '@ember/object/computed';
import config from 'ember-get-config';
import pathJoin from 'ember-osf-web/utils/path-join';

export default class BrandedModerationNotificationsController extends Controller {
    userSettingsLink: string = pathJoin(config.OSF.url, 'settings', 'notifications');
    @alias('model.id') providerId?: string;

    @computed('providerId')
    get subscriptionIds() {
        return this.providerId
            ? [
                `${this.providerId}_new_pending_withdraw_requests`,
                `${this.providerId}_new_pending_submissions`,
            ]
            : [];
    }
}
