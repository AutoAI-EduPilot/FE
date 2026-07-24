import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'

import {
  getMaterialStatusLabel,
  mockMaterialsRepository,
  mockMaterials,
  validateMaterialUpload,
  type MaterialStatus,
  type StudyMaterial,
} from '../../features/materials'
import { Badge, Button, ButtonLink, PageHeader } from '../../shared/ui'
import { materialDetailPath, sessionDetailPath } from '../routes'

export function MaterialsPage() {
  const [materials, setMaterials] = useState<StudyMaterial[]>(mockMaterials)
  const [isDropActive, setIsDropActive] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [materialToDelete, setMaterialToDelete] = useState<StudyMaterial | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const readyCount = useMemo(
    () => materials.filter((material) => material.status === 'READY').length,
    [materials],
  )

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    await acceptFile(file)
    event.target.value = ''
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDropActive(false)
    await acceptFile(event.dataTransfer.files?.[0] ?? null)
  }

  async function acceptFile(file: File | null) {
    const validationError = validateMaterialUpload(file)
    setUploadError(validationError)

    if (validationError || !file) {
      setSelectedFileName(null)
      return
    }

    const nextMaterial = await mockMaterialsRepository.upload(file)
    setSelectedFileName(file.name)
    setMaterials((current) => [nextMaterial, ...current])
  }

  async function confirmDelete() {
    if (!materialToDelete) {
      return
    }

    await mockMaterialsRepository.delete(materialToDelete.id)
    setMaterials((current) =>
      current.filter((material) => material.id !== materialToDelete.id),
    )
    setMaterialToDelete(null)
  }

  async function refreshProcessingStatuses() {
    const nextMaterials = await mockMaterialsRepository.refreshStatuses(materials)
    setMaterials(nextMaterials)
  }

  async function cancelProcessing(material: StudyMaterial) {
    await mockMaterialsRepository.cancelUpload(material.id)
    setMaterials((current) => current.filter((item) => item.id !== material.id))
  }

  async function retryProcessing(material: StudyMaterial) {
    const nextMaterial = await mockMaterialsRepository.retryProcessing(material)
    setMaterials((current) =>
      current.map((item) => (item.id === nextMaterial.id ? nextMaterial : item)),
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Materials"
        title="자료"
        description="PDF 자료를 추가하고 처리 상태를 확인합니다."
        actions={<Badge tone="warning">BE#48 연동 예정</Badge>}
      />

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-950">PDF 업로드</h2>
            <p className="mt-1 text-sm text-zinc-600">45MB 이하 PDF 파일만 추가됩니다.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="success">READY {readyCount}</Badge>
            <Badge tone="info">전체 {materials.length}</Badge>
          </div>
        </div>

        <div
          aria-label="PDF 업로드 드롭 영역"
          className={[
            'mt-5 rounded-lg border border-dashed p-4',
            isDropActive ? 'border-teal-500 bg-teal-50' : 'border-zinc-300 bg-zinc-50',
          ].join(' ')}
          onDragLeave={() => setIsDropActive(false)}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDropActive(true)
          }}
          onDrop={handleDrop}
        >
          <input
            aria-label="PDF 파일"
            accept="application/pdf,.pdf"
            className="sr-only"
            id="material-upload"
            onChange={handleFileChange}
            ref={fileInputRef}
            type="file"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button onClick={() => fileInputRef.current?.click()} type="button">
              PDF 선택
            </Button>
            <Button onClick={refreshProcessingStatuses} type="button" variant="secondary">
              처리 상태 새로고침
            </Button>
            <label className="text-sm text-zinc-600" htmlFor="material-upload">
              {selectedFileName ?? '선택된 파일 없음'}
            </label>
          </div>
          <p className="mt-3 text-sm text-zinc-600">
            파일을 이 영역으로 끌어 놓아도 로컬 목록에 추가됩니다.
          </p>
        </div>

        {uploadError ? (
          <p className="mt-3 text-sm font-medium text-rose-700" role="alert">
            {uploadError}
          </p>
        ) : null}
      </section>

      <section className="grid gap-4">
        {materials.map((material) => (
          <article
            className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
            key={material.id}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="break-words text-lg font-bold text-zinc-950">
                    {material.title}
                  </h2>
                  <StatusBadge status={material.status} />
                </div>
                <p className="mt-2 text-sm text-zinc-600">
                  {formatFileSize(material.fileSizeBytes)} · 업로드 {material.createdAt}
                  {material.pageCount ? ` · ${material.pageCount}쪽` : ''}
                </p>
                {material.failureReason ? (
                  <p className="mt-2 text-sm font-medium text-rose-700">
                    {material.failureReason}
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                {material.status === 'PROCESSING' ? (
                  <Button
                    aria-label={`${material.title} 업로드 취소`}
                    onClick={() => cancelProcessing(material)}
                    type="button"
                    variant="secondary"
                  >
                    취소
                  </Button>
                ) : null}
                {material.status === 'FAILED' ? (
                  <Button
                    aria-label={`${material.title} 다시 시도`}
                    onClick={() => retryProcessing(material)}
                    type="button"
                    variant="secondary"
                  >
                    다시 시도
                  </Button>
                ) : null}
                <ButtonLink to={materialDetailPath(material.id)} variant="secondary">
                  상세
                </ButtonLink>
                <Button
                  aria-label={`${material.title} 삭제`}
                  onClick={() => setMaterialToDelete(material)}
                  type="button"
                  variant="ghost"
                >
                  삭제
                </Button>
              </div>
            </div>

            {material.activeSessionId ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="font-semibold">진행 중인 학습 세션이 있습니다.</p>
                <ButtonLink
                  className="mt-2"
                  size="sm"
                  to={sessionDetailPath(material.activeSessionId)}
                  variant="secondary"
                >
                  세션으로 이동
                </ButtonLink>
              </div>
            ) : null}
          </article>
        ))}
      </section>

      {materialToDelete ? (
        <DeleteMaterialDialog
          material={materialToDelete}
          onCancel={() => setMaterialToDelete(null)}
          onConfirm={confirmDelete}
        />
      ) : null}
    </div>
  )
}

function DeleteMaterialDialog({
  material,
  onCancel,
  onConfirm,
}: {
  material: StudyMaterial
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div
      aria-labelledby="delete-material-title"
      aria-modal="true"
      className="fixed inset-0 z-10 flex items-center justify-center bg-zinc-950/40 px-4"
      role="dialog"
    >
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-5 shadow-lg">
        <h2 className="text-lg font-bold text-zinc-950" id="delete-material-title">
          자료 삭제
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          {material.title} 항목을 목록에서 삭제합니다.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button autoFocus onClick={onCancel} type="button" variant="secondary">
            취소
          </Button>
          <Button onClick={onConfirm} type="button">
            삭제
          </Button>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: MaterialStatus }) {
  return <Badge tone={statusTone[status]}>{getMaterialStatusLabel(status)}</Badge>
}

const statusTone: Record<MaterialStatus, 'danger' | 'success' | 'warning'> = {
  FAILED: 'danger',
  PROCESSING: 'warning',
  READY: 'success',
}

function formatFileSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}
