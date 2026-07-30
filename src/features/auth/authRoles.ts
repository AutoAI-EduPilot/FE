const INSTRUCTOR_ROLES = new Set(['ADMIN', 'INSTRUCTOR', 'TEACHER'])

export function isInstructorRole(role: string | undefined): boolean {
  return role ? INSTRUCTOR_ROLES.has(role.toUpperCase()) : false
}

export function getRoleLabel(role: string | undefined): string {
  return isInstructorRole(role) ? '강의자' : '학습자'
}
