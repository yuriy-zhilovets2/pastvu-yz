import _ from 'lodash';
import constants from './constants';
import ApplicationError from './Application';

export default class NotFoundError extends ApplicationError {

    constructor(data = {}, rid) {
        if (typeof data === 'string') {
            data = { code: data };
        }

        _.defaults(data, {
            code: constants.NO_SUCH_RESOURCE
        });

        super(data, rid);
    }

}

NotFoundError.prototype.name = 'NotFoundError';