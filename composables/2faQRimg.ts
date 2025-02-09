import QRCode from 'qrcode';
import base32 from "hi-base32";


const UrlFormmater = (name: string, acc: string, key: string) => {
    return "otpauth://totp/" + encodeURIComponent(acc) + "?issuer=" + encodeURIComponent(name) + "&secret=" + base32.encode(key);
};

const genGoogleQr = async (name: string, acc: string, key: string, opt: QRCode.QRCodeToDataURLOptions = {}) => {
    const data = UrlFormmater(name, acc, key);
    return QRCode.toDataURL(data, opt);
};

export const twoFAQRGenerator = {genQR:genGoogleQr,UrlFormmat:UrlFormmater}