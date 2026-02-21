<template>
   <ThemePage :title="t('assessments.title')" :subtitle="t('assessments.subtitle')">
 
    <template #actions>
      <UiButton color="primary" prepend-icon="PlusOutlined" @click="showCreate = true">
        {{ t('assessments.createAssessment') }}
      </UiButton>
    </template>

    <div class="teacher-assessments">
      <UiCard
        class="teacher-assessments__card"
        :title="t('assessments.title')"
        :subtitle="t('assessments.subtitle')"
 
      >
        <UiTable
          class="teacher-assessments__table"
          :headers="headers"
          :items="store.assessments"
          density="comfortable"
          :no-data-text="t('assessments.empty')"
          @click:row="goToAssessment"
        >
          <template #item.type="{ item }">
            <UiBadge color="secondary">{{ item.type.toUpperCase() }}</UiBadge>
          </template>
          <template #item.actions="{ item }">
            <div class="teacher-assessments__row-actions">
              <UiButton variant="link" color="primary" @click.stop="goToAssessment(item)">
                {{ t('common.edit') }}
              </UiButton>
              <UiButton variant="link" color="danger" @click.stop="confirmDelete(item)">
                {{ t('common.delete') }}
              </UiButton>
            </div>
          </template>
        </UiTable>
        <div class="teacher-assessments__list" role="list">
          <article
            v-for="item in assessments"
            :key="item.id"
            class="teacher-assessments__list-item"
            role="listitem"
          >
            <header class="teacher-assessments__list-header">
              <h3>{{ item.title }}</h3>
              <UiBadge color="secondary">{{ item.type.toUpperCase() }}</UiBadge>
            </header>
            <dl class="teacher-assessments__list-grid">
              <div>
                <dt>{{ t('assessments.tableCourse') }}</dt>
                <dd>{{ item.courseTitle }}</dd>
              </div>
              <div>
                <dt>{{ t('assessments.tableDuration') }}</dt>
                <dd>{{ item.durationMinutes }}</dd>
              </div>
              <div>
                <dt>{{ t('assessments.tableQuestions') }}</dt>
                <dd>{{ item.questionCount }}</dd>
              </div>
            </dl>
            <div class="teacher-assessments__list-actions">
              <UiButton variant="outline" color="primary" @click="goToAssessment(item)">
                {{ t('common.edit') }}
              </UiButton>
              <UiButton variant="outline" color="danger" @click="confirmDelete(item)">
                {{ t('common.delete') }}
              </UiButton>
            </div>
          </article>
        </div>
      </UiCard>

      <UiDialog v-model="showCreate" :title="t('assessments.createAssessment')" width="520px">
        <form class="teacher-assessments__form" @submit.prevent="createAssessment">
          <UiSelect
            :model-value="createForm.courseId ?? ''"
            :label="t('assessments.course')"
            required
            @update:model-value="onCourseChange"
          >
            <option value="" disabled>{{ t('assessments.course') }}</option>
            <option
              v-for="course in courses"
              :key="course.id"
              :value="course.id"
            >
              {{ course.title }}
            </option>
          </UiSelect>

          <UiInput
            v-model="createForm.title"
            :label="t('assessments.assessmentName')"
            required
          />

          <div class="teacher-assessments__form-grid">
            <UiSelect
              :model-value="createForm.type"
              :label="t('assessments.mode')"
              @update:model-value="onTypeChange"
            >
              <option
                v-for="option in assessmentTypes"
                :key="option.value"
                :value="option.value"
              >
                {{ option.title }}
              </option>
            </UiSelect>

            <UiInput
              :model-value="createForm.durationMinutes"
              type="number"
              min="1"
              :label="t('assessments.duration')"
              @update:model-value="onDurationChange"
            />
          </div>

          <UiInput
            v-if="isExternalForm"
            v-model="createForm.embedUrl"
            :label="t('assessments.embedUrlLabel')"
            :placeholder="'https://docs.google.com/forms/d/e/.../viewform?embedded=true'"
            :helper-text="t('assessments.embedUrlHint')"
            required
          />

          <UiAlert
            v-if="isExternalForm"
            variant="outline"
            color="primary"
            class="teacher-assessments__embed-guide"
          >
            <p class="teacher-assessments__embed-title">{{ t('assessments.embedHowToTitle') }}</p>
            <ol class="teacher-assessments__embed-steps">
              <li>{{ t('assessments.embedHowToStep1') }}</li>
              <li>{{ t('assessments.embedHowToStep2') }}</li>
              <li>{{ t('assessments.embedHowToStep3') }}</li>
            </ol>
          </UiAlert>

          <div class="teacher-assessments__dialog-actions">
            <UiButton variant="link" color="secondary" @click.prevent="showCreate = false">
              {{ t('common.cancel') }}
            </UiButton>
            <UiButton button-type="submit" color="primary">
              {{ t('common.save') }}
            </UiButton>
          </div>
        </form>
      </UiDialog>

      <UiDialog v-model="showDelete" :title="t('assessments.deleteTitle')" width="420px">
        <p class="teacher-assessments__confirm">{{ t('assessments.deleteConfirm') }}</p>
        <div class="teacher-assessments__dialog-actions">
          <UiButton variant="link" color="secondary" @click="showDelete = false">
            {{ t('common.cancel') }}
          </UiButton>
          <UiButton color="danger" @click="deleteAssessment">
            {{ t('common.delete') }}
          </UiButton>
        </div>
      </UiDialog>
    </div>
 
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAssessmentsStore } from '@/stores/assessments';
import { useCoursesStore } from '@/stores/courses';
import { useI18n } from 'vue-i18n';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiBadge from '@/components/ui/UiBadge.vue';
import UiAlert from '@/components/ui/UiAlert.vue';

const store = useAssessmentsStore();
const coursesStore = useCoursesStore();
const router = useRouter();
const { t } = useI18n();

const showCreate = ref(false);
const showDelete = ref(false);
const toDelete = ref<number | null>(null);
const createForm = reactive({
  courseId: null as number | null,
  title: '',
  type: 'quiz',
  durationMinutes: 10,
  embedUrl: ''
});

const headers = computed(() => [
  { title: t('assessments.tableName'), key: 'title' },
  { title: t('assessments.tableCourse'), key: 'courseTitle' },
  { title: t('assessments.tableType'), key: 'type' },
  { title: t('assessments.tableDuration'), key: 'durationMinutes' },
  { title: t('assessments.tableQuestions'), key: 'questionCount' },
  { title: '', key: 'actions', sortable: false }
]);

const assessments = computed(() => store.assessments);

const assessmentTypes = computed(() => [
  { title: t('assessments.type.quiz'), value: 'quiz' },
  { title: t('assessments.type.exam'), value: 'exam' },
  { title: t('assessments.type.external_form'), value: 'external_form' }
]);

const courses = computed(() => coursesStore.list);

const isExternalForm = computed(() => createForm.type === 'external_form');

onMounted(async () => {
  await Promise.all([store.loadAssessments(), coursesStore.fetchCourses()]);
});

const createAssessment = async () => {
  if (!createForm.courseId || !createForm.title) return;
  if (isExternalForm.value && !createForm.embedUrl.trim()) return;
  const id = await store.createAssessment({
    courseId: createForm.courseId,
    title: createForm.title,
    type: createForm.type,
    durationMinutes: createForm.durationMinutes,
    embedUrl: isExternalForm.value ? createForm.embedUrl.trim() : null
  });
  showCreate.value = false;
  createForm.courseId = null;
  createForm.title = '';
  createForm.type = 'quiz';
  createForm.durationMinutes = 10;
  createForm.embedUrl = '';
  router.push({ name: 'teacher-assessment-builder', params: { assessmentId: id } });
};

const goToAssessment = (item: { id: number }) => {
  router.push({ name: 'teacher-assessment-builder', params: { assessmentId: item.id } });
};

const confirmDelete = (item: { id: number }) => {
  toDelete.value = item.id;
  showDelete.value = true;
};

const deleteAssessment = async () => {
  if (toDelete.value != null) {
    await store.deleteAssessment(toDelete.value);
  }
  showDelete.value = false;
  toDelete.value = null;
};

const onCourseChange = (value: string | number | null) => {
  if (value === null || value === '') {
    createForm.courseId = null;
  } else {
    createForm.courseId = Number(value);
  }
};

const onTypeChange = (value: string | number | null) => {
  createForm.type = typeof value === 'string' ? value : String(value || 'quiz');
  if (createForm.type !== 'external_form') {
    createForm.embedUrl = '';
  }
};

const onDurationChange = (value: string | number | null) => {
  const parsed = Number(value);
  createForm.durationMinutes = Number.isNaN(parsed) ? 1 : Math.max(1, parsed);
};
</script>

<style scoped>
.teacher-assessments {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-6);
}


.teacher-assessments__table {
  display: block;
  width: 100%;
  overflow-x: auto;
}

.teacher-assessments__table :deep(table) {
  width: 100%;
  min-width: calc(var(--sakai-space-12) * 9);
}

.teacher-assessments__row-actions {
  display: inline-flex;
  gap: var(--sakai-space-2);
}

.teacher-assessments__list {
  display: none;
  gap: var(--sakai-space-3);
}

.teacher-assessments__list-item {
  display: grid;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
  background: color-mix(in srgb, var(--sakai-surface-card) 96%, transparent);
}

.teacher-assessments__list-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-2);
}

.teacher-assessments__list-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.teacher-assessments__list-grid {
  display: grid;
  gap: var(--sakai-space-3);
}

.teacher-assessments__list-grid div {
  display: grid;
  gap: var(--sakai-space-1);
}

.teacher-assessments__list-grid dt {
  font-size: 0.8rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color-tertiary);
}

.teacher-assessments__list-grid dd {
  margin: 0;
  font-weight: var(--sakai-font-weight-medium);
}

.teacher-assessments__list-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sakai-space-2);
}

.teacher-assessments__form {
  display: grid;
  gap: var(--sakai-space-4);
}

.teacher-assessments__form-grid {
  display: grid;
  gap: var(--sakai-space-4);
}

.teacher-assessments__embed-guide {
  display: grid;
  gap: var(--sakai-space-2);
}

.teacher-assessments__embed-title {
  margin: 0;
  font-weight: var(--sakai-font-weight-semibold);
}

.teacher-assessments__embed-steps {
  margin: 0;
  padding-left: var(--sakai-space-5);
  display: grid;
  gap: var(--sakai-space-1);
  color: var(--sakai-text-color-secondary);
}

@media (min-width: 640px) {
  .teacher-assessments__form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.teacher-assessments__dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--sakai-space-3);
  margin-top: var(--sakai-space-4);
}

.teacher-assessments__confirm {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  line-height: var(--sakai-line-height-lg);
}

@media (max-width: 720px) {
  .teacher-assessments__row-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .teacher-assessments__dialog-actions {
    flex-wrap: wrap;
    justify-content: stretch;
  }

  .teacher-assessments__dialog-actions :deep(.ui-button) {
    flex: 1 1 auto;
  }

  .teacher-assessments__table {
    display: none;
  }

  .teacher-assessments__list {
    display: grid;
  }
}
</style>
