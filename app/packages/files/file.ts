import { tracked } from '@glimmer/tracking';
import { waitFor } from '@ember/test-waiters';
import { task } from 'ember-concurrency';

import FileModel from 'ember-osf-web/models/file';
import NodeModel from 'ember-osf-web/models/node';
import { Permission } from 'ember-osf-web/models/osf-model';

export enum FileSortKey {
    AscDateModified = 'modified',
    DescDateModified = '-modified',
    AscName = 'name',
    DescName = '-name',
}

// Waterbutler file version
export interface WaterButlerRevision {
    id: string;
    type: 'file_versions';
    attributes: {
        extra: {
            downloads: number,
            hashes: {
                md5: string,
                sha256: string,
            },
            user: {
                name: string,
                url: string,
            },
        },
        version: number,
        modified: Date,
        modified_utc: Date,
        versionIdentifier: 'version',
    };
}

export default abstract class File {
    @tracked fileModel: FileModel;
    @tracked totalFileCount = 0;
    @tracked waterButlerRevisions?: WaterButlerRevision[];

    constructor(fileModel: FileModel) {
        this.fileModel = fileModel;
    }

    get isFile() {
        return this.fileModel.isFile;
    }

    get isFolder() {
        return this.fileModel.isFolder;
    }

    get currentUserPermission() {
        return 'read';
    }

    get name() {
        return this.fileModel.name;
    }

    get id() {
        return this.fileModel.id;
    }

    get links() {
        const links = this.fileModel.links;
        if (this.isFolder) {
            const uploadLink = new URL(links.upload as string);
            uploadLink.searchParams.set('zip', '');

            links.download = uploadLink.toString();
        }
        return links;
    }

    get userCanEditMetadata() {
        return this.fileModel.target.get('currentUserPermissions').includes(Permission.Write);
    }

    get dateModified() {
        return this.fileModel.dateModified;
    }

    async createFolder(newFolderName: string) {
        if (this.fileModel.isFolder) {
            await this.fileModel.createFolder(newFolderName);
        }
    }

    async getFolderItems(page: number, sort: FileSortKey, filter: string ) {
        if (this.fileModel.isFolder) {
            const queryResult = await this.fileModel.queryHasMany('files',
                {
                    page,
                    sort,
                    'filter[name]': filter,
                });
            this.totalFileCount = queryResult.meta.total;
            return queryResult.map(fileModel => Reflect.construct(this.constructor, [fileModel]));
        }
        return [];
    }

    async updateContents(data: string) {
        await this.fileModel.updateContents(data);
    }

    async rename(newName: string, conflict = 'replace') {
        await this.fileModel.rename(newName, conflict);
    }

    async move(node: NodeModel) {
        await this.fileModel.move(node);
    }

    async delete() {
        await this.fileModel.delete();
    }

    @task
    @waitFor
    async getRevisions() {
        const revisionsLink = new URL(this.links.upload as string);
        revisionsLink.searchParams.set('revisions', '');

        const responseObject = await fetch(revisionsLink.toString());
        const parsedResponse = await responseObject.json();
        this.waterButlerRevisions = parsedResponse.data;
        return this.waterButlerRevisions;
    }
}
