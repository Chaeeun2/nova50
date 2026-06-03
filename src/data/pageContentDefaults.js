import { ABOUT_SECTION_EYEBROWS } from './aboutSectionEyebrows'

export function createEmptyAboutContent() {
  return {
    identity: {
      eyebrow: ABOUT_SECTION_EYEBROWS.identity,
      title: { pc: '', mo: '' },
      introTitle: { pc: '', mo: '' },
      copy: { pc: '', mo: '' },
    },
    coreValues: [],
    services: [],
    organization: {
      eyebrow: ABOUT_SECTION_EYEBROWS.organization,
      items: [],
    },
    members: [],
    memberSection: {
      eyebrow: ABOUT_SECTION_EYEBROWS.members,
    },
  }
}

export function createEmptyCareerContent() {
  return {
    hero: {
      eyebrow: '',
      title: '',
      copy: '',
    },
    work: [],
    welfare: [],
    cta: {
      title: { pc: '', mo: '' },
      copy: { pc: '', mo: '' },
      notes: '',
      openings: [],
    },
  }
}

export function createEmptyContactContent() {
  return {
    copy: {
      lead: { pc: '', mo: '' },
      follow: { pc: '', mo: '' },
    },
    address: {
      ko: '',
      en: '',
    },
    phone: '',
    email: '',
  }
}
