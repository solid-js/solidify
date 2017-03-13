/**
 * Social networks available for sharing
 */
export enum ESocialType
{
	FACEBOOK,
	TWITTER
}

/**
 * Helper for social integrations
 */
export class SocialHelper
{
	/**
	 * Open social share popup
	 * @param pSocialType @see ESocialType
	 * @param pLink page to share. Will share location.origin if null
	 * @param pTwitterText Pre-filled text for twitter.
	 * @param pPopupSize width and height for opened popup
	 */
	static openShare (pSocialType:ESocialType, pLink = window.location.origin, pTwitterText = "", pPopupSize = [600, 500])
	{
		// Create tweet content
		let tweet = encodeURIComponent(pTwitterText + pLink);

		// Le lien de la popup
		let popinHref;
		if (pSocialType == ESocialType.FACEBOOK)
		{
			popinHref = 'https://www.facebook.com/sharer/sharer.php?u=' + pLink;
		}
		else if (pSocialType == ESocialType.TWITTER)
		{
			popinHref = 'https://twitter.com/intent/tweet?text=' + tweet;
		}

		// Center popup
		const width = pPopupSize[0];
		const height = pPopupSize[1];
		const left = (screen.width / 2) - (width / 2);
		const top = (screen.height / 2) - (height / 2);

		// Open popup
		window.open(
			popinHref,
			'share',
			`width=${width},height=${height},top=${top},left=${left}`
		);
	}
}