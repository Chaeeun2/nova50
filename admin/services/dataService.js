import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

function assertDbConfigured() {
  if (!db) {
    throw new Error('Firestore 설정이 필요합니다.')
  }
}

function mapSnapshot(querySnapshot) {
  return querySnapshot.docs.map((document) => ({
    ...document.data(),
    id: document.id,
  }))
}

function removeUndefined(value) {
  if (Array.isArray(value)) {
    return value.map((item) => removeUndefined(item))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, itemValue]) => itemValue !== undefined)
        .map(([key, itemValue]) => [key, removeUndefined(itemValue)]),
    )
  }

  return value
}

export const mainImageService = {
  async getMainImages() {
    assertDbConfigured()

    const mainImagesQuery = query(collection(db, 'mainImages'), orderBy('createdAt', 'desc'))
    return mapSnapshot(await getDocs(mainImagesQuery))
  },

  async getMainImagesByType(type) {
    assertDbConfigured()

    const mainImagesQuery = query(
      collection(db, 'mainImages'),
      where('type', '==', type),
      orderBy('createdAt', 'desc'),
    )
    return mapSnapshot(await getDocs(mainImagesQuery))
  },

  async addMainImage(imageData) {
    assertDbConfigured()

    const docRef = await addDoc(collection(db, 'mainImages'), {
      ...imageData,
      order: imageData.order ?? 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return docRef.id
  },

  async updateMainImage(id, imageData) {
    assertDbConfigured()

    await updateDoc(doc(db, 'mainImages', id), {
      ...imageData,
      updatedAt: serverTimestamp(),
    })
  },

  async deleteMainImage(id) {
    assertDbConfigured()
    await deleteDoc(doc(db, 'mainImages', id))
  },
}

export const mainPageContentService = {
  async getMainPageContent() {
    assertDbConfigured()

    const docSnap = await getDoc(doc(db, 'pages', 'main'))
    return docSnap.exists() ? docSnap.data() : null
  },

  async saveMainPageContent(contentData) {
    assertDbConfigured()

    await setDoc(
      doc(db, 'pages', 'main'),
      {
        ...removeUndefined(contentData),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  },
}

export const pageContentService = {
  async getPageContent(pageId) {
    assertDbConfigured()

    const docSnap = await getDoc(doc(db, 'pages', pageId))
    return docSnap.exists() ? docSnap.data() : null
  },

  async savePageContent(pageId, contentData) {
    assertDbConfigured()

    await setDoc(
      doc(db, 'pages', pageId),
      {
        ...removeUndefined(contentData),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  },
}

function sortByOrder(items) {
  return [...items].sort((itemA, itemB) => {
    if (typeof itemA.order === 'number' && typeof itemB.order === 'number') {
      return itemA.order - itemB.order
    }

    return (itemA.createdAt?.seconds || 0) - (itemB.createdAt?.seconds || 0)
  })
}

export const worksService = {
  async getWorks() {
    assertDbConfigured()

    const querySnapshot = await getDocs(collection(db, 'works'))
    return sortByOrder(mapSnapshot(querySnapshot))
  },

  async addWork(workData) {
    assertDbConfigured()

    const { id: _legacyId, ...payload } = workData

    const docRef = await addDoc(collection(db, 'works'), {
      ...removeUndefined(payload),
      order: workData.order ?? 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return docRef.id
  },

  async updateWork(id, workData) {
    assertDbConfigured()

    const { id: _legacyId, ...payload } = workData

    await updateDoc(doc(db, 'works', id), {
      ...removeUndefined(payload),
      updatedAt: serverTimestamp(),
    })
  },

  async deleteWork(id) {
    assertDbConfigured()
    await deleteDoc(doc(db, 'works', id))
  },

  async updateWorkOrder(works) {
    assertDbConfigured()

    await Promise.all(
      works.map((work, index) => updateDoc(doc(db, 'works', work.id), { order: index, updatedAt: serverTimestamp() })),
    )
  },
}

export const contactInquiryService = {
  async getInquiries() {
    assertDbConfigured()

    const inquiriesQuery = query(collection(db, 'contactInquiries'), orderBy('createdAt', 'desc'))
    return mapSnapshot(await getDocs(inquiriesQuery))
  },

  async deleteInquiry(id) {
    assertDbConfigured()
    await deleteDoc(doc(db, 'contactInquiries', id))
  },
}

export const partnerLogoService = {
  async getPartnerLogos() {
    assertDbConfigured()

    const querySnapshot = await getDocs(collection(db, 'partnerLogos'))
    return mapSnapshot(querySnapshot).sort((logoA, logoB) => {
      if (typeof logoA.order === 'number' && typeof logoB.order === 'number') {
        return logoA.order - logoB.order
      }

      return (logoA.name || '').localeCompare(logoB.name || '', undefined, { numeric: true })
    })
  },

  async addPartnerLogo(logoData) {
    assertDbConfigured()

    const docRef = await addDoc(collection(db, 'partnerLogos'), {
      ...removeUndefined(logoData),
      order: logoData.order ?? 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return docRef.id
  },

  async updatePartnerLogo(id, logoData) {
    assertDbConfigured()

    await updateDoc(doc(db, 'partnerLogos', id), {
      ...removeUndefined(logoData),
      updatedAt: serverTimestamp(),
    })
  },

  async deletePartnerLogo(id) {
    assertDbConfigured()
    await deleteDoc(doc(db, 'partnerLogos', id))
  },
}
