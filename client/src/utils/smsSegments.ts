const GSM_BASIC =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';

const GSM_EXTENDED = new Set(['^', '{', '}', '\\', '[', '~', ']', '|', '€']);

export const MAX_SMS_BODY_LENGTH = 1600;

export type SmsEncoding = 'GSM-7' | 'UCS-2';

export interface SmsSegmentInfo {
  encoding: SmsEncoding;
  characters: number;
  segments: number;
  remainingInSegment: number;
}

function isGsm7(text: string): boolean {
  for (const char of text) {
    if (GSM_EXTENDED.has(char)) continue;
    if (!GSM_BASIC.includes(char)) return false;
  }
  return true;
}

function gsmLength(text: string): number {
  let length = 0;
  for (const char of text) {
    length += GSM_EXTENDED.has(char) ? 2 : 1;
  }
  return length;
}

export function getSmsSegmentInfo(text: string): SmsSegmentInfo {
  const gsm = isGsm7(text);
  const encoding: SmsEncoding = gsm ? 'GSM-7' : 'UCS-2';
  const characters = gsm ? gsmLength(text) : [...text].length;
  const singleLimit = gsm ? 160 : 70;
  const concatLimit = gsm ? 153 : 67;

  if (characters === 0) {
    return { encoding, characters: 0, segments: 0, remainingInSegment: singleLimit };
  }

  const segments = characters <= singleLimit ? 1 : Math.ceil(characters / concatLimit);
  const capacity = segments === 1 ? singleLimit : segments * concatLimit;
  const remainingInSegment = capacity - characters;

  return { encoding, characters, segments, remainingInSegment };
}
