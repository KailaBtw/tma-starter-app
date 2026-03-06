import { getVimeoEmbedUrl } from '../videoHelpers';

describe('getVimeoEmbedUrl', () => {
    test('creates correct embed url', () => {
        expect(getVimeoEmbedUrl('12345')).toBe(
            'https://player.vimeo.com/video/12345'
        );
    });

    test('works with longer ids', () => {
        expect(getVimeoEmbedUrl('76979871')).toBe(
            'https://player.vimeo.com/video/76979871'
        );
    });
});
