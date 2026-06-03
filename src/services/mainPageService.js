import { addDoc, collection, doc, getDoc, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'

function sortMainImages(images) {
  return [...images].sort((imageA, imageB) => {
    if (typeof imageA.order === 'number' && typeof imageB.order === 'number') {
      return imageA.order - imageB.order
    }

    return (imageA.fileName || '').localeCompare(imageB.fileName || '', undefined, {
      numeric: true,
    })
  })
}

function sortByOrder(items) {
  return [...items].sort((itemA, itemB) => {
    if (typeof itemA.order === 'number' && typeof itemB.order === 'number') {
      return itemA.order - itemB.order
    }

    return (itemA.name || itemA.fileName || '').localeCompare(
      itemB.name || itemB.fileName || '',
      undefined,
      { numeric: true },
    )
  })
}

export async function getMainPageContent() {
  if (!db) {
    return null
  }

  const docSnap = await getDoc(doc(db, 'pages', 'main'))
  return docSnap.exists() ? docSnap.data() : null
}

export async function getPageContent(pageId) {
  if (!db) {
    return null
  }

  const docSnap = await getDoc(doc(db, 'pages', pageId))
  return docSnap.exists() ? docSnap.data() : null
}

export async function getMainPageImages() {
  if (!db) {
    return { horizontal: [], vertical: [] }
  }

  const querySnapshot = await getDocs(collection(db, 'mainImages'))
  const images = querySnapshot.docs.map((document) => ({
    ...document.data(),
    id: document.id,
  }))

  return {
    horizontal: sortMainImages(images.filter((image) => image.type === 'horizontal')),
    vertical: sortMainImages(images.filter((image) => image.type === 'vertical')),
  }
}

export async function getPartnerLogos() {
  if (!db) {
    return []
  }

  const querySnapshot = await getDocs(collection(db, 'partnerLogos'))
  return sortByOrder(
    querySnapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    })),
  )
}

export async function getWorksFilterTags() {
  if (!db) {
    return null
  }

  const docSnap = await getDoc(doc(db, 'pages', 'works'))
  return docSnap.exists() ? docSnap.data()?.filterTags : null
}

export async function getWorks() {
  if (!db) {
    return []
  }

  const querySnapshot = await getDocs(collection(db, 'works'))
  return sortByOrder(
    querySnapshot.docs.map((document) => ({
      ...document.data(),
      id: document.id,
    })),
  )
}

export async function submitContactInquiry(inquiryData) {
  if (!db) {
    throw new Error('Firestore 설정이 필요합니다.')
  }

  await addDoc(collection(db, 'contactInquiries'), {
    ...inquiryData,
    status: 'new',
    createdAt: serverTimestamp(),
  })
}
