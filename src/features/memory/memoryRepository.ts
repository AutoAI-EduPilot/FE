import type { AuthenticatedRequest } from '../auth'

export interface LearnerMemory {
  explanationPreferences: string[]
  materialId: string
  memoryDigest: string | null
  preferredQuizTypes: string[]
  strengths: string[]
  updatedAt: string | null
  weaknesses: string[]
}

interface LearnerMemoryDto {
  explanationPreferences?: string[]
  materialId: number | string
  memoryDigest?: string | null
  preferredQuizTypes?: string[]
  strengths?: string[]
  updatedAt?: string | null
  weaknesses?: string[]
}

export interface MemoryRepository {
  getByMaterial: (
    materialId: string,
    signal?: AbortSignal,
  ) => Promise<LearnerMemory>
}

export function isEmptyLearnerMemory(memory: LearnerMemory): boolean {
  return (
    !memory.memoryDigest &&
    memory.strengths.length === 0 &&
    memory.weaknesses.length === 0 &&
    memory.explanationPreferences.length === 0
  )
}

export function createMemoryRepository(
  request: AuthenticatedRequest,
): MemoryRepository {
  return {
    async getByMaterial(materialId, signal) {
      const { data } = await request<LearnerMemoryDto>(
        `/api/users/me/memory?materialId=${encodeURIComponent(materialId)}`,
        { signal },
      )
      return {
        explanationPreferences: data.explanationPreferences ?? [],
        materialId: String(data.materialId),
        memoryDigest: data.memoryDigest ?? null,
        preferredQuizTypes: data.preferredQuizTypes ?? [],
        strengths: data.strengths ?? [],
        updatedAt: data.updatedAt ?? null,
        weaknesses: data.weaknesses ?? [],
      }
    },
  }
}
