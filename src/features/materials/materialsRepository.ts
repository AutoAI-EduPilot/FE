import { ApiClientError, type PagedResponse } from '../../shared/api'
import type { AuthenticatedRequest } from '../auth'
import type {
  MaterialPageText,
  MaterialStatus,
  StudyMaterial,
} from './materialTypes'

interface MaterialDto {
  activeSessionId?: number | string | null
  createdAt: string
  failureReason?: string | null
  fileSizeBytes?: number | null
  materialId: number | string
  pageCount?: number | null
  processingStatus: MaterialStatus
  title: string
}

interface MaterialPageDto {
  pageNumber: number
  text: string
}

export interface MaterialsRepository {
  delete: (materialId: string, signal?: AbortSignal) => Promise<void>
  getById: (
    materialId: string,
    signal?: AbortSignal,
  ) => Promise<StudyMaterial | null>
  getPageText: (
    materialId: string,
    pageNumber: number,
    signal?: AbortSignal,
  ) => Promise<MaterialPageText>
  list: (signal?: AbortSignal) => Promise<StudyMaterial[]>
  refreshStatuses: (signal?: AbortSignal) => Promise<StudyMaterial[]>
  upload: (file: File, signal?: AbortSignal) => Promise<StudyMaterial>
}

export function createMaterialsRepository(
  request: AuthenticatedRequest,
): MaterialsRepository {
  return {
    async delete(materialId, signal) {
      await request<unknown>(
        `/api/materials/${encodeURIComponent(materialId)}`,
        { method: 'DELETE', signal },
      )
    },
    async getById(materialId, signal) {
      try {
        const { data } = await request<MaterialDto>(
          `/api/materials/${encodeURIComponent(materialId)}`,
          { signal },
        )
        return mapMaterial(data)
      } catch (error) {
        if (error instanceof ApiClientError && error.status === 404) {
          return null
        }
        throw error
      }
    },
    async getPageText(materialId, pageNumber, signal) {
      const { data } = await request<MaterialPageDto>(
        `/api/materials/${encodeURIComponent(materialId)}/pages/${pageNumber}`,
        { signal },
      )
      return data
    },
    async list(signal) {
      return requestMaterials(request, signal)
    },
    async refreshStatuses(signal) {
      return requestMaterials(request, signal)
    },
    async upload(file, signal) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', file.name)

      const { data } = await request<MaterialDto>('/api/materials', {
        body: formData,
        method: 'POST',
        signal,
      })
      return mapMaterial(data)
    },
  }
}

async function requestMaterials(
  request: AuthenticatedRequest,
  signal?: AbortSignal,
): Promise<StudyMaterial[]> {
  const { data } = await request<PagedResponse<MaterialDto>>(
    '/api/materials?page=0&size=20',
    { signal },
  )
  return data.items.map(mapMaterial)
}

function mapMaterial(material: MaterialDto): StudyMaterial {
  return {
    activeSessionId:
      material.activeSessionId === null || material.activeSessionId === undefined
        ? undefined
        : String(material.activeSessionId),
    createdAt: material.createdAt,
    failureReason: material.failureReason ?? undefined,
    fileSizeBytes: material.fileSizeBytes ?? undefined,
    id: String(material.materialId),
    pageCount: material.pageCount ?? undefined,
    status: material.processingStatus,
    title: material.title,
  }
}
