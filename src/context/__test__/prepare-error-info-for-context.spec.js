import withDomOverwrites from 'with-dom-overwrites';
import { prepareErrorInfoForContext } from '../prepare-error-info-for-context';

const referrer = 'foo-referrer';
const errorStatus = '503';
const errorReason = 'foo';

describe('prepareErrorInfoForContext()', () => {
	it('should prepare the error info that should be added to the context', () => {
		const url = createErrorUrl(errorStatus);

		withDomOverwrites({
			overwrites: {
				'document.referrer': referrer,
				'document.location.href': url
			},
			run: () => {
				const info = prepareErrorInfoForContext();
				expect(info).toEqual({
					url,
					referrer,
					errorStatus
				});
			}
		});
	});

	it('should add the error reason to the error info if it exists', () => {
		const url = createErrorUrl(errorStatus, errorReason);

		withDomOverwrites({
			overwrites: {
				'document.referrer': referrer,
				'document.location.href': url
			},
			run: () => {
				const info = prepareErrorInfoForContext();
				expect(info).toEqual({
					url,
					referrer,
					errorStatus,
					errorReason
				});
			}
		});
	});
});

function createErrorUrl (errorStatus, errorReason) {
	let url = `http://errors-next.ft.com/errors/page/${errorStatus}?anonymous=true&edition=uk&nextErrorStatus=${errorStatus}`;

	if (errorReason) {
		url += `&nextErrorReason=${errorReason}`;
	}

	return url;
}
