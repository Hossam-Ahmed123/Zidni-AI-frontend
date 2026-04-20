import {
  exportAdminTeacherManualPaymentsCsv,
  listAdminTeacherCourses,
  listAdminTeacherManualPayments,
  type AdminTeacherCourseOption,
  type TeacherManualPaymentItem,
  type TeacherManualPaymentsQuery
} from '@/api/payments';

export type { AdminTeacherCourseOption, TeacherManualPaymentItem, TeacherManualPaymentsQuery };

export async function fetchAdminTeacherManualPayments(query: TeacherManualPaymentsQuery) {
  return listAdminTeacherManualPayments(query);
}

export async function exportAdminTeacherPaymentsCsv(query: TeacherManualPaymentsQuery) {
  return exportAdminTeacherManualPaymentsCsv(query);
}

export async function fetchAdminTeacherCourses(teacherId: number) {
  return listAdminTeacherCourses(teacherId);
}
