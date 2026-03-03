export default function generateReadableFileSize(fileSize: number) {
    // File sizes are in bytes originally, ex. 1024000
    const fileSizeBites = fileSize;

    // bytes to kilobytes
    const fileSizeKB: number = fileSizeBites / 1000;
    if (fileSizeKB < 1) return fileSizeBites.toFixed(3) + ' B';

    const fileSizeMB: number = fileSizeKB / 1000;
    if (fileSizeMB < 1) return fileSizeKB.toFixed(3) + ' KB';

    const fileSizeGB: number = fileSizeMB / 1000;
    if (fileSizeGB < 1) return fileSizeMB.toFixed(3) + ' MB';

    const fileSizeTB: number = fileSizeGB / 1000;
    if (fileSizeTB < 1) return fileSizeGB.toFixed(3) + ' GB';
    return fileSizeTB.toFixed(3) + ' TB';
}
