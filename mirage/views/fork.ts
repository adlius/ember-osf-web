import { HandlerContext, ModelInstance, Schema } from 'ember-cli-mirage';

import Node from 'ember-osf-web/models/node';
import Registration from 'ember-osf-web/models/registration';

export function createFork(this: HandlerContext, schema: Schema) {
    const attrs = this.normalizedRequestAttrs('node');
    const nodeId = attrs.id;
    delete attrs.id;
    const node = schema.nodes.find(nodeId) as ModelInstance<Node>;
    const fork = schema.nodes.create({
        forkedFrom: node,
        category: node.category,
        fork: true,
        title: `Fork of ${node.title}`,
        description: node.description,
        ...attrs,
    });

    const userId = schema.roots.first().currentUserId;
    const currentUser = schema.users.find(userId);
    node.contributors.models.forEach(contributor => {
        schema.contributors.create({ node: fork, users: contributor.users });
    });
    schema.contributors.create({ node: fork, users: currentUser, index: 0 });

    return fork;
}

export function createRegistrationFork(this: HandlerContext, schema: Schema) {
    const attrs = this.normalizedRequestAttrs('node');
    const registrationId = attrs.id;
    delete attrs.id;
    const registration = schema.nodes.find(registrationId) as ModelInstance<Registration>;
    const fork = schema.registrations.create({
        forkedFrom: registration,
        category: registration.category,
        fork: true,
        title: `Fork of ${registration.title}`,
        description: registration.description,
        ...attrs,
    });

    const userId = schema.roots.first().currentUserId;
    const currentUser = schema.users.find(userId);
    registration.contributors.models.forEach(contributor => {
        schema.contributors.create({ node: fork, users: contributor.users });
    });
    schema.contributors.create({ node: fork, users: currentUser, index: 0 });

    return fork;
}
