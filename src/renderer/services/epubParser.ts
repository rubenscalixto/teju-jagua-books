import JSZip from 'jszip'
import { parseString } from 'xml2js'
import { v4 as uuidv4 } from 'uuid'
import type { Book } from '../types'

export interface EpubMetadata {
  title: string
  author: string
  description?: string
  publisher?: string
  language?: string
  isbn?: string
  coverImage?: string
  coverImageBase64?: string
}

const parseXml = (xml: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    parseString(xml, { explicitArray: false }, (err, result) => {
      if (err) reject(err)
      else resolve(result)
    })
  })
}

export const parseEpub = async (filePath: string, fileBuffer: ArrayBuffer): Promise<Book> => {
  const zip = await JSZip.loadAsync(fileBuffer)
  
  const containerXml = await zip.file('META-INF/container.xml')?.async('text')
  if (!containerXml) {
    throw new Error('Invalid EPUB: container.xml not found')
  }
  
  const container = await parseXml(containerXml)
  const rootfilePath = container.container?.rootfiles?.rootfile?.$?.['full-path']
  
  if (!rootfilePath) {
    throw new Error('Invalid EPUB: rootfile path not found')
  }
  
  const opfXml = await zip.file(rootfilePath)?.async('text')
  if (!opfXml) {
    throw new Error('Invalid EPUB: OPF file not found')
  }
  
  const opf = await parseXml(opfXml)
  const package_ = opf.package
  
  const metadata = package_?.metadata || {}
  
  let title = 'Unknown Title'
  let author = 'Unknown Author'
  let description: string | undefined
  let language: string | undefined
  let coverImageBase64: string | undefined
  
  if (metadata['dc:title']) {
    title = Array.isArray(metadata['dc:title']) 
      ? metadata['dc:title'][0] 
      : metadata['dc:title']
  } else if (metadata.title) {
    title = Array.isArray(metadata.title) ? metadata.title[0] : metadata.title
  }
  
  if (metadata['dc:creator']) {
    author = Array.isArray(metadata['dc:creator']) 
      ? metadata['dc:creator'][0] 
      : metadata['dc:creator']
  } else if (metadata.creator) {
    author = Array.isArray(metadata.creator) ? metadata.creator[0] : metadata.creator
  }
  
  if (metadata['dc:description']) {
    description = Array.isArray(metadata['dc:description']) 
      ? metadata['dc:description'][0] 
      : metadata['dc:description']
  }
  
  if (metadata['dc:language']) {
    language = Array.isArray(metadata['dc:language']) 
      ? metadata['dc:language'][0] 
      : metadata['dc:language']
  }
  
  const manifest = package_?.manifest?.item || []
  const manifestItems = Array.isArray(manifest) ? manifest : [manifest]
  
  const coverItem = manifestItems.find((item: any) => 
    item.$?.id?.toLowerCase().includes('cover') || 
    item.$?.properties?.includes('cover-image')
  )
  
  if (coverItem) {
    const coverPath = coverItem.$?.href
    if (coverPath) {
      const opfDir = rootfilePath.substring(0, rootfilePath.lastIndexOf('/') + 1)
      const fullCoverPath = opfDir + coverPath
      const coverFile = zip.file(fullCoverPath)
      
      if (coverFile) {
        const coverBuffer = await coverFile.async('base64')
        const coverMimeType = coverPath.endsWith('.png') ? 'image/png' : 'image/jpeg'
        coverImageBase64 = `data:${coverMimeType};base64,${coverBuffer}`
      }
    }
  }
  
  const idElement = metadata['dc:identifier']
  let isbn: string | undefined
  if (idElement) {
    const idValue = Array.isArray(idElement) ? idElement[0] : idElement
    const isbnMatch = String(idValue).match(/(?:ISBN[:\s-]?)?(\d{10,13})/i)
    if (isbnMatch) {
      isbn = isbnMatch[1]
    }
  }
  
  return {
    id: uuidv4(),
    filePath,
    fileType: 'epub',
    title: String(title || 'Unknown Title').trim(),
    author: String(author || 'Unknown Author').trim(),
    description,
    language,
    isbn,
    coverUrl: coverImageBase64,
    addedAt: Date.now()
  }
}

export const getEpubContent = async (fileBuffer: ArrayBuffer): Promise<{
  spine: string[]
  manifest: Record<string, { href: string; mediaType: string }>
}> => {
  const zip = await JSZip.loadAsync(fileBuffer)
  
  const containerXml = await zip.file('META-INF/container.xml')?.async('text')
  if (!containerXml) {
    throw new Error('Invalid EPUB')
  }
  
  const container = await parseXml(containerXml)
  const rootfilePath = container.container?.rootfiles?.rootfile?.$?.['full-path']
  
  if (!rootfilePath) {
    throw new Error('Invalid EPUB: rootfile not found')
  }
  
  const opfXml = await zip.file(rootfilePath)?.async('text')
  if (!opfXml) {
    throw new Error('Invalid EPUB: OPF not found')
  }
  
  const opf = await parseXml(opfXml)
  const opfPackage = opf.package
  const opfDir = rootfilePath.substring(0, rootfilePath.lastIndexOf('/') + 1)
  
  const manifest = opfPackage?.manifest?.item || []
  const manifestItems = Array.isArray(manifest) ? manifest : [manifest]
  
  const manifestMap: Record<string, { href: string; mediaType: string }> = {}
  manifestItems.forEach((item: any) => {
    const id = item.$?.id
    const href = item.$?.href
    const mediaType = item.$?.['media-type']
    if (id && href) {
      manifestMap[id] = { href: opfDir + href, mediaType }
    }
  })
  
  const spine = opfPackage?.spine?.itemref || []
  const spineItems = Array.isArray(spine) ? spine : [spine]
  const spineOrder = spineItems.map((item: any) => item.$?.idref).filter(Boolean)
  
  return {
    spine: spineOrder as string[],
    manifest: manifestMap
  }
}
