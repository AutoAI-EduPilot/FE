import type { StudyMaterial } from './materialTypes'
import { createLocalMaterial } from './mockMaterials'

export interface MockMaterialsRepository {
  cancelUpload: (materialId: string) => Promise<string>
  delete: (materialId: string) => Promise<string>
  refreshStatuses: (materials: StudyMaterial[]) => Promise<StudyMaterial[]>
  retryProcessing: (material: StudyMaterial) => Promise<StudyMaterial>
  upload: (file: File) => Promise<StudyMaterial>
}

export const mockMaterialsRepository: MockMaterialsRepository = {
  async cancelUpload(materialId) {
    return materialId
  },

  async delete(materialId) {
    return materialId
  },

  async refreshStatuses(materials) {
    return materials.map((material) =>
      material.status === 'PROCESSING'
        ? {
            ...material,
            pageCount: material.pageCount ?? 18,
            status: 'READY',
          }
        : material,
    )
  },

  async retryProcessing(material) {
    return {
      ...material,
      failureReason: undefined,
      status: 'PROCESSING',
    }
  },

  async upload(file) {
    return createLocalMaterial(file)
  },
}
