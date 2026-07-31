import { UserX } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { getRoleLabel, useAuth } from '../../features/auth'
import { ApiClientError, getRequestErrorMessage } from '../../shared/api'
import { cx } from '../../shared/lib/cx'
import { Button, Card, PageHeader, TextInput, useToast } from '../../shared/ui'
import { routes } from '../routes'
import { usePageTitle } from '../../shared/lib/usePageTitle'

type SettingsSection = 'account' | 'assistant' | 'notification' | 'profile'

const SECTIONS: Array<{ id: SettingsSection; label: string }> = [
  { id: 'profile', label: '프로필' },
  { id: 'notification', label: '알림' },
  { id: 'assistant', label: 'AI 학습 도우미' },
  { id: 'account', label: '회원 탈퇴' },
]

const ANSWER_STYLES = [
  { label: '간결하게', value: 'CONCISE' },
  { label: '보통', value: 'NORMAL' },
  { label: '자세하게', value: 'DETAILED' },
]

// TODO(BE): 프로필 수정·환경설정 API가 없어 로컬 상태로만 동작한다.
// 요청 스펙은 docs/be-api-requests.md §3-1, §3-2 참고.
const PENDING_API_NOTICE = '백엔드 연동 대기 중인 항목입니다. 저장되지 않습니다.'

export function SettingsPage() {
  usePageTitle('설정')
  const { user, withdraw } = useAuth()
  const { show: showToast } = useToast()
  const navigate = useNavigate()
  const [section, setSection] = useState<SettingsSection>('profile')
  const [name, setName] = useState(user?.name ?? '')
  const [affiliation, setAffiliation] = useState('')
  const [newMaterialNotification, setNewMaterialNotification] = useState(true)
  const [studyReminder, setStudyReminder] = useState(false)
  const [answerStyle, setAnswerStyle] = useState('NORMAL')
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | undefined>()
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  async function handleWithdraw(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isWithdrawing) return
    if (!password) {
      setPasswordError('비밀번호를 입력하세요.')
      return
    }
    if (
      !window.confirm(
        '정말 탈퇴할까요? 자료와 학습 세션이 삭제되며 복구할 수 없습니다.',
      )
    ) {
      return
    }

    setIsWithdrawing(true)
    setPasswordError(undefined)
    try {
      await withdraw(password)
      navigate(routes.login, { replace: true })
    } catch (error) {
      if (
        error instanceof ApiClientError &&
        error.code === 'INVALID_CREDENTIALS'
      ) {
        setPasswordError('비밀번호가 올바르지 않습니다.')
      } else {
        setPasswordError(getRequestErrorMessage(error))
      }
    } finally {
      setIsWithdrawing(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="설정"
      />

      <div className="flex flex-col gap-7 lg:flex-row">
        <nav aria-label="설정 메뉴" className="flex gap-1 lg:w-48 lg:flex-col lg:gap-0.5">
          {SECTIONS.map((item) => (
            <button
              aria-current={section === item.id ? 'page' : undefined}
              className={cx(
                'flex h-9 shrink-0 items-center rounded-lg px-3 text-[13.5px]',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
                item.id === 'account' && 'text-rose-700 lg:mt-4 lg:border-t lg:border-stone-200 lg:pt-px',
                section === item.id
                  ? item.id === 'account'
                    ? 'bg-rose-50 font-semibold text-rose-700'
                    : 'bg-stone-100 font-semibold text-stone-900'
                  : item.id === 'account'
                    ? 'font-medium hover:bg-rose-50'
                    : 'font-medium text-stone-500 hover:bg-stone-50 hover:text-stone-800',
              )}
              key={item.id}
              onClick={() => setSection(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1 space-y-4 lg:max-w-[720px]">
          {section === 'profile' ? (
            <ProfileSection
              affiliation={affiliation}
              email={user?.email ?? ''}
              name={name}
              onAffiliationChange={setAffiliation}
              onNameChange={setName}
              onNotice={() => showToast(PENDING_API_NOTICE, 'info')}
              role={getRoleLabel(user?.role)}
            />
          ) : null}

          {section === 'account' ? (
            <section className="rounded-xl border border-rose-200 bg-white p-5 sm:p-6">
              <h2 className="text-base font-bold text-rose-900">회원 탈퇴</h2>
              <p className="mt-1 text-sm text-stone-500">
                탈퇴하면 자료와 학습 세션이 삭제되고 복구할 수 없습니다. 계속하려면
                비밀번호를 입력하세요.
              </p>
              <form className="mt-4 space-y-4" noValidate onSubmit={handleWithdraw}>
                <TextInput
                  autoComplete="current-password"
                  error={passwordError}
                  id="withdraw-password"
                  label="비밀번호 확인"
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setPasswordError(undefined)
                  }}
                  type="password"
                  value={password}
                />
                <div className="flex justify-end">
                  <Button
                    aria-label="회원 탈퇴 실행"
                    className="border-rose-700 bg-rose-700 hover:bg-rose-800"
                    disabled={isWithdrawing}
                    type="submit"
                  >
                    <UserX aria-hidden="true" size={15} />
                    {isWithdrawing ? '탈퇴 처리 중' : '회원 탈퇴'}
                  </Button>
                </div>
              </form>
            </section>
          ) : null}

          {/* 시안 4e는 프로필 화면에 알림·AI 설정 카드가 함께 놓인다.
              좌측 내비는 같은 컨트롤을 좁혀 보는 필터로 동작한다. */}
          {section === 'profile' ||
          section === 'notification' ||
          section === 'assistant' ? (
            <Card as="section" className="px-6">
              {section !== 'assistant' ? (
                <>
                  <ToggleRow
                    checked={newMaterialNotification}
                    description="강의자가 자료를 올리면 알려드려요"
                    label="새 자료 알림"
                    onChange={setNewMaterialNotification}
                  />
                  <ToggleRow
                    checked={studyReminder}
                    description="3일 이상 접속하지 않으면 이메일 발송"
                    isLast={section === 'notification'}
                    label="학습 리마인더"
                    onChange={setStudyReminder}
                  />
                </>
              ) : null}
              {section !== 'notification' ? (
                <div className="flex items-center gap-4 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-900">
                      AI 답변 스타일
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-stone-400">
                      채팅 답변의 길이와 난이도를 조절해요
                    </p>
                  </div>
                  <label className="ml-auto shrink-0">
                    <span className="sr-only">AI 답변 스타일</span>
                    <select
                      className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-[12.5px] font-medium text-stone-700 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
                      onChange={(event) => setAnswerStyle(event.target.value)}
                      value={answerStyle}
                    >
                      {ANSWER_STYLES.map((style) => (
                        <option key={style.value} value={style.value}>
                          {style.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}
            </Card>
          ) : null}

          {section === 'account' ? null : (
            <div className="flex items-center justify-end gap-3">
              <p className="mr-auto text-xs text-stone-400">
                저장 API 연동 대기 중입니다.
              </p>
              <Button
                onClick={() => {
                  setName(user?.name ?? '')
                  setAffiliation('')
                }}
                type="button"
                variant="ghost"
              >
                취소
              </Button>
              <Button
                onClick={() => showToast(PENDING_API_NOTICE, 'info')}
                type="button"
              >
                저장
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProfileSection({
  affiliation,
  email,
  name,
  onAffiliationChange,
  onNameChange,
  onNotice,
  role,
}: {
  affiliation: string
  email: string
  name: string
  onAffiliationChange: (value: string) => void
  onNameChange: (value: string) => void
  onNotice: () => void
  role: string
}) {
  return (
    <Card as="section" className="p-5 sm:p-6">
      <h2 className="text-base font-bold text-stone-950">프로필</h2>

      <div className="mt-5 flex items-center gap-4.5">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-stone-200 text-[22px] font-bold text-stone-500">
          {name.slice(0, 1) || '?'}
        </span>
        <div className="flex gap-2">
          <Button onClick={onNotice} size="sm" type="button" variant="secondary">
            사진 변경
          </Button>
          <Button onClick={onNotice} size="sm" type="button" variant="ghost">
            삭제
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <TextInput
          id="settings-name"
          label="이름"
          onChange={(event) => onNameChange(event.target.value)}
          value={name}
        />
        <TextInput
          description="이메일은 변경할 수 없습니다."
          disabled
          id="settings-email"
          label="이메일"
          readOnly
          value={email}
        />
        <TextInput
          id="settings-affiliation"
          label="소속"
          onChange={(event) => onAffiliationChange(event.target.value)}
          placeholder="학교 · 기관 (선택)"
          value={affiliation}
        />
        <TextInput disabled id="settings-role" label="역할" readOnly value={role} />
      </div>
    </Card>
  )
}

function ToggleRow({
  checked,
  description,
  isLast = false,
  label,
  onChange,
}: {
  checked: boolean
  description: string
  isLast?: boolean
  label: string
  onChange: (next: boolean) => void
}) {
  return (
    <div
      className={cx(
        'flex items-center gap-4 py-4',
        isLast ? undefined : 'border-b border-stone-100',
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-stone-900">{label}</p>
        <p className="mt-0.5 text-[12.5px] text-stone-400">{description}</p>
      </div>
      <button
        aria-checked={checked}
        aria-label={label}
        className={cx(
          'ml-auto flex h-5.5 w-10 shrink-0 items-center rounded-full px-0.5 transition-colors',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
          checked ? 'bg-brand-600' : 'bg-stone-300',
        )}
        onClick={() => onChange(!checked)}
        role="switch"
        type="button"
      >
        <span
          className={cx(
            'size-4.5 rounded-full bg-white transition-transform',
            checked && 'translate-x-4.5',
          )}
        />
      </button>
    </div>
  )
}
