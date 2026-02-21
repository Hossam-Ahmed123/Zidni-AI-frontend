<template>
   <ThemePage
 
    :title="t('assessments.studentTitle')"
    :subtitle="t('assessments.studentSubtitle')"
  >
    <template #actions>
      <UiButton
        variant="outline"
        color="primary"
        prepend-icon="ReloadOutlined"
        @click="refresh"
      >
        {{ t('common.refresh') }}
      </UiButton>
    </template>

    <div class="student-assessments">
      <UiAlert
        v-if="lastAttempt"
        class="student-assessments__alert"
        color="success"
        variant="soft"
      >
        <div class="student-assessments__alert-body">
          <span class="student-assessments__alert-text">
            {{
              t('assessments.lastAttemptScore', {
                score: lastAttemptScore,
                status: lastAttemptStatus
              })
            }}
          </span>
          <UiBadge v-if="lastAttemptStatus" :color="lastAttemptTone" variant="solid">
            {{ lastAttemptStatus }}
          </UiBadge>
        </div>
      </UiAlert>

      <UiCard class="student-assessments__card">
        <UiTable
          class="student-assessments__table"
          :headers="headers"
          :items="studentAssessments"
          density="comfortable"
          :no-data-text="t('assessments.noStudentAssessments')"
        >
          <template #item.status="{ item }">
            <UiBadge :color="normalizeStatusTone(item.latestAttemptStatus?.toString())" variant="outline">
              {{ formatStatus(item.latestAttemptStatus) }}
            </UiBadge>
          </template>
          <template #item.score="{ item }">
            <span class="student-assessments__score" v-if="item.latestAttemptStatus">
              {{ formatScore(item) }}
            </span>
            <span v-else>-</span>
          </template>
          <template #item.type="{ item }">
            <UiBadge color="info">{{ item.type.toUpperCase() }}</UiBadge>
          </template>
          <template #item.actions="{ item }">
            <div class="student-assessments__row-actions">
              <UiButton
                variant="link"
                color="primary"
                prepend-icon="PlayCircleOutlined"
                @click="goToAssessment(item)"
                :disabled="isAttemptLocked(item) && !canViewResults(item)"
              >
                {{ actionLabel(item) }}
              </UiButton>
            </div>
          </template>
        </UiTable>
        <div class="student-assessments__list" role="list">
          <article
            v-for="item in studentAssessments"
            :key="item.id"
            class="student-assessments__list-item"
            role="listitem"
          >
            <header class="student-assessments__list-header">
              <div class="student-assessments__list-titles">
                <h3>{{ item.title }}</h3>
                <span>{{ item.courseTitle }}</span>
              </div>
              <UiBadge color="info">{{ item.type.toUpperCase() }}</UiBadge>
            </header>
            <dl class="student-assessments__list-grid">
              <div>
                <dt>{{ t('assessments.tableDuration') }}</dt>
                <dd>{{ item.durationMinutes }}</dd>
              </div>
              <div>
                <dt>{{ t('assessments.tableQuestions') }}</dt>
                <dd>{{ item.questionCount }}</dd>
              </div>
              <div>
                <dt>{{ t('assessments.tableStatus') }}</dt>
                <dd>
                  <UiBadge :color="normalizeStatusTone(item.latestAttemptStatus?.toString())" variant="outline">
                    {{ formatStatus(item.latestAttemptStatus) }}
                  </UiBadge>
                </dd>
              </div>
              <div>
                <dt>{{ t('assessments.tableScore') }}</dt>
                <dd>{{ item.latestAttemptStatus ? formatScore(item) : '—' }}</dd>
              </div>
            </dl>
            <UiButton
              class="student-assessments__list-action"
              color="primary"
              :variant="isAttemptLocked(item) && !canViewResults(item) ? 'outline' : 'solid'"
              prepend-icon="PlayCircleOutlined"
              :disabled="isAttemptLocked(item) && !canViewResults(item)"
              @click="goToAssessment(item)"
            >
              {{ actionLabel(item) }}
            </UiButton>
          </article>
        </div>
      </UiCard>

      <UiCard class="student-assessments__card student-assessments__certificates" :title="t('certificates.student.title')">
        <div class="student-assessments__certificates-body">
          <div v-if="!certificateItems.length" class="empty-state">
            <UiIcon name="SafetyCertificateOutlined" :size="32" class="text-muted" />
            <p>{{ t('certificates.student.empty') }}</p>
          </div>
          <div v-else class="student-assessments__certificates-list">
            <div
              v-for="certificate in certificateItems"
              :key="certificate.id"
              class="student-assessments__certificates-item"
            >
              <div class="student-assessments__certificates-info">
                <span class="student-assessments__certificates-title">{{ certificate.courseTitle }}</span>
                <small class="student-assessments__certificates-date">{{ formatDate(certificate.issuedAt) }}</small>
              </div>
              <UiButton
                size="xs"
                variant="outline"
                color="primary"
                :href="certificate.downloadUrl"
                target="_blank"
                rel="noopener"
              >
                {{ t('certificates.student.download') }}
              </UiButton>
            </div>
            <UiButton
              variant="link"
              color="secondary"
              size="sm"
              class="student-assessments__certificates-view"
              @click="router.push({ name: 'student-achievements' })"
            >
              {{ t('certificates.student.viewAll') }}
            </UiButton>
          </div>
        </div>
      </UiCard>
    </div>
 
  </ThemePage>
</template>

<script setup lang="ts">
/**
 * StudentAssessmentsView renders the assessment overview that students use to
 * review recent attempts, launch new sessions, and monitor grading progress.
 *
 * This component does not accept props. It relies on the assessments store for
 * data, i18n for localized copy, and router navigation to transition into the
 * assessment player when appropriate.
 */
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAssessmentsStore } from '@/stores/assessments';
import { useAchievementsStore } from '@/stores/achievements';
import type { StudentAssessmentSummary, AttemptStatus } from '@/services/assessments';
import { useI18n } from 'vue-i18n';
import UiBadge from '@/components/ui/UiBadge.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import { withCacheBusting } from '@/utils/cacheBusting';

const store = useAssessmentsStore();
const achievementsStore = useAchievementsStore();
const router = useRouter();
const { t } = useI18n();

/**
 * Tracks the latest attempt returned by the assessments store for convenience
 * throughout the template.
 */
const lastAttempt = computed(() => store.lastStudentAttempt);

/**
 * Formats the score associated with the student's most recent attempt for the
 * dashboard alert, gracefully handling pending grading states.
 */
const lastAttemptScore = computed(() => {
  const attempt = lastAttempt.value;
  if (!attempt) {
    return '';
  }
  if (attempt.status === 'pending_result') {
    return '—';
  }
  const auto = Number(attempt.autoScore ?? 0);
  const manual = Number(attempt.manualScore ?? 0);
  return (auto + manual).toFixed(1);
});

/**
 * Maps an arbitrary attempt status string into a semantic tone used for badge
 * coloring.
 *
 * @param status raw status value emitted by the backend or computed helpers.
 * @returns the semantic color tone to apply to a badge.
 */
const normalizeStatusTone = (status: string | undefined) => {
  if (!status) {
    return 'info';
  }
  const value = status.toLowerCase();
  if (['passed', 'complete', 'completed', 'success', 'graded'].includes(value)) {
    return 'success';
  }
  if (['failed', 'rejected', 'cancelled', 'canceled'].includes(value)) {
    return 'danger';
  }
  if (
    value.includes('progress') ||
    value.includes('pending') ||
    value.includes('review') ||
    value.includes('draft') ||
    value === 'submitted'
  ) {
    return 'warning';
  }
  return 'info';
};

/**
 * Exposes the unformatted status from the last attempt for downstream tone
 * calculations.
 */
const lastAttemptStatusRaw = computed(() => lastAttempt.value?.status ?? '');

/**
 * Converts the latest attempt status into human friendly text for alert copy.
 */
const lastAttemptStatus = computed(() => {
  const status = lastAttempt.value?.status ?? null;
  return status ? formatStatus(status) : '';
});
/**
 * Derives the tone for the last attempt alert badge using the normalized
 * status mapping helper.
 */
const lastAttemptTone = computed(() => normalizeStatusTone(lastAttemptStatusRaw.value));

/**
 * Table header configuration used by the UI table component for column labels
 * and ordering.
 */
const headers = computed(() => [
  { title: t('assessments.tableName'), key: 'title' },
  { title: t('assessments.tableType'), key: 'type' },
  { title: t('assessments.tableDuration'), key: 'durationMinutes' },
  { title: t('assessments.tableQuestions'), key: 'questionCount' },
  { title: t('assessments.tableMaxScore'), key: 'maxScore' },
  { title: t('assessments.tableStatus'), key: 'status' },
  { title: t('assessments.tableScore'), key: 'score' },
  { title: '', key: 'actions', sortable: false }
]);

/**
 * Provides the current set of student assessments pulled from the store.
 */
const studentAssessments = computed(() => store.studentAssessments);
const certificateItems = computed(() =>
  (achievementsStore.data?.certificates ?? []).slice(0, 3).map((certificate) => ({
    ...certificate,
    downloadUrl: withCacheBusting(certificate.pdfUrl)
  }))
);

/**
 * Evaluates whether the most recent attempt prevents further student action.
 *
 * @param assessment assessment summary for the current table row.
 * @returns true when the attempt is locked and the player should be disabled.
 */
const isAttemptLocked = (assessment: StudentAssessmentSummary) => {
  const status = assessment.latestAttemptStatus;
  if (!status) return false;
  const lowered = status.toString().toLowerCase();
  return lowered === 'submitted' || lowered === 'pending_result' || lowered === 'graded';
};

/**
 * Determines if a student is permitted to view attempt results for a summary.
 *
 * @param assessment assessment summary under evaluation.
 * @returns true when the student can view graded results.
 */
const canViewResults = (assessment: StudentAssessmentSummary) => {
  const status = assessment.latestAttemptStatus;
  return Boolean(status && status.toString().toLowerCase() === 'graded');
};

/**
 * Chooses the most appropriate action label for the row based on attempt
 * status and permissions.
 *
 * @param assessment assessment summary used to derive the label.
 * @returns localized button copy representing the allowed action.
 */
const actionLabel = (assessment: StudentAssessmentSummary) => {
  if (canViewResults(assessment)) {
    return t('assessments.viewResults');
  }
  if (isAttemptLocked(assessment)) {
    return t('assessments.viewSubmission');
  }
  return t('assessments.start');
};

/**
 * Translates an attempt status into localized, human readable text.
 *
 * @param status attempt status code or null when no attempt exists.
 * @returns localized string representation of the attempt status.
 */
const formatStatus = (status?: AttemptStatus | null) => {
  if (!status) return t('assessments.statusNotStarted');
  switch (status) {
    case 'in_progress':
      return t('assessments.statusInProgress');
    case 'submitted':
      return t('assessments.statusPending');
    case 'pending_result':
      return t('assessments.statusPendingResult');
    case 'graded':
      return t('assessments.statusGraded');
    case 'void':
      return t('assessments.statusVoided');
    default:
      return status.toUpperCase();
  }
};

/**
 * Formats the display score for the table, including manual and automatic
 * grading contributions when available.
 *
 * @param assessment assessment summary being rendered.
 * @returns formatted score string for the summary row.
 */
const formatScore = (assessment: StudentAssessmentSummary) => {
  const auto = Number(assessment.latestAttemptStatus ? assessment.latestAutoScore ?? 0 : 0);
  const manual = Number(assessment.latestAttemptStatus ? assessment.latestManualScore ?? 0 : 0);
  const status = assessment.latestAttemptStatus?.toString().toLowerCase();
  if (status === 'pending_result') {
    return '—';
  }
  const total = auto + manual;
  return `${total.toFixed(1)} / ${assessment.maxScore}`;
};

/**
 * Routes the student into the assessment player when action is permitted.
 *
 * @param item assessment summary corresponding to the clicked table row.
 */
const goToAssessment = (item: StudentAssessmentSummary) => {
  if (isAttemptLocked(item) && !canViewResults(item)) {
    return;
  }
  router.push({ name: 'student-assessment-player', params: { assessmentId: item.id } });
};

/**
 * Requests the assessments store to refresh student assessment data.
 *
 * @returns promise that resolves once the refresh has completed.
 */
const refresh = async () => {
  await store.loadStudentAssessments();
};

const formatDate = (value?: string | null) => {
  if (!value) return 'â€”';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
};

onMounted(() => {
  refresh();
  achievementsStore.load('alltime', 3).catch(() => {});
});
</script>

<style scoped>
.student-assessments {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-6);
}

.student-assessments__alert {
  border: 1px solid color-mix(in srgb, var(--sakai-success) 28%, transparent);
}

.student-assessments__alert-body {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sakai-space-3);
}

.student-assessments__alert-text {
  font-weight: var(--sakai-font-weight-medium);
  color: var(--sakai-text-color);
}

.student-assessments__card {
  display: flex;
  flex-direction: column;
}

.student-assessments__card :deep(.ui-card__body) {
  gap: var(--sakai-space-4);
  padding: var(--sakai-space-5);
}

.student-assessments__table {
  display: block;
  overflow-x: auto;
}

.student-assessments__table table {
  min-width: calc(var(--sakai-space-12) * 10);
}

.student-assessments__row-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--sakai-space-2);
}

.student-assessments__list {
  display: none;
  gap: var(--sakai-space-3);
}

.student-assessments__list-item {
  display: grid;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
  background: color-mix(in srgb, var(--sakai-surface-card) 96%, transparent);
}

.student-assessments__list-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-2);
}

.student-assessments__list-titles {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.student-assessments__list-titles h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.student-assessments__list-titles span {
  color: var(--sakai-text-color-tertiary);
  font-size: 0.85rem;
}

.student-assessments__list-grid {
  display: grid;
  gap: var(--sakai-space-3);
}

.student-assessments__list-grid div {
  display: grid;
  gap: var(--sakai-space-1);
}

.student-assessments__list-grid dt {
  font-size: 0.78rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color-tertiary);
}

.student-assessments__list-grid dd {
  margin: 0;
  font-weight: var(--sakai-font-weight-medium);
}

.student-assessments__list-action {
  justify-content: center;
}

.student-assessments__certificates-body {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
}

.student-assessments__certificates-list {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-2);
}

.student-assessments__certificates-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-2);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid var(--sakai-border-color);
  background: var(--sakai-surface-alt);
}

.student-assessments__certificates-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.student-assessments__certificates-title {
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.student-assessments__certificates-date {
  font-size: 0.75rem;
  color: var(--sakai-text-color-secondary);
}

.student-assessments__certificates-view {
  align-self: flex-start;
  padding-inline-start: 0;
}

@media (max-width: 768px) {
  .student-assessments__card :deep(.ui-card__body) {
    padding: var(--sakai-space-4);
  }

  .student-assessments__row-actions {
    justify-content: flex-start;
    width: 100%;
  }

  .student-assessments__row-actions :deep(.ui-button) {
    flex: 1 1 auto;
  }

  .student-assessments__table {
    display: none;
  }

  .student-assessments__list {
    display: grid;
  }
}
</style>
