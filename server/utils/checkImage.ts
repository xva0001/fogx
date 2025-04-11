import sharp from "sharp"

export async function isValidImage(base64String:string) {
    try {
        const buffer = Buffer.from(base64String.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        await sharp(buffer).metadata();
        return true;
    } catch (e) {
        return false;
    }
}
