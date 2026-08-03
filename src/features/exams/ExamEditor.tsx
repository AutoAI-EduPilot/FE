import { Plus, Trash2 } from 'lucide-react'

import { Button } from '../../shared/ui'
import type { CreateExamInput, ExamQuestionInput, ExamQuestionType } from './examsRepository'
import { createQuestion } from './examEditorModel'

interface ExamEditorProps {
  value: CreateExamInput
  onChange: (value: CreateExamInput) => void
}

const typeLabels: Record<ExamQuestionType, string> = {
  MCQ: '객관식', OX: 'OX', SHORT: '단답형', ESSAY: '서술형',
}

export function ExamEditor({ onChange, value }: ExamEditorProps) {
  function updateQuestion(index: number, next: ExamQuestionInput) {
    onChange({ ...value, questions: value.questions.map((question, questionIndex) => questionIndex === index ? next : question) })
  }

  return <div className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="sm:col-span-2 type-control font-semibold text-stone-700">시험 제목
        <input className="mt-1 h-11 w-full rounded-lg border border-stone-300 px-3 type-body" maxLength={200} onChange={(event) => onChange({ ...value, title: event.target.value })} value={value.title} />
      </label>
      <label className="type-control font-semibold text-stone-700">주차 (선택)
        <input className="mt-1 h-11 w-full rounded-lg border border-stone-300 px-3 type-body" min={1} onChange={(event) => onChange({ ...value, weekNumber: event.target.value ? Number(event.target.value) : undefined })} type="number" value={value.weekNumber ?? ''} />
      </label>
      <label className="flex items-end gap-2 pb-3 type-control font-semibold text-stone-700">
        <input checked={value.allowRetake} className="size-4 accent-brand-700" onChange={(event) => onChange({ ...value, allowRetake: event.target.checked })} type="checkbox" /> 재응시 허용
      </label>
      <label className="sm:col-span-2 type-control font-semibold text-stone-700">설명 (선택)
        <textarea className="mt-1 min-h-24 w-full resize-none rounded-lg border border-stone-300 px-3 py-2.5 type-body" maxLength={500} onChange={(event) => onChange({ ...value, description: event.target.value })} value={value.description ?? ''} />
      </label>
    </div>

    <div className="flex items-center justify-between border-t border-stone-200 pt-5">
      <h3 className="type-section-title font-bold text-stone-900">문항 {value.questions.length}개</h3>
      <Button onClick={() => onChange({ ...value, questions: [...value.questions, createQuestion('SHORT')] })} size="sm" variant="secondary"><Plus size={14} />문항 추가</Button>
    </div>
    {value.questions.length === 0 ? <p className="rounded-lg border border-dashed border-stone-300 py-10 text-center type-body text-stone-500">초안은 문항 없이 저장할 수 있습니다.</p> : null}
    {value.questions.map((question, index) => <section className="rounded-lg border border-stone-200 bg-stone-50 p-4" key={index}>
      <div className="flex items-center gap-3">
        <strong className="type-body text-stone-900">{index + 1}번</strong>
        <select className="h-9 rounded-lg border border-stone-300 bg-white px-2.5 type-control" onChange={(event) => updateQuestion(index, createQuestion(event.target.value as ExamQuestionType, question.questionText, question.points))} value={question.questionType}>
          {Object.entries(typeLabels).map(([type, label]) => <option key={type} value={type}>{label}</option>)}
        </select>
        <label className="ml-auto flex items-center gap-2 type-caption text-stone-500">배점
          <input className="h-9 w-20 rounded-lg border border-stone-300 bg-white px-2 type-control" min={0.01} onChange={(event) => updateQuestion(index, { ...question, points: Number(event.target.value) })} step="0.01" type="number" value={question.points} />
        </label>
        <button aria-label={`${index + 1}번 문항 삭제`} className="flex size-9 items-center justify-center rounded-lg text-stone-400 hover:bg-rose-50 hover:text-rose-700" onClick={() => onChange({ ...value, questions: value.questions.filter((_, questionIndex) => questionIndex !== index) })} type="button"><Trash2 size={15} /></button>
      </div>
      <label className="mt-3 block type-control font-semibold text-stone-700">질문
        <textarea className="mt-1 min-h-20 w-full resize-none rounded-lg border border-stone-300 bg-white px-3 py-2.5 type-body" onChange={(event) => updateQuestion(index, { ...question, questionText: event.target.value })} value={question.questionText} />
      </label>
      <AnswerEditor onChange={(next) => updateQuestion(index, next)} question={question} />
    </section>)}
  </div>
}

function AnswerEditor({ onChange, question }: { onChange: (value: ExamQuestionInput) => void; question: ExamQuestionInput }) {
  if (question.questionType === 'MCQ') return <div className="mt-3 grid gap-2 sm:grid-cols-2">{(question.options ?? []).map((option, index) => <label className="flex items-center gap-2 type-control" key={option.id}><input checked={question.answerChoiceId === option.id} name={`answer-${question.questionText}`} onChange={() => onChange({ ...question, answerChoiceId: option.id })} type="radio" /><span className="w-5 font-bold text-stone-500">{option.id.toUpperCase()}</span><input className="h-9 min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-2.5" onChange={(event) => onChange({ ...question, options: question.options?.map((item, itemIndex) => itemIndex === index ? { ...item, text: event.target.value } : item) })} value={option.text} /></label>)}</div>
  if (question.questionType === 'OX') return <div className="mt-3 flex gap-4">{[['true', 'O'], ['false', 'X']].map(([value, label]) => <label className="flex items-center gap-2 type-control font-semibold" key={value}><input checked={question.answerValue === (value === 'true')} onChange={() => onChange({ ...question, answerValue: value === 'true' })} type="radio" />{label}</label>)}</div>
  const key = question.questionType === 'SHORT' ? 'referenceAnswer' : 'modelAnswer'
  return <label className="mt-3 block type-control font-semibold text-stone-700">{question.questionType === 'SHORT' ? '참고 정답' : '모범 답안'}
    <textarea className="mt-1 min-h-16 w-full resize-none rounded-lg border border-stone-300 bg-white px-3 py-2 type-body" onChange={(event) => onChange({ ...question, [key]: event.target.value })} value={question[key] ?? ''} />
  </label>
}
