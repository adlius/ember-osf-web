import { capitalize } from '@ember/string';
import { Factory, faker, ModelInstance, Server, trait, Trait } from 'ember-cli-mirage';

import Node from 'ember-osf-web/models/node';

import { guid, guidAfterCreate } from './utils';

export interface NodeTraits {
    withContributors: Trait;
    withRegistrations: Trait;
    withDraftRegistrations: Trait;
    withDoi: Trait;
    withLicense: Trait;
}

export default Factory.extend<Node & NodeTraits>({
    id: guid('node'),
    afterCreate: guidAfterCreate,

    category: faker.list.cycle(
        'project',
        'analysis',
        'communication',
        'data',
        'hypothesis',
        'instrumentation',
        'methods and measures',
        'procedure',
        'project',
        'software',
        'other',
    ),
    fork: false,
    currentUserIsContributor: false,
    preprint: false,
    description() {
        return faker.lorem.sentences(faker.random.number({ min: 0, max: 4 }));
    },
    currentUserPermissions: [],
    dateModified() {
        return faker.date.past(2, new Date(2018, 0, 0));
    },
    title() {
        return capitalize(faker.random.arrayElement([
            faker.company.bs,
            faker.company.catchPhrase,
            faker.hacker.noun,
            faker.lorem.word,
        ])());
    },
    collection: false,
    subjects: [],
    registration: false,
    dateCreated() {
        return faker.date.past(1, new Date(2015, 0, 0));
    },
    currentUserCanComment: true,
    nodeLicense: null,
    public: true,
    tags: faker.lorem.words(5).split(' '),

    withContributors: trait({
        afterCreate(node: ModelInstance<Node>, server: Server) {
            const contributorCount = faker.random.number({ min: 1, max: 25 });
            if (contributorCount === 1) {
                server.create('contributor', { node, index: 0, permission: 'admin', bibliographic: true });
            } else if (contributorCount === 2) {
                server.create('contributor', { node, index: 0, permission: 'admin', bibliographic: true });
                server.create('contributor', { node, index: 1 });
            } else {
                for (let i = 0; i < contributorCount; i++) {
                    server.create('contributor', { node, index: i });
                }
            }
        },
    }),

    withRegistrations: trait({
        afterCreate(node: ModelInstance<Node>, server: Server) {
            const registrationCount = faker.random.number({ min: 5, max: 15 });
            for (let i = 0; i < registrationCount; i++) {
                const registration = server.create('registration', {
                    registeredFrom: node,
                    category: node.category,
                    title: node.title,
                    registrationSchema: faker.random.arrayElement(server.schema.registrationSchemas.all().models),
                });
                node.contributors.models.forEach((contributor: any) =>
                    server.create('contributor', { node: registration, users: contributor.users }));
            }
        },
    }),

    withDraftRegistrations: trait({
        afterCreate(node: ModelInstance<Node>, server: Server) {
            const draftRegistrationCount = faker.random.number({ min: 5, max: 15 });
            server.createList('draft-registration', draftRegistrationCount, {
                branchedFrom: node,
                initiator: node.contributors.models[0].users,
                registrationSchema: faker.random.arrayElement(server.schema.registrationSchemas.all().models),
            });
        },
    }),

    withDoi: trait({
        afterCreate(node: ModelInstance<Node>, server: Server) {
            const identifier = server.create('identifier');
            // @ts-ignore until we figure out mirage types that don't pull in ember-data stuff
            node.identifiers = [identifier]; // eslint-disable-line no-param-reassign
            node.save();
        },
    }),

    withLicense: trait({
        afterCreate(node: ModelInstance<Node>, server: Server) {
            const license = faker.random.arrayElement(server.schema.licenses.all().models);
            // @ts-ignore until we figure out mirage types that don't pull in ember-data stuff
            node.license = license; // eslint-disable-line no-param-reassign
            node.save();
        },
    }),
});
