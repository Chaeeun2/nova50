const FOOTER_COMPANY_NAME = 'Nova 50 Co., Ltd'

export const defaultFooterContactFields = {
  phone: '02-6949-0550',
  addressEn: '805, 8F, Private Tower 1, 165, Magokjungang-ro, Gangseo-gu, Seoul, 07788',
}

export function buildFooterContactText({ phone = '', addressEn = '' } = {}) {
  const resolvedPhone = phone.trim() || defaultFooterContactFields.phone
  const resolvedAddress = addressEn.trim() || defaultFooterContactFields.addressEn

  return {
    pc: `${FOOTER_COMPANY_NAME} ㅣ ${resolvedPhone} ㅣ ${resolvedAddress}`,
    mo: `${FOOTER_COMPANY_NAME} ㅣ ${resolvedPhone}\n${resolvedAddress}`,
  }
}
