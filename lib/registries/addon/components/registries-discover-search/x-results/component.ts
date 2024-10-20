import Component from '@ember/component';
import { action } from '@ember/object';
import { localClassNames } from 'ember-css-modules';

import { layout, requiredAction } from 'ember-osf-web/decorators/component';
import { SearchOptions } from 'registries/services/search';

import template from './template';

@layout(template)
@localClassNames('SearchResults')
export default class SearchResults<T> extends Component {
    static positionalParams = ['results'];

    searchOptions!: SearchOptions;
    @requiredAction onSearchOptionsUpdated!: (options: SearchOptions) => void;

    results!: T[];

    @action
    _onSearchOptionsUpdated(options: SearchOptions) {
        this.onSearchOptionsUpdated(options);
    }
}
