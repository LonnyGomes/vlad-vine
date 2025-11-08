declare module "emoji-flags" {
  export interface CountryData {
    code: string;
    emoji: string;
    unicode: string;
    name: string;
    title: string;
  }

  export function countryCode(code: string): CountryData;
  export const data: CountryData[];
}
