import _ from 'lodash';
import constants from './constants';
import ApplicationError from './Application';

/**
 * Error for notifying user to do something
 * By default stack will not be printed (trace: false)
 */
export default class NoticeError extends ApplicationError {

    constructor(data = {}) {
        if (typeof data === 'string') {
            data = { code: data };
        }

        _.defaults(data, {
            code: constants.NOTICE,
            trace: false
        });

        super(data);
    }

}

NoticeError.prototype.name = 'NoticeError';