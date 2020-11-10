import Component from '@glimmer/component';

import RegistrationModel, { RegistrationReviewStates } from 'ember-osf-web/models/registration';

const iconMap: Partial<Record<RegistrationReviewStates, string>> = {
    // This is a subset of RegistrationReviewStates that only applies to moderation
    [RegistrationReviewStates.Pending]: 'hourglass',
    [RegistrationReviewStates.Withdrawn]: 'ban',
    [RegistrationReviewStates.Accepted]: 'check',
    [RegistrationReviewStates.Rejected]: 'times',
    [RegistrationReviewStates.PendingWithdraw]: 'clock-o',
    [RegistrationReviewStates.Embargo]: 'lock',
};

interface Args {
    registration: RegistrationModel;
    filterState: RegistrationReviewStates;
}

export default class RegistrationListCard extends Component<Args> {
    get icon(): string {
        const { filterState } = this.args;
        return iconMap[filterState] || '';
    }
}
