// Ukrposhta's published standard-parcel tariff for 1 kg: per-parcel rate plus one kg, in USD.
export const SHIPPING_RATES_USD: Record<string, number> = {
  AD: 35.5, AE: 13, AG: 16.5, AI: 37.5, AL: 20.5, AM: 20.5, AO: 21,
  AQ: 34.26, AR: 28, AS: 36, AT: 19, AU: 26, AW: 25.5, AZ: 17.5,
  BA: 18.5, BB: 17, BD: 19, BE: 24.5, BG: 14.5, BH: 16, BJ: 18, BM: 22.5,
  BN: 21.5, BO: 26.5,   BQ: 19.5, BR: 28, BT: 24, BW: 26.5,
  BZ: 22, CA: 18,   CC: 34.26, CD: 30.5, CF: 30, CG: 25.5, CH: 16.5, CI: 22,
  CK: 37, CL: 29.5, CM: 34.26, CN: 18, CO: 26.5, CR: 27.5, CU: 25.5,
  CV: 23, CW: 21.5, CX: 34.26, CY: 18.5, CZ: 10.5, DE: 8.5,
  DK: 19.5, DM: 44.5, DO: 15.5, DZ: 22, EC: 24.5, EE: 11.5, EG: 19, EH: 20.13,
  ER: 26, ES: 19.5, ET: 19, FI: 24.5, FJ: 23, FK: 27, FM: 34.26,
  FO: 35.5, FR: 22, GA: 19.5, GB: 26.5, GD: 18, GE: 23.5, GF: 29.5,
  GH: 25.5, GI: 26, GL: 22.79, GM: 20.5, GP: 24.5, GR: 16.5,
  GT: 19.5, GU: 36, GW: 31.5, HK: 23.5, HN: 21.5, HR: 13.5,
  HU: 20, ID: 22, IE: 10, IL: 16.5, IN: 21, IO: 36, IQ: 15, IS: 24.5,
  IT: 17.5, JE: 20, JM: 24, JO: 15, JP: 27.5, KE: 17, KG: 15, KH: 20.5,
  KN: 17.5, KR: 18.5, KW: 14.5, KY: 22, KZ: 30.5,
  LA: 23, LB: 17.5, LC: 16.5, LI: 29.5, LK: 16, LR: 18, LS: 28, LT: 7.5,
  LU: 18.5, LV: 10, LY: 27.5, MA: 19.5, MC: 35.5, MD: 16.5, ME: 20,
  MG: 26, MH: 34.26, MK: 17, ML: 23.5, MM: 24, MN: 29, MO: 27.5,
  MP: 36, MQ: 29, MR: 31.5, MT: 33.5, MU: 18, MV: 16, MW: 21.5,
  MX: 19.5, MY: 18.5, MZ: 24, NA: 20.5, NC: 36.5, NF: 34.26, NG: 22,
  NI: 21.5, NL: 16.5, NO: 23.5, NP: 22.5, NR: 25, NU: 35.5, NZ: 33,
  OM: 17, PA: 26.5, PE: 23, PF: 31, PG: 46, PH: 14, PK: 18.5, PL: 15.5,
  PM: 31.9, PN: 39, PR: 36, PT: 19.5, PW: 36, PY: 23, QA: 15.5,
  RE: 26.5, RO: 25, RS: 18.5, RW: 21, SA: 14.5, SB: 20, SC: 16.5,
  SE: 26, SG: 17.5, SH: 25, SI: 15, SK: 13, SL: 20, SM: 20.67,
  SN: 21.5, SR: 18.5, ST: 34.26, SV: 21, SX: 23.5,
  TC: 24, TD: 21, TG: 21.5, TH: 16, TJ: 19.5, TK: 34.26,
  TL: 25, TM: 14.5, TN: 26, TO: 26.5, TR: 26.5, TT: 22,
  TW: 20, TZ: 19.5, UG: 17.5, US: 18, UY: 29, UZ: 29.5, VA: 27.5, VC: 40.5,
  VE: 22.5, VG: 24, VI: 36, VN: 15.5, VU: 26, WF: 29.5, WS: 27.5,
  YT: 34.26, ZA: 35.5, ZM: 18, ZW: 23.5
};

// Preserve the store's existing flat estimate for delivery within Ukraine.
export const UKRAINE_SHIPPING_RATE_USD = 3;
export const FREE_SHIPPING_THRESHOLD_USD = 5000;

export const SHIPPING_COUNTRY_CODES = Object.keys(SHIPPING_RATES_USD);
