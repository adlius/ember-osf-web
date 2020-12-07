import { render } from '@ember/test-helpers';
import a11yAudit from 'ember-a11y-testing/test-support/audit';
import { hbs } from 'ember-cli-htmlbars';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { TestContext } from 'ember-intl/test-support';
import { OsfLinkRouterStub } from 'ember-osf-web/tests/integration/helpers/osf-link-router-stub';
import { setupRenderingTest } from 'ember-qunit';
import { module, test } from 'qunit';

module('Registries | Integration | Component | registration-list-card', hooks => {
    setupRenderingTest(hooks);
    setupMirage(hooks);

    test('it renders non rejected', async function(this: TestContext, assert) {
        this.store = this.owner.lookup('service:store');
        this.owner.register('service:router', OsfLinkRouterStub);

        const provider = server.create('registration-provider');

        const registration = server.create('registration', {
            title: 'Test title',
            provider,
        }, 'withReviewActions');
        const registrationModel = await this.store.findRecord('registration', registration.id);

        this.set('registration', registrationModel);

        await render(hbs`
            <Registries::RegistrationList::Card
            @registration={{this.registration}}
            @state='pending'
        />`);

        await a11yAudit(this.element);
        assert.dom('[data-test-registration-list-card]').isVisible();
        assert.dom('[data-test-registration-list-card-icon="pending"]').exists();
        assert.dom('[data-test-registration-title-link]').exists();
        assert.dom('[data-test-registration-title-link]').hasText(`${registration.title}`);
    });

    test('it renders rejected', async function(assert) {
        this.store = this.owner.lookup('service:store');
        this.owner.register('service:router', OsfLinkRouterStub);

        const provider = server.create('registration-provider');

        const registration = server.create('registration', {
            title: 'Test title',
            provider,
        }, 'withReviewActions');
        const registrationModel = await this.store.findRecord('registration', registration.id);

        this.set('registration', registrationModel);

        await render(hbs`
            <Registries::RegistrationList::Card
            @registration={{this.registration}}
            @state='rejected'
        />`);

        await a11yAudit(this.element);
        assert.dom('[data-test-registration-list-card]').isVisible();
        assert.dom('[data-test-registration-list-card-icon="rejected"]').exists();
        assert.dom('[data-test-registration-title-link]').doesNotExist();
        assert.dom('[data-test-registration-list-card-title]').hasText(`${registration.title}`);
    });
});
