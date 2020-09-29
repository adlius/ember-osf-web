import Component from '@ember/component';
import { action, computed } from '@ember/object';

export default class RegistrationListManager extends Component {
    reloadRegistrationsList!: () => void;
    filterState!: string;

    sort: string = 'date_registered';

    @computed('filterState', 'sort')
    get filterParams() {
        const query: Record<string, string | Record<string, string>> = {
            filter: { machine_state: this.filterState || 'pending' },
            sort: this.sort,
        };

        return query;
    }

    @action
    sortRegistrationsBy(sort: string) {
        this.set('sort', sort);
    }
}