import Component from '@glimmer/component';
import PreprintModel, { PreprintDataLinksEnum, PreprintPreregLinksEnum } from 'ember-osf-web/models/preprint';
import PreprintProviderModel from 'ember-osf-web/models/preprint-provider';
import Store from '@ember-data/store';
import { inject as service } from '@ember/service';
import RouterService from '@ember/routing/router-service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import Intl from 'ember-intl/services/intl';

export enum PreprintStatusTypeEnum {
    titleAndFile = 'titleAndFile',
    metadata = 'metadata',
    authorAssertions = 'authorAssertions',
    supplements = 'supplements',
    review = 'review',
}

/**
 * The State Machine Args
 */
interface StateMachineArgs {
    provider: PreprintProviderModel;
}

/**
 * The Preprint State Machine
 */
export default class PreprintStateMachine extends Component<StateMachineArgs>{
    @service store!: Store;
    @service router!: RouterService;
    @service intl!: Intl;
    titleAndFieldValidation = false;
    metadataValidation = false;
    authorAssertionValidation = false;
    supplementValidation = false;
    nextButtonIsDisabled = true;

    provider = this.args.provider;
    @tracked preprint: PreprintModel;
    displayAuthorAssertions = true;
    // @tracked statusFlowIndex = 5;
    @tracked statusFlowIndex = 1;

    constructor(owner: unknown, args: StateMachineArgs) {
        super(owner, args);

        this.preprint = this.store.createRecord('preprint', {
            provider: this.provider,
        });
    }

    /**
     * Callback for the action-flow component
     */
    @action
    public async onDelete(): Promise<void> {
        await this.preprint.deleteRecord();
        await this.router.transitionTo('preprints.discover', this.provider.id);
    }

    /**
     * saveOnStep
     *
     * @description Abstracted method to save after each step
     */
    private async saveOnStep(): Promise<void> {
        await this.preprint.save();
        this.statusFlowIndex++;
    }

    /**
     * Callback for the action-flow component
     */
    @action
    public async onSubmit(): Promise<void> {
        await this.router.transitionTo('preprints.detail', this.provider.id, this.preprint.id);
    }

    /**
     * Callback for the action-flow component
     */
    @action
    public async onNext(): Promise<void> {
        this.nextButtonIsDisabled = true;
        if (this.statusFlowIndex === this.getTypeIndex(PreprintStatusTypeEnum.titleAndFile) &&
            this.titleAndFieldValidation
        ) {
            await this.saveOnStep();
            return;
        } else if (this.statusFlowIndex === this.getTypeIndex(PreprintStatusTypeEnum.metadata) &&
            this.metadataValidation
        ) {
            await this.saveOnStep();
            return;
        } else if (this.statusFlowIndex === this.getTypeIndex(PreprintStatusTypeEnum.authorAssertions) &&
            this.authorAssertionValidation
        ) {
            await this.saveOnStep();
            return;
        } else if (this.statusFlowIndex === this.getTypeIndex(PreprintStatusTypeEnum.supplements) &&
            this.supplementValidation
        ) {
            await this.saveOnStep();
            return;
        }
    }

    /**
     * Callback for the action-flow component
     */
    @action
    public validateTitleAndFile(valid: boolean): void {
        this.titleAndFieldValidation = valid;
        this.nextButtonIsDisabled = !valid;
    }

    /**
     * Callback for the action-flow component
     */
    @action
    public validateMetadata(valid: boolean): void {
        this.metadataValidation = valid;
        this.nextButtonIsDisabled = !valid;
    }

    /**
     * Callback for the action-flow component
     */
    @action
    public validateAuthorAssertions(valid: boolean): void {
        if (this.preprint.hasCoi === false) {
            this.preprint.conflictOfInterestStatement = null;
        }
        if (this.preprint.hasDataLinks === PreprintDataLinksEnum.NOT_APPLICABLE) {
            this.preprint.whyNoData = null;
        }
        if (this.preprint.hasPreregLinks === PreprintPreregLinksEnum.NOT_APPLICABLE) {
            this.preprint.whyNoPrereg = null;
        }
        this.authorAssertionValidation = valid;
        this.nextButtonIsDisabled = !valid;
    }

    /**
     * Callback for the action-flow component
     */
    @action
    public validateSupplements(valid: boolean): void {
        this.supplementValidation = valid;
        this.nextButtonIsDisabled = !valid;
    }

    @action
    public onClickStep(type: string): void {
        if (
            type === PreprintStatusTypeEnum.titleAndFile &&
            this.statusFlowIndex > this.getTypeIndex(type)
        ) {
            this.statusFlowIndex = this.getTypeIndex(type);
        } else if (
            type === PreprintStatusTypeEnum.metadata &&
            this.statusFlowIndex > this.getTypeIndex(type)
        ) {
            this.statusFlowIndex = this.getTypeIndex(type);
        } else if (
            type === PreprintStatusTypeEnum.authorAssertions &&
            this.statusFlowIndex > this.getTypeIndex(type) &&
            this.displayAuthorAssertions
        ) {
            this.statusFlowIndex = this.getTypeIndex(type);
        } else if (
            type === PreprintStatusTypeEnum.supplements &&
            this.statusFlowIndex > this.getTypeIndex(type)
        ) {
            this.statusFlowIndex = this.getTypeIndex(type);
        } else if (
            type === PreprintStatusTypeEnum.review &&
            this.statusFlowIndex > this.getTypeIndex(type)
        ) {
            this.statusFlowIndex = this.getTypeIndex(type);
        }
    }

    @action
    public isSelected(type: string): boolean {
        if (
            type === PreprintStatusTypeEnum.titleAndFile &&
            this.getTypeIndex(type) === this.statusFlowIndex
        ) {
            return true;
        } else if (
            type === PreprintStatusTypeEnum.metadata &&
            this.getTypeIndex(type) === this.statusFlowIndex
        ) {
            return true;
        } else if (
            type === PreprintStatusTypeEnum.authorAssertions &&
            this.getTypeIndex(type) === this.statusFlowIndex &&
            this.displayAuthorAssertions
        ) {
            return true;
        } else if (
            type === PreprintStatusTypeEnum.supplements &&
            this.getTypeIndex(type) === this.statusFlowIndex
        ) {
            return true;
        } else if (
            type === PreprintStatusTypeEnum.review &&
            this.getTypeIndex(type) === this.statusFlowIndex
        ) {
            return true;
        } else {
            return false;
        }
    }

    @action
    public getAnalytics(type: string): string {
        return this.intl.t('preprints.submit.data-analytics', {statusType: this.getStatusTitle(type)  } );
    }


    @action
    public isDisabled(type: string): boolean {
        if (
            type === PreprintStatusTypeEnum.titleAndFile &&
            this.getTypeIndex(type) === this.statusFlowIndex
        ) {
            return true;
        } else if (
            type === PreprintStatusTypeEnum.metadata &&
            this.getTypeIndex(type) === this.statusFlowIndex
        ) {
            return true;
        } else if (
            type === PreprintStatusTypeEnum.authorAssertions &&
            this.getTypeIndex(type) === this.statusFlowIndex &&
            this.displayAuthorAssertions
        ) {
            return true;
        } else if (
            type === PreprintStatusTypeEnum.supplements &&
            this.getTypeIndex(type) === this.statusFlowIndex
        ) {
            return true;
        } else if (
            type === PreprintStatusTypeEnum.review &&
            this.getTypeIndex(type) === this.statusFlowIndex
        ) {
            return true;
        } else {
            return false;
        }
    }

    private getTypeIndex(type: string): number {
        if (type === PreprintStatusTypeEnum.titleAndFile) {
            return 1;
        } else if (type === PreprintStatusTypeEnum.metadata) {
            return 2;
        } else if (type === PreprintStatusTypeEnum.authorAssertions) {
            return 3;
        } else if (type === PreprintStatusTypeEnum.supplements &&  this.displayAuthorAssertions) {
            return 4;
        }  else if (type === PreprintStatusTypeEnum.supplements &&  !this.displayAuthorAssertions) {
            return 3;
        } else if (type === PreprintStatusTypeEnum.review &&  this.displayAuthorAssertions) {
            return 5;
        }  else if (type === PreprintStatusTypeEnum.review &&  !this.displayAuthorAssertions) {
            return 4;
        } else {
            return 0;
        }
    }

    @action
    public isFinished(type: string): boolean {
        if (this.displayAuthorAssertions && this.statusFlowIndex > this.getTypeIndex(type)) {
            return true;
        } else if (!this.displayAuthorAssertions && this.statusFlowIndex > this.getTypeIndex(type)) {
            return true;
        } else if (this.statusFlowIndex > this.getTypeIndex(type)) {
            return true;
        } else {
            return false;
        }
    }

    @action
    public getStatusTitle(type: string): string {
        switch (type) {
        case PreprintStatusTypeEnum.titleAndFile:
            return this.intl.t('preprints.submit.status-flow.step-title-and-file');
        case PreprintStatusTypeEnum.metadata:
            return this.intl.t('preprints.submit.status-flow.step-metadata');
        case PreprintStatusTypeEnum.authorAssertions:
            return this.intl.t('preprints.submit.status-flow.step-author-assertions');
        case PreprintStatusTypeEnum.supplements:
            return this.intl.t('preprints.submit.status-flow.step-supplements');
        case PreprintStatusTypeEnum.review:
            return this.intl.t('preprints.submit.status-flow.step-review');
        default:
            return '';
        }
    }

    @action
    public getFaIcon(type: string): string {
        if (this.isSelected(type)) {
            return 'dot-circle';
        } else if (this.isFinished(type)) {
            return 'check-circle';
        } else {
            return 'circle';
        }
    }

    /**
     * shoulddisplayStatusType
     *
     * @description Determines if the status type should be displayed
     *
     * @returns boolean
     */
    public shouldDisplayStatusType(type: string): boolean{
        return type === PreprintStatusTypeEnum.authorAssertions ? this.displayAuthorAssertions : true;
    }

    /**
     * getTitleAndFileType
     *
     * @description Provides the enum type to limit strings in the hbs files
     *
     * @returns strings
     */
    public get getTitleAndFileType(): string {
        return PreprintStatusTypeEnum.titleAndFile;
    }

    /**
     * getMetadataType
     *
     * @description Provides the enum type to limit strings in the hbs files
     *
     * @returns strings
     */
    public get getMetadataType(): string {
        return PreprintStatusTypeEnum.metadata;
    }

    /**
     * getAuthorAssertionsType
     *
     * @description Provides the enum type to limit strings in the hbs files
     *
     * @returns strings
     */
    public get getAuthorAssertionsType(): string {
        return PreprintStatusTypeEnum.authorAssertions;
    }

    /**
     * getSupplementsType
     *
     * @description Provides the enum type to limit strings in the hbs files
     *
     * @returns strings
     */
    public get getSupplementsType(): string {
        return PreprintStatusTypeEnum.supplements;
    }

    /**
     * getReviewType
     *
     * @description Provides the enum type to limit strings in the hbs files
     *
     * @returns strings
     */
    public get getReviewType(): string {
        return PreprintStatusTypeEnum.review;
    }
}
