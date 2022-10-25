import { ModelInstance, Server } from 'ember-cli-mirage';
import CollectionModel from 'ember-osf-web/models/collection';
import { CollectionSubmissionReviewStates } from 'ember-osf-web/models/collection-submission';
import LicenseModel from 'ember-osf-web/models/license';
import faker from 'faker';
import { Permission } from 'ember-osf-web/models/osf-model';
import User from 'ember-osf-web/models/user';

/**
 * ProjectModel
 *
 * @description A simple abstraction to simplify creation of projects in different
 * review states
 */
interface ProjectModel {
    /**
     * The server attribute
     */
    server: Server;
    /**
     * The current user attribute
     */
    currentUser: ModelInstance<User>;
    /**
     * The collection to build the association
     */
    collection: ModelInstance<CollectionModel>;
    /**
     * The single license from the license array
     */
    license: ModelInstance<LicenseModel>;
    /**
     * The project title
     */
    title: string;
}

/**
 * collectionScenario
 *
 * @description Builds a Collection with 3 accepted projects and a project not
 * associated with a collection
 *
 * @param server The injected server
 * @param currentUser The injected current user
 */
export function collectionScenario(server: Server, currentUser: ModelInstance<User>) {
    const licensesAcceptable = server.schema.licenses.all().models;
    const primaryCollection = server.create('collection');
    const nodeToBeAdded = server.create('node', {
        title: 'Node to be added to collection',
        currentUserPermissions: Object.values(Permission),
    });
    server.create('contributor', {
        node: nodeToBeAdded,
        users: currentUser,
        index: 0,
    });
    const nodeAdded = server.create('node', {
        description: 'A random description',
        title: 'Added to collection',
        license: licensesAcceptable[0],
        currentUserPermissions: Object.values(Permission),
    });
    server.create('contributor', {
        node: nodeAdded,
        users: currentUser,
        index: 0,
    });
    server.create('collection-submission', {
        creator: currentUser,
        guid: nodeAdded,
        id: nodeAdded.id,
        collection: primaryCollection,
    });
    server.create('collection-submission', {
        creator: currentUser,
        guid: server.create('node', 'withContributors'),
        collection: primaryCollection,
    });
    server.create('collection-submission', {
        creator: currentUser,
        guid: server.create('node', 'withContributors'),
        collection: primaryCollection,
    });
    server.create('collection-provider', {
        id: 'studyswap',
        primaryCollection,
        licensesAcceptable,
    });
}

/**
 * collectionModerationScenario
 *
 * @description Builds a moderation collection with projects in a variey of review states
 *
 * @param server The injected server
 * @param currentUser The injected current user
 */
export function collectionModerationScenario(server: Server, currentUser: ModelInstance<User>) {
    const licensesAcceptable = server.schema.licenses.all().models;
    const primaryCollection = server.create('collection');

    pendingProject({
        server,
        currentUser,
        collection: primaryCollection,
        license: licensesAcceptable[0],
        title: 'Pending Project Request',
    } as ProjectModel);

    acceptedProject({
        server,
        currentUser,
        collection: primaryCollection,
        license: licensesAcceptable[0],
        title: 'Accepted Project',
    } as ProjectModel);

    server.create('collection-provider', {
        id: 'moderation-collection-example',
        primaryCollection,
        licensesAcceptable,
    });
}

export function collectionAcceptedScenario(server: Server, currentUser: ModelInstance<User>) {
    const licensesAcceptable = server.schema.licenses.all().models;
    const primaryCollection = server.create('collection');
    const nodeToBeAdded = server.create('node', {
        title: 'Accepted Node to be added to collection',
        currentUserPermissions: Object.values(Permission),
    });
    server.create('contributor', {
        node: nodeToBeAdded,
        users: currentUser,
        index: 0,
    });
    const nodeAdded = server.create('node', {
        description: 'An accepted project on the Accepted Collection Example',
        title: 'Accepted Project',
        license: licensesAcceptable[1],
        currentUserPermissions: Object.values(Permission),
    });
    server.create('contributor', {
        node: nodeAdded,
        users: currentUser,
        index: 0,
    });
    server.create('collection-submission', {
        creator: currentUser,
        guid: nodeAdded,
        id: nodeAdded.id,
        collection: primaryCollection,
    });
    server.create('collection-provider', {
        id: 'accepted-collection-example',
        primaryCollection,
        licensesAcceptable,
    });
}

export function collectionRejectedScenario(server: Server, currentUser: ModelInstance<User>) {
    const licensesAcceptable = server.schema.licenses.all().models;
    const primaryCollection = server.create('collection');
    const nodeToBeAdded = server.create('node', {
        title: 'Rejected Node on a collection',
        currentUserPermissions: Object.values(Permission),
    });
    server.create('contributor', {
        node: nodeToBeAdded,
        users: currentUser,
        index: 0,
    });
    const nodeAdded = server.create('node', {
        description: 'A rejected project on the Rejected Collection Example',
        title: 'Rejected Project',
        license: licensesAcceptable[1],
        currentUserPermissions: Object.values(Permission),
    });
    server.create('contributor', {
        node: nodeAdded,
        users: currentUser,
        index: 0,
    });
    server.create('collection-submission', {
        creator: currentUser,
        guid: nodeAdded,
        id: nodeAdded.id,
        reviewsState: CollectionSubmissionReviewStates.Rejected,
        collection: primaryCollection,
    });
    const nodeAccepted = server.create('node', {
        description: 'An acceped project on the Rejected Collection Example',
        title: 'Accepted Project on the Rejected Collection Example',
        license: licensesAcceptable[0],
        currentUserPermissions: Object.values(Permission),
    });
    server.create('contributor', {
        node: nodeAccepted,
        users: currentUser,
        index: 0,
    });
    server.create('collection-submission', {
        creator: currentUser,
        guid: nodeAccepted,
        id: nodeAccepted.id,
        collection: primaryCollection,
    });
    server.create('collection-provider', {
        id: 'rejected-collection-example',
        primaryCollection,
        licensesAcceptable,
    });
}

export function collectionRemovedScenario(server: Server, currentUser: ModelInstance<User>) {
    const licensesAcceptable = server.schema.licenses.all().models;
    const primaryCollection = server.create('collection');
    const nodeToBeAdded = server.create('node', {
        title: 'Removed Node on a collection',
        currentUserPermissions: Object.values(Permission),
    });
    server.create('contributor', {
        node: nodeToBeAdded,
        users: currentUser,
        index: 0,
    });
    const nodeAdded = server.create('node', {
        description: 'A removed project on the Removed Collection Example',
        title: 'Removed Project',
        license: licensesAcceptable[1],
        currentUserPermissions: Object.values(Permission),
    });
    server.create('contributor', {
        node: nodeAdded,
        users: currentUser,
        index: 0,
    });
    server.create('collection-submission', {
        creator: currentUser,
        guid: nodeAdded,
        id: nodeAdded.id,
        reviewsState: CollectionSubmissionReviewStates.Rejected,
        collection: primaryCollection,
    });
    const nodeAccepted = server.create('node', {
        description: 'An acceped project on the Removed Collection Example',
        title: 'Accepted Project on the Removed Collection Example',
        license: licensesAcceptable[0],
        currentUserPermissions: Object.values(Permission),
    });
    server.create('contributor', {
        node: nodeAccepted,
        users: currentUser,
        index: 0,
    });
    server.create('collection-submission', {
        creator: currentUser,
        guid: nodeAccepted,
        id: nodeAccepted.id,
        collection: primaryCollection,
    });
    server.create('collection-provider', {
        id: 'removed-collection-example',
        primaryCollection,
        licensesAcceptable,
    });
}

/**
 * projectBuilder
 *
 * @description Abstracted function to easily build a project in a certain review state
 *
 * @param project The project model
 * @param reviewsState The review state
 */
function projectBuilder(project: ProjectModel, reviewsState: CollectionSubmissionReviewStates) {
    const node = project.server.create('node', {
        description: faker.lorem.sentence(),
        title: project.title,
        license: project.license,
        currentUserPermissions: Object.values(Permission),
    });
    project.server.create('contributor', {
        node,
        users: project.currentUser,
        index: 0,
    });
    project.server.create('collection-submission', {
        creator: project.currentUser,
        guid: node,
        id: node.id,
        reviewsState,
        collection: project.collection,
    });
}

/**
 * pendingProject
 *
 * @description Abstracted function to easily build a pending project
 * @param project The project model
 */
function pendingProject(project: ProjectModel) {
    projectBuilder(project, CollectionSubmissionReviewStates.Pending);
}

/**
 * acceptedProject
 *
 * @description Abstracted function to easily build an accepted project
 * @param project The project model
 */
function acceptedProject(project: ProjectModel) {
    projectBuilder(project, CollectionSubmissionReviewStates.Accepted);
}
