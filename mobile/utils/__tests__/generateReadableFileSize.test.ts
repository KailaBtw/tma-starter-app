import { describe, it, expect } from '@jest/globals';
import generateReadableFileSize from '../generateReadableFileSize';

describe('PostAttachment', () => {
    describe('generateReadableFileSize to the properly converted and labeled file size', () => {
        it('return 7.000 B for a 7 byte file', () => {
            expect(generateReadableFileSize(7)).toBe('7.000 B');
        });
        it('return 984.980 KB for a 984980 byte file', () => {
            expect(generateReadableFileSize(984980)).toBe('984.980 KB');
        });

        const byteToMB = 1000000;
        const finalMBValue = 2.4;
        it(`return ${finalMBValue.toFixed(3)} MB for a ${finalMBValue * byteToMB} byte file`, () => {
            expect(generateReadableFileSize(finalMBValue * byteToMB)).toBe(
                `${finalMBValue.toFixed(3)} MB`
            );
        });

        const finalMBValueShouldOverflow = 2000;
        it(`return ${finalMBValueShouldOverflow.toFixed(3)} GB for a ${finalMBValueShouldOverflow * byteToMB} byte file`, () => {
            expect(
                generateReadableFileSize(finalMBValueShouldOverflow * byteToMB)
            ).toBe(`${(finalMBValueShouldOverflow / 1000).toFixed(3)} GB`);
        });

        const byteToGB = 1000000000;
        const finalGBValue = 872.2839;
        it(`return ${finalGBValue.toFixed(3)} GB for a ${finalGBValue * byteToGB} byte file`, () => {
            expect(generateReadableFileSize(finalGBValue * byteToGB)).toBe(
                `${finalGBValue.toFixed(3)} GB`
            );
        });

        const byteToTB = 1000000000000;
        const finalTBValue = 1.7;
        it(`return ${finalTBValue.toFixed(3)} TB for a ${finalTBValue * byteToTB} byte file`, () => {
            expect(generateReadableFileSize(finalTBValue * byteToTB)).toBe(
                `${finalTBValue.toFixed(3)} TB`
            );
        });
    });
});
