<template>
  <ThemePage :title="t('adminTeachers.title')" :subtitle="t('adminTeachers.subtitle')">
    <template #actions>
      <UiButton to="/admin/teachers/payments" variant="outline">
        {{ t('adminTeachers.actions.payments') }}
      </UiButton>
    </template>

    <section class="admin-teachers">
      <UiCard hover>
        <template #title>{{ t('adminTeachers.tableTitle') }}</template>
        <template #subtitle>{{ t('adminTeachers.tableSubtitle') }}</template>

        <UiAlert v-if="store.error" color="danger" variant="soft" class="admin-teachers__alert">
          {{ translateError(store.error) }}
        </UiAlert>

        <div class="admin-teachers__toolbar">
          <UiInput
            v-model="filters.search"
            :label="t('adminTeachers.filters.search')"
            :placeholder="t('adminTeachers.filters.searchPlaceholder')"
            start-icon="SearchOutlined"
            @keyup.enter="applyFilters"
          />

          <UiSelect
            :model-value="filters.status"
            :label="t('adminTeachers.filters.status')"
            @update:model-value="onStatusChange"
          >
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </UiSelect>

          <UiSelect
            :model-value="filters.plan"
            :label="t('adminTeachers.filters.plan')"
            @update:model-value="onPlanChange"
          >
            <option v-for="option in planOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </UiSelect>

          <UiButton variant="link" color="secondary" @click="resetFilters">
            {{ t('adminTeachers.filters.reset') }}
          </UiButton>

          <UiButton color="primary" class="admin-teachers__create" @click="openCreateDialog">
            {{ t('adminTeachers.actions.addTeacher') }}
          </UiButton>
        </div>

        <UiTable
          :headers="headers"
          :items="store.teachers"
          :loading="store.loadingTeachers"
          class="admin-teachers__table"
          :empty-text="t('adminTeachers.empty')"
        >
          <template #item.teacher="{ item }">
            <div class="admin-teachers__teacher">
              <span class="admin-teachers__teacher-name">{{ (item as any).name }}</span>
              <small class="admin-teachers__teacher-meta">
                {{ (item as any).slug }} · {{ (item as any).plan.toUpperCase() }}
                <template v-if="(item as any).subject"> · {{ (item as any).subject }}</template>
              </small>
            </div>
          </template>

          <template #item.usage="{ item }">
            <div class="admin-teachers__usage-summary">
              <template v-if="teacherUsageLoading[(item as any).id]">
                <small class="admin-teachers__usage-summary-text">{{ t('common.loading') }}</small>
              </template>
              <template v-else-if="teacherUsageMap[(item as any).id]">
                <div class="admin-teachers__usage-summary-tags">
                  <UiTag
                    size="sm"
                    :color="usageToneForStorage(teacherUsageMap[(item as any).id]!)"
                  >
                    {{ t('teacher.planUsageVideoStorage') }} {{ formatPercent(storagePercentForSummary(teacherUsageMap[(item as any).id]!)) }}
                  </UiTag>
                  <UiTag
                    size="sm"
                    :color="usageToneForStreaming(teacherUsageMap[(item as any).id]!)"
                  >
                    {{ t('teacher.planUsageStreamingMinutes') }} {{ formatPercent(streamingPercentForSummary(teacherUsageMap[(item as any).id]!)) }}
                  </UiTag>
                </div>
                <small class="admin-teachers__usage-summary-text admin-teachers__usage-summary-text--muted">
                  {{ formatCompactDuration(teacherUsageMap[(item as any).id]!.storageSecondsUsed) }}
                  /
                  {{
                    teacherUsageMap[(item as any).id]!.storageSecondsLimit !== null
                      ? formatCompactDuration(teacherUsageMap[(item as any).id]!.storageSecondsLimit!)
                      : t('teacher.planUsageUnlimited')
                  }}
                  ·
                  {{ formatCompactMinutes(teacherUsageMap[(item as any).id]!.streamingMinutesUsed) }}
                  /
                  {{
                    teacherUsageMap[(item as any).id]!.streamingMinutesLimit !== null
                      ? formatCompactMinutes(teacherUsageMap[(item as any).id]!.streamingMinutesLimit!)
                      : t('teacher.planUsageUnlimited')
                  }}
                </small>
              </template>
              <small v-else class="admin-teachers__usage-summary-text admin-teachers__usage-summary-text--muted">
                {{ t('adminTeachers.usage.empty') }}
              </small>
            </div>
          </template>

          <template #item.status="{ item }">
            <UiTag :color="(item as any).active ? 'success' : 'danger'">
              {{ (item as any).active ? t('adminTeachers.status.active') : t('adminTeachers.status.disabled') }}
            </UiTag>
          </template>

          <template #item.actions="{ item }">
            <div class="admin-teachers__actions">
              <UiButton size="sm" variant="link" @click="openDetail((item as any).id)">
                {{ t('adminTeachers.actions.manage') }}
              </UiButton>
              <UiButton size="sm" variant="link" color="danger" @click="confirmDeleteTeacher((item as any).id, (item as any).name)">
                {{ t('adminTeachers.actions.delete') }}
              </UiButton>
            </div>
          </template>
        </UiTable>
      </UiCard>
    </section>

    <UiDialog v-model="createDialog.open" :title="t('adminTeachers.create.title')" width="640px">
      <form class="admin-teachers__form" @submit.prevent="submitCreate">
        <UiInput
          v-model="createDialog.form.slug"
          :label="t('adminTeachers.create.slug')"
          :hint="t('teacher.slugInvalid')"
          :title="t('teacher.slugInvalid')"
          required
          minlength="5"
          pattern="^[a-z0-9-]{5,50}$"
        />
        <UiInput v-model="createDialog.form.name" :label="t('adminTeachers.create.name')" required />
        <UiInput v-model="createDialog.form.subject" :label="t('adminTeachers.create.subject')" />
        <UiSelect v-model="createDialog.form.phoneCountryCode" :label="t('adminTeachers.create.phoneCountryCode')" required>
          <option v-for="option in phoneCountryOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </UiSelect>
        <UiInput
          v-model="createDialog.form.phoneNumber"
          :label="t('adminTeachers.create.phoneNumber')"
          required
          inputmode="numeric"
          maxlength="20"
        />
        <UiSelect v-model="createDialog.form.plan" :label="t('adminTeachers.create.plan')">
          <option v-for="option in planOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </UiSelect>
        <UiInput v-model="createDialog.form.email" type="email" :label="t('adminTeachers.create.email')" required />
        <UiInput v-model="createDialog.form.password" type="password" :label="t('adminTeachers.create.password')" required />

        <div class="admin-teachers__dialog-actions">
          <UiButton type="button" variant="link" @click="closeCreateDialog">
            {{ t('common.cancel') }}
          </UiButton>
          <UiButton type="submit" color="primary" :loading="createDialog.submitting">
            {{ t('adminTeachers.create.submit') }}
          </UiButton>
        </div>
      </form>
    </UiDialog>

    <UiDialog
      v-model="detailDialog.open"
      :title="detailTitle"
      width="760px"
      @hide="closeDetail"
    >
      <div v-if="store.loadingTeacherDetail" class="admin-teachers__loading">
        <UiSkeleton v-for="n in 4" :key="n" height="32px" />
      </div>
      <div v-else-if="selectedTeacher" class="admin-teachers__detail">
        <UiAlert v-if="store.error" color="danger" variant="soft" class="admin-teachers__alert">
          {{ translateError(store.error) }}
        </UiAlert>

        <section class="admin-teachers__section">
          <header class="admin-teachers__section-header">
            <h3>{{ t('adminTeachers.detail.overview') }}</h3>
            <UiTag :color="teacherForm.active ? 'success' : 'danger'">
              {{ teacherForm.active ? t('adminTeachers.status.active') : t('adminTeachers.status.disabled') }}
            </UiTag>
          </header>
          <form class="admin-teachers__form" @submit.prevent="submitUpdateTeacher">
            <UiInput v-model="teacherForm.name" :label="t('adminTeachers.detail.name')" required />
            <UiInput v-model="teacherForm.subject" :label="t('adminTeachers.detail.subject')" />
            <UiSelect v-model="teacherForm.phoneCountryCode" :label="t('adminTeachers.detail.phoneCountryCode')" required>
              <option v-for="option in phoneCountryOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </UiSelect>
            <UiInput
              v-model="teacherForm.phoneNumber"
              :label="t('adminTeachers.detail.phoneNumber')"
              required
              inputmode="numeric"
              maxlength="20"
            />
            <UiSelect v-model="teacherForm.plan" :label="t('adminTeachers.detail.plan')">
              <option v-for="option in planOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </UiSelect>
            <UiSwitch v-model="teacherForm.active" :label="t('adminTeachers.detail.active')" />
            <UiSwitch
              v-model="teacherForm.studentMultiDeviceLoginEnabled"
              :label="t('adminTeachers.detail.studentMultiDeviceLoginEnabled')"
              :hint="t('adminTeachers.detail.studentMultiDeviceLoginHint')"
            />

            <div class="admin-teachers__dialog-actions">
              <UiButton type="submit" color="primary" :loading="detailDialog.submitting">
                {{ t('adminTeachers.detail.save') }}
              </UiButton>
            </div>
          </form>

          <form class="admin-teachers__form admin-teachers__form--inline" @submit.prevent="submitSlugUpdate">
            <UiInput
              v-model="slugForm"
              :label="t('adminTeachers.detail.slug')"
              :hint="t('teacher.slugInvalid')"
              :title="t('teacher.slugInvalid')"
              required
              minlength="5"
              pattern="^[a-z0-9-]{5,50}$"
            />
            <UiButton type="submit" variant="outline" :loading="detailDialog.slugSubmitting">
              {{ t('adminTeachers.detail.updateSlug') }}
            </UiButton>
          </form>

          <dl class="admin-teachers__meta">
            <div>
              <dt>{{ t('adminTeachers.detail.joined') }}</dt>
              <dd>{{ formatDate(selectedTeacher.joinDate) }}</dd>
            </div>
            <div>
              <dt>{{ t('adminTeachers.detail.studentCount') }}</dt>
              <dd>{{ selectedTeacher.studentCount }}</dd>
            </div>
            <div>
              <dt>{{ t('adminTeachers.detail.accountCount') }}</dt>
              <dd>{{ selectedTeacher.userAccountCount }}</dd>
            </div>
            <div>
              <dt>{{ t('adminTeachers.detail.deviceCount') }}</dt>
              <dd>{{ selectedTeacher.deviceCount }}</dd>
            </div>
          </dl>
        </section>

        <section class="admin-teachers__section">
          <header class="admin-teachers__section-header admin-teachers__section-header--stacked">
            <h3>{{ t('adminTeachers.usage.title') }}</h3>
            <p class="admin-teachers__section-subtitle">{{ t('adminTeachers.usage.subtitle') }}</p>
          </header>
          <UiAlert v-if="usageError" color="warning" variant="soft">
            {{ t('adminTeachers.usage.error') }}
          </UiAlert>
          <div v-else-if="usageLoading" class="admin-teachers__usage-skeleton">
            <UiSkeleton v-for="n in 3" :key="`usage-${n}`" height="72px" />
          </div>
          <div v-else-if="usageSummary" class="admin-teachers__usage">
            <div class="admin-teachers__usage-header">
              <span class="admin-teachers__usage-plan">
                {{ usageSummary.planName || usageSummary.planCode || t('teacher.planUsagePlanFallback') }}
              </span>
              <span class="admin-teachers__usage-meta">
                {{ t('teacher.planUsageMaxResolution') }}
                {{ usageSummary.maxResolutionHeight ? `${usageSummary.maxResolutionHeight}p` : t('teacher.planUsageUnlimited') }}
              </span>
              <span class="admin-teachers__usage-meta">
                {{ t('teacher.planUsageMaxDuration') }}
                {{
                  usageSummary.maxVideoDurationMinutes
                    ? formatMinutes(usageSummary.maxVideoDurationMinutes)
                    : t('teacher.planUsageDefault')
                }}
              </span>
            </div>

            <div class="admin-teachers__usage-item">
              <div class="admin-teachers__usage-label">{{ t('teacher.planUsageVideoStorage') }}</div>
              <UiProgressBar :value="storageUsagePercent" color="primary">
                <div class="admin-teachers__usage-progress">
                  <span>{{ formatDurationSeconds(usageSummary.storageSecondsUsed) }}</span>
                  <span>
                    /
                    {{
                      usageSummary.storageSecondsLimit !== null
                        ? formatDurationSeconds(usageSummary.storageSecondsLimit)
                        : t('teacher.planUsageUnlimited')
                    }}
                  </span>
                </div>
              </UiProgressBar>
            </div>

            <div class="admin-teachers__usage-item">
              <div class="admin-teachers__usage-label">{{ t('teacher.planUsageVideoStorageSize') }}</div>
              <UiProgressBar :value="storageSizeUsagePercent" color="secondary">
                <div class="admin-teachers__usage-progress">
                  <span>{{ formatBytes(usageSummary.storageBytesUsed) }}</span>
                  <span>
                    /
                    {{
                      usageSummary.storageBytesLimit !== null
                        ? formatBytes(usageSummary.storageBytesLimit)
                        : t('teacher.planUsageUnlimited')
                    }}
                  </span>
                </div>
              </UiProgressBar>
            </div>

            <div class="admin-teachers__usage-item">
              <div class="admin-teachers__usage-label">{{ t('teacher.planUsageStreamingMinutes') }}</div>
              <UiProgressBar :value="streamingUsagePercent" color="info">
                <div class="admin-teachers__usage-progress">
                  <span>{{ formatMinutes(usageSummary.streamingMinutesUsed) }}</span>
                  <span>
                    /
                    {{
                      usageSummary.streamingMinutesLimit !== null
                        ? formatMinutes(usageSummary.streamingMinutesLimit)
                        : t('teacher.planUsageUnlimited')
                    }}
                  </span>
                </div>
              </UiProgressBar>
            </div>
          </div>
          <p v-else class="admin-teachers__help">{{ t('adminTeachers.usage.empty') }}</p>
        </section>

        <section class="admin-teachers__section">
          <header class="admin-teachers__section-header">
            <h3>{{ t('adminTeachers.overrides.title') }}</h3>
            <UiSwitch v-model="usageOverridesEnabled" :label="t('adminTeachers.overrides.switch')" />
          </header>
          <UiAlert color="info" variant="soft">
            {{ t('adminTeachers.overrides.alert') }}
          </UiAlert>
          <div v-if="usageOverridesEnabled" class="admin-teachers__form admin-teachers__usage-overrides">
            <UiInput
              v-model.number="usageOverridesForm.storageWarningPercent"
              type="number"
              min="0"
              max="100"
              :label="t('adminTeachers.overrides.storageWarning')"
              placeholder="e.g. 80"
            />
            <UiInput
              v-model.number="usageOverridesForm.storageCriticalPercent"
              type="number"
              min="0"
              max="100"
              :label="t('adminTeachers.overrides.storageCritical')"
              placeholder="e.g. 90"
            />
            <UiInput
              v-model.number="usageOverridesForm.streamingWarningPercent"
              type="number"
              min="0"
              max="100"
              :label="t('adminTeachers.overrides.streamingWarning')"
              placeholder="e.g. 80"
            />
            <UiInput
              v-model.number="usageOverridesForm.streamingCriticalPercent"
              type="number"
              min="0"
              max="100"
              :label="t('adminTeachers.overrides.streamingCritical')"
              placeholder="e.g. 90"
            />
            <UiInput
              v-model.number="usageOverridesForm.storageGraceDays"
              type="number"
              min="0"
              max="31"
              :label="t('adminTeachers.overrides.storageGrace')"
              placeholder="e.g. 7"
            />
            <UiInput
              v-model.number="usageOverridesForm.streamingGraceDays"
              type="number"
              min="0"
              max="31"
              :label="t('adminTeachers.overrides.streamingGrace')"
              placeholder="e.g. 7"
            />
          </div>
          <p v-else class="admin-teachers__help">{{ t('adminTeachers.overrides.help') }}</p>
        </section>

        <section class="admin-teachers__section">
          <header class="admin-teachers__section-header">
            <h3>{{ t('adminTeachers.accounts.title') }}</h3>
            <UiButton
              v-if="!selectedTeacher.accounts || selectedTeacher.accounts.length === 0"
              size="sm"
              variant="outline"
              @click="openAccountCreate"
            >
              {{ t('adminTeachers.accounts.add') }}
            </UiButton>
          </header>
          <div v-if="selectedTeacher.accounts && selectedTeacher.accounts.length" class="admin-teachers__accounts">
            <article v-for="account in selectedTeacher.accounts" :key="account.id" class="admin-teachers__account">
              <div class="admin-teachers__account-info">
                <h4>{{ account.email }}</h4>
                <small>{{ lastActivity(account) }}</small>
              </div>
              <div class="admin-teachers__account-actions">
                <UiSwitch
                  :model-value="account.enabled"
                  :label="account.enabled ? t('adminTeachers.accounts.enabled') : t('adminTeachers.accounts.disabled')"
                  @update:model-value="toggleAccount(account, $event)"
                />
                <UiButton size="sm" variant="link" @click="openAccountEdit(account)">
                  {{ t('adminTeachers.accounts.edit') }}
                </UiButton>
                <UiButton size="sm" variant="link" color="warning" @click="sendAccountReset(account)">
                  {{ t('adminTeachers.accounts.reset') }}
                </UiButton>
                <UiButton size="sm" variant="link" color="danger" @click="confirmDeleteAccount(account)">
                  {{ t('adminTeachers.accounts.delete') }}
                </UiButton>
              </div>
            </article>
          </div>
          <p v-else class="admin-teachers__accounts-empty">
            {{ t('adminTeachers.accounts.empty') }}
          </p>
        </section>

        <AdminTeacherAssistantsPanel :teacher-id="selectedTeacher.id" />

        <footer class="admin-teachers__danger-zone">
          <UiButton color="danger" variant="outline" @click="confirmDeleteTeacher(selectedTeacher.id, selectedTeacher.name)">
            {{ t('adminTeachers.detail.deleteTeacher') }}
          </UiButton>
        </footer>
      </div>
      <div v-else class="admin-teachers__empty-detail">
        {{ t('adminTeachers.detail.empty') }}
      </div>
    </UiDialog>

    <UiDialog v-model="accountCreateDialog.open" :title="t('adminTeachers.accounts.addTitle')" width="480px">
      <form class="admin-teachers__form" @submit.prevent="submitCreateAccount">
        <UiInput v-model="accountCreateDialog.email" type="email" :label="t('adminTeachers.accounts.email')" required />
        <UiInput v-model="accountCreateDialog.password" type="password" :label="t('adminTeachers.accounts.password')" required />
        <div class="admin-teachers__dialog-actions">
          <UiButton type="button" variant="link" @click="closeAccountCreate">
            {{ t('common.cancel') }}
          </UiButton>
          <UiButton type="submit" color="primary" :loading="accountCreateDialog.submitting">
            {{ t('adminTeachers.accounts.addSubmit') }}
          </UiButton>
        </div>
      </form>
    </UiDialog>

    <UiDialog v-model="accountEditDialog.open" :title="t('adminTeachers.accounts.editTitle')" width="480px">
      <form class="admin-teachers__form" @submit.prevent="submitAccountEdit">
        <UiInput v-model="accountEditDialog.email" type="email" :label="t('adminTeachers.accounts.email')" required />
        <UiInput v-model="accountEditDialog.password" type="password" :label="t('adminTeachers.accounts.newPassword')" />
        <p class="admin-teachers__help">{{ t('adminTeachers.accounts.passwordHelp') }}</p>
        <div class="admin-teachers__dialog-actions">
          <UiButton type="button" variant="link" @click="closeAccountEdit">
            {{ t('common.cancel') }}
          </UiButton>
          <UiButton type="submit" color="primary" :loading="accountEditDialog.submitting">
            {{ t('adminTeachers.accounts.editSubmit') }}
          </UiButton>
        </div>
      </form>
    </UiDialog>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useAdminStore } from '@/stores/admin';
import { useToast } from '@/composables/useToast';
import UiCard from '@/components/ui/UiCard.vue';
import UiTable, { type UiTableHeader } from '@/components/ui/UiTable.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiSelect, { type SelectValue } from '@/components/ui/UiSelect.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiTag from '@/components/ui/UiTag.vue';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiSkeleton from '@/components/ui/UiSkeleton.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiSwitch from '@/components/ui/UiSwitch.vue';
import UiProgressBar from '@/components/ui/UiProgressBar.vue';
import AdminTeacherAssistantsPanel from '@/components/admin/AdminTeacherAssistantsPanel.vue';
import { formatDateTime } from '@/utils/formatters';
import { fetchTeacherVideoUsageSummary } from '@/services/admin';
import type { TeacherAccount, TeacherUsageOverrides } from '@/services/admin';
import type { TeacherVideoUsageSummary } from '@/services/teacherUsage';
import { PHONE_COUNTRY_CODES } from '@/constants/countryCodes';
import { normalizePhoneInput, PhoneNumberValidationError } from '@/utils/phoneNumber';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useAdminStore();
const toast = useToast();

const SLUG_PATTERN = /^[a-z0-9-]{5,50}$/;
const normalizeSlug = (value: string) =>
  (value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

const filters = reactive({
  status: '',
  plan: '',
  search: ''
});

const headers = computed<UiTableHeader[]>(() => [
  { key: 'teacher', title: t('adminTeachers.columns.teacher') },
  { key: 'plan', title: t('adminTeachers.columns.plan') },
  { key: 'usage', title: t('adminTeachers.columns.usage'), sortable: false },
  { key: 'status', title: t('adminTeachers.columns.status') },
  { key: 'actions', title: t('adminTeachers.columns.actions'), sortable: false, align: 'end' }
]);

const statusOptions = computed(() => [
  { value: '', label: t('adminTeachers.filters.statusAll') },
  { value: 'active', label: t('adminTeachers.status.active') },
  { value: 'disabled', label: t('adminTeachers.status.disabled') }
]);

const planOptions = computed(() => [
  { value: '', label: t('adminTeachers.filters.planAll') },
  { value: 'free', label: t('admin.planOptions.free') },
  { value: 'basic', label: t('admin.planOptions.basic') },
  { value: 'medim', label: t('admin.planOptions.medim') },
  { value: 'pro', label: t('admin.planOptions.pro') },
  { value: 'enterprise', label: t('admin.planOptions.enterprise') }
]);

const createDialog = reactive({
  open: false,
  submitting: false,
  form: {
    slug: '',
    name: '',
    subject: '',
    phoneCountryCode: '+1',
    phoneNumber: '',
    plan: 'free',
    email: '',
    password: ''
  }
});

const detailDialog = reactive({
  open: false,
  submitting: false,
  slugSubmitting: false
});

const accountCreateDialog = reactive({
  open: false,
  submitting: false,
  email: '',
  password: ''
});

const accountEditDialog = reactive({
  open: false,
  submitting: false,
  accountId: null as number | null,
  email: '',
  password: '',
  originalEmail: ''
});

const teacherForm = reactive({
  name: '',
  subject: '',
  phoneCountryCode: '+1',
  phoneNumber: '',
  plan: 'free',
  active: true,
  studentMultiDeviceLoginEnabled: false
});

const slugForm = ref('');
const usageOverridesEnabled = ref(false);
const usageOverridesForm = reactive({
  storageWarningPercent: null as number | null,
  storageCriticalPercent: null as number | null,
  streamingWarningPercent: null as number | null,
  streamingCriticalPercent: null as number | null,
  storageGraceDays: null as number | null,
  streamingGraceDays: null as number | null
});
const usageSummary = ref<TeacherVideoUsageSummary | null>(null);
const usageLoading = ref(false);
const usageError = ref(false);
const teacherUsageMap = reactive<Record<number, TeacherVideoUsageSummary>>({});
const teacherUsageLoading = reactive<Record<number, boolean>>({});

const selectedTeacher = computed(() => store.selectedTeacher);
const detailTitle = computed(() => selectedTeacher.value?.name || t('adminTeachers.detail.title'));
const phoneCountryOptions = computed(() =>
  PHONE_COUNTRY_CODES.map((option) => ({
    value: option.value,
    label: `${option.value} · ${t(option.nameKey)}`
  }))
);

watch(
  () => createDialog.form.slug,
  (value) => {
    const normalized = normalizeSlug(value);
    if (normalized !== value) {
      createDialog.form.slug = normalized;
    }
  }
);

watch(slugForm, (value) => {
  const normalized = normalizeSlug(value);
  if (normalized !== value) {
    slugForm.value = normalized;
  }
});

watch(selectedTeacher, (teacher) => {
  if (!teacher) {
    teacherForm.name = '';
    teacherForm.subject = '';
    teacherForm.phoneCountryCode = '+1';
    teacherForm.phoneNumber = '';
    teacherForm.plan = 'free';
    teacherForm.active = true;
    teacherForm.studentMultiDeviceLoginEnabled = false;
    slugForm.value = '';
    usageOverridesEnabled.value = false;
    resetUsageOverridesForm();
    usageSummary.value = null;
    usageError.value = false;
    usageLoading.value = false;
    return;
  }
  teacherForm.name = teacher.name ?? '';
  teacherForm.subject = teacher.subject ?? '';
  teacherForm.phoneCountryCode = teacher.phoneCountryCode || '+1';
  teacherForm.phoneNumber = teacher.phoneNumber || '';
  teacherForm.plan = teacher.plan ?? 'free';
  teacherForm.active = teacher.active;
  teacherForm.studentMultiDeviceLoginEnabled = Boolean(teacher.studentMultiDeviceLoginEnabled);
  slugForm.value = teacher.slug;
  const overrides = teacher.usageOverrides ?? null;
  usageOverridesEnabled.value = hasUsageOverrides(overrides);
  applyUsageOverridesForm(overrides);
  void loadTeacherUsage(teacher.id);
});

watch(
  () => store.teachers.map((teacher) => teacher.id),
  (teacherIds) => {
    for (const teacherId of teacherIds) {
      if (teacherUsageMap[teacherId] || teacherUsageLoading[teacherId]) {
        continue;
      }
      void loadTeacherUsageSummaryForTable(teacherId);
    }
  },
  { immediate: true }
);

onMounted(async () => {
  if (!store.teachers.length) {
    await store.loadTeachers().catch(() => {
      /* ignore */
    });
  }
  const teacherId = typeof route.query.teacherId === 'string' ? Number(route.query.teacherId) : 0;
  if (teacherId > 0) {
    await openDetail(teacherId);
  }
});

watch(
  () => route.query.teacherId,
  async (value) => {
    const teacherId = typeof value === 'string' ? Number(value) : 0;
    if (teacherId <= 0 || !Number.isFinite(teacherId)) {
      return;
    }
    if (detailDialog.open && store.selectedTeacher?.id === teacherId) {
      return;
    }
    await openDetail(teacherId);
  }
);

async function applyFilters() {
  await store
    .loadTeachers({
      search: filters.search || undefined,
      status: filters.status ? (filters.status as 'active' | 'disabled') : undefined,
      plan: filters.plan || undefined
    })
    .catch(() => {
      toast.error(translateError(store.error));
    });
}

function onStatusChange(value: SelectValue) {
  filters.status = String(value || '');
  applyFilters();
}

function onPlanChange(value: SelectValue) {
  filters.plan = String(value || '');
  applyFilters();
}

function resetFilters() {
  filters.status = '';
  filters.plan = '';
  filters.search = '';
  applyFilters();
}

function openCreateDialog() {
  createDialog.open = true;
  createDialog.form = {
    slug: '',
    name: '',
    subject: '',
    phoneCountryCode: '+1',
    phoneNumber: '',
    plan: 'free',
    email: '',
    password: ''
  };
}

function closeCreateDialog() {
  createDialog.open = false;
}

async function submitCreate() {
  if (createDialog.submitting) {
    return;
  }
  let normalizedPhone;
  try {
    normalizedPhone = normalizePhoneInput(createDialog.form.phoneCountryCode, createDialog.form.phoneNumber);
  } catch (error) {
    if (error instanceof PhoneNumberValidationError) {
      toast.error(t('adminTeachers.errors.phoneInvalid'));
    } else {
      toast.error(translateError(store.error));
    }
    return;
  }
  const normalizedSlug = normalizeSlug(createDialog.form.slug);
  if (!SLUG_PATTERN.test(normalizedSlug)) {
    toast.error(t('teacher.slugInvalid'));
    createDialog.form.slug = normalizedSlug;
    return;
  }

  createDialog.submitting = true;
  try {
    const payload = {
      slug: normalizedSlug,
      name: createDialog.form.name.trim(),
      subject: createDialog.form.subject.trim() || undefined,
      phoneCountryCode: normalizedPhone.phoneCountryCode,
      phoneNumber: normalizedPhone.phoneNumber,
      plan: createDialog.form.plan || undefined,
      email: createDialog.form.email.trim(),
      password: createDialog.form.password
    };
    createDialog.form.phoneCountryCode = normalizedPhone.phoneCountryCode;
    createDialog.form.phoneNumber = normalizedPhone.phoneNumber;
    const created = await store.createTeacher(payload);
    toast.success(t('adminTeachers.notifications.created', { name: created.name }));
    closeCreateDialog();
    await applyFilters();
    if (created?.id) {
      openDetail(created.id);
    }
  } catch (error) {
    toast.error(translateError(store.error));
  } finally {
    createDialog.submitting = false;
  }
}

async function openDetail(id: number) {
  await router.replace({
    name: 'admin-teachers',
    query: { ...route.query, teacherId: String(id) }
  });
  detailDialog.open = true;
  detailDialog.submitting = false;
  detailDialog.slugSubmitting = false;
  await store.selectTeacher(id).catch(() => {
    toast.error(translateError(store.error));
  });
}

function closeDetail() {
  const nextQuery = { ...route.query } as Record<string, unknown>;
  delete nextQuery.teacherId;
  void router.replace({ name: 'admin-teachers', query: nextQuery });
  detailDialog.open = false;
  store.selectedTeacher = null;
  usageSummary.value = null;
  usageError.value = false;
  usageLoading.value = false;
}

async function submitUpdateTeacher() {
  if (!selectedTeacher.value) {
    return;
  }
  let normalizedPhone;
  try {
    normalizedPhone = normalizePhoneInput(teacherForm.phoneCountryCode, teacherForm.phoneNumber);
  } catch (error) {
    if (error instanceof PhoneNumberValidationError) {
      toast.error(t('adminTeachers.errors.phoneInvalid'));
    } else {
      toast.error(translateError(store.error));
    }
    return;
  }
  detailDialog.submitting = true;
  try {
    await store.updateTeacher({
      name: teacherForm.name.trim(),
      subject: teacherForm.subject.trim() || undefined,
      phoneCountryCode: normalizedPhone.phoneCountryCode,
      phoneNumber: normalizedPhone.phoneNumber,
      plan: teacherForm.plan,
      active: teacherForm.active,
      studentMultiDeviceLoginEnabled: teacherForm.studentMultiDeviceLoginEnabled,
      usageOverrides: buildUsageOverridesPayload()
    });
    teacherForm.phoneCountryCode = normalizedPhone.phoneCountryCode;
    teacherForm.phoneNumber = normalizedPhone.phoneNumber;
    toast.success(t('adminTeachers.notifications.updated', { name: teacherForm.name }));
  } catch (error) {
    toast.error(translateError(store.error));
  } finally {
    detailDialog.submitting = false;
  }
}

async function submitSlugUpdate() {
  if (!selectedTeacher.value || !slugForm.value) {
    return;
  }
  const normalizedSlug = normalizeSlug(slugForm.value);
  if (!SLUG_PATTERN.test(normalizedSlug)) {
    toast.error(t('teacher.slugInvalid'));
    slugForm.value = normalizedSlug;
    return;
  }

  detailDialog.slugSubmitting = true;
  try {
    slugForm.value = normalizedSlug;
    await store.updateSlug(normalizedSlug);
    toast.success(t('adminTeachers.notifications.slugUpdated'));
    await applyFilters();
  } catch (error) {
    toast.error(translateError(store.error));
  } finally {
    detailDialog.slugSubmitting = false;
  }
}

function formatDate(value?: string | null) {
  if (!value) {
    return '—';
  }
  return formatDateTime(value);
}

async function loadTeacherUsage(teacherId: number) {
  usageLoading.value = true;
  usageError.value = false;
  try {
    const summary = await fetchTeacherVideoUsageSummary(teacherId);
    usageSummary.value = summary;
    teacherUsageMap[teacherId] = summary;
  } catch {
    usageSummary.value = null;
    usageError.value = true;
  } finally {
    usageLoading.value = false;
  }
}

async function loadTeacherUsageSummaryForTable(teacherId: number) {
  teacherUsageLoading[teacherId] = true;
  try {
    teacherUsageMap[teacherId] = await fetchTeacherVideoUsageSummary(teacherId);
  } catch {
    delete teacherUsageMap[teacherId];
  } finally {
    teacherUsageLoading[teacherId] = false;
  }
}

const formatNumber = (value: number) => new Intl.NumberFormat().format(Math.max(0, Math.round(value)));

const formatMinutes = (value: number) => `${formatNumber(value)} ${t('teacher.planUsageMinuteShort')}`;

const formatCompactMinutes = (value: number) => `${formatNumber(value)} ${t('teacher.planUsageMinuteShort')}`;

const formatDurationSeconds = (seconds: number) => {
  const safe = Math.max(0, Math.round(seconds));
  const totalMinutes = Math.round(safe / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${formatNumber(hours)}${t('teacher.planUsageHourShort')} ${formatNumber(minutes)}${t('teacher.planUsageMinuteShort')}`;
  }
  return `${formatNumber(minutes)}${t('teacher.planUsageMinuteShort')}`;
};

const formatCompactDuration = (seconds: number) => {
  const safe = Math.max(0, Math.round(seconds));
  const totalMinutes = Math.round(safe / 60);
  const hours = Math.floor(totalMinutes / 60);
  if (hours > 0) {
    return `${formatNumber(hours)}${t('teacher.planUsageHourShort')}`;
  }
  return `${formatNumber(totalMinutes)}${t('teacher.planUsageMinuteShort')}`;
};

const formatBytes = (bytes: number) => {
  const safe = Math.max(0, bytes);
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = safe;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  const rounded = value >= 10 || index === 0 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${new Intl.NumberFormat().format(rounded)} ${units[index]}`;
};

function calculateUsagePercent(used: number, limit: number | null | undefined) {
  if (limit == null || limit <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, (used / limit) * 100));
}

function resolveThreshold(value: number | null | undefined, fallback: number) {
  if (value == null || Number.isNaN(value)) {
    return fallback;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatPercent(value: number) {
  return `${Math.round(Math.max(0, Math.min(100, value)))}%`;
}

function usageTone(percent: number, warningThreshold: number, criticalThreshold: number) {
  if (percent >= 100) {
    return 'danger' as const;
  }
  if (percent >= criticalThreshold) {
    return 'danger' as const;
  }
  if (percent >= warningThreshold) {
    return 'warning' as const;
  }
  return 'success' as const;
}

function storagePercentForSummary(summary: TeacherVideoUsageSummary) {
  return calculateUsagePercent(summary.storageSecondsUsed, summary.storageSecondsLimit);
}

function streamingPercentForSummary(summary: TeacherVideoUsageSummary) {
  return calculateUsagePercent(summary.streamingMinutesUsed, summary.streamingMinutesLimit);
}

function usageToneForStorage(summary: TeacherVideoUsageSummary) {
  return usageTone(
    storagePercentForSummary(summary),
    resolveThreshold(summary.storageWarningPercent, 80),
    resolveThreshold(summary.storageCriticalPercent, 90)
  );
}

function usageToneForStreaming(summary: TeacherVideoUsageSummary) {
  return usageTone(
    streamingPercentForSummary(summary),
    resolveThreshold(summary.streamingWarningPercent, 80),
    resolveThreshold(summary.streamingCriticalPercent, 90)
  );
}

const storageUsagePercent = computed(() =>
  usageSummary.value ? calculateUsagePercent(usageSummary.value.storageSecondsUsed, usageSummary.value.storageSecondsLimit) : 0
);

const storageSizeUsagePercent = computed(() =>
  usageSummary.value ? calculateUsagePercent(usageSummary.value.storageBytesUsed, usageSummary.value.storageBytesLimit) : 0
);

const streamingUsagePercent = computed(() =>
  usageSummary.value ? calculateUsagePercent(usageSummary.value.streamingMinutesUsed, usageSummary.value.streamingMinutesLimit) : 0
);

function lastActivity(account: TeacherAccount) {
  if (!account.lastActivity) {
    return t('adminTeachers.accounts.noActivity');
  }
  return t('adminTeachers.accounts.lastActive', { date: formatDateTime(account.lastActivity) });
}

function openAccountCreate() {
  accountCreateDialog.open = true;
  accountCreateDialog.email = '';
  accountCreateDialog.password = '';
}

function closeAccountCreate() {
  accountCreateDialog.open = false;
}

async function submitCreateAccount() {
  if (!accountCreateDialog.email || !accountCreateDialog.password) {
    return;
  }
  accountCreateDialog.submitting = true;
  try {
    await store.createTeacherAccount({
      email: accountCreateDialog.email.trim(),
      password: accountCreateDialog.password
    });
    toast.success(t('adminTeachers.notifications.accountCreated'));
    closeAccountCreate();
  } catch (error) {
    toast.error(translateError(store.error));
  } finally {
    accountCreateDialog.submitting = false;
  }
}

function openAccountEdit(account: TeacherAccount) {
  accountEditDialog.open = true;
  accountEditDialog.accountId = account.id;
  accountEditDialog.email = account.email;
  accountEditDialog.originalEmail = account.email;
  accountEditDialog.password = '';
}

function closeAccountEdit() {
  accountEditDialog.open = false;
  accountEditDialog.accountId = null;
  accountEditDialog.email = '';
  accountEditDialog.password = '';
  accountEditDialog.originalEmail = '';
}

async function submitAccountEdit() {
  if (!selectedTeacher.value || accountEditDialog.accountId == null) {
    return;
  }
  const payload: { email?: string; password?: string } = {};
  const normalizedEmail = accountEditDialog.email.trim();
  if (normalizedEmail && normalizedEmail !== accountEditDialog.originalEmail) {
    payload.email = normalizedEmail;
  }
  if (accountEditDialog.password && accountEditDialog.password.trim().length > 0) {
    payload.password = accountEditDialog.password.trim();
  }
  if (!payload.email && !payload.password) {
    closeAccountEdit();
    return;
  }
  accountEditDialog.submitting = true;
  try {
    await store.updateTeacherAccountCredentials(accountEditDialog.accountId, payload);
    toast.success(t('adminTeachers.notifications.accountUpdated'));
    closeAccountEdit();
  } catch (error) {
    toast.error(translateError(store.error));
  } finally {
    accountEditDialog.submitting = false;
  }
}

async function toggleAccount(account: TeacherAccount, enabled: boolean) {
  if (!selectedTeacher.value) {
    return;
  }
  const previous = account.enabled;
  await store.updateAccount(account.id, enabled).catch(() => {
    toast.error(translateError(store.error));
    store.applyAccountUpdate({ ...account, enabled: previous });
  });
}

async function sendAccountReset(account: TeacherAccount) {
  await store
    .resetAccount(account.id)
    .then(() => {
      toast.success(t('adminTeachers.notifications.accountReset'));
    })
    .catch(() => {
      toast.error(translateError(store.error));
    });
}

async function confirmDeleteAccount(account: TeacherAccount) {
  if (!window.confirm(t('adminTeachers.accounts.confirmDelete', { email: account.email }))) {
    return;
  }
  await store.deleteTeacherAccount(account.id).then(() => {
    toast.success(t('adminTeachers.notifications.accountDeleted'));
  }).catch(() => {
    toast.error(translateError(store.error));
  });
}

async function confirmDeleteTeacher(id: number, name: string) {
  if (!window.confirm(t('adminTeachers.confirmDeleteTeacher', { name }))) {
    return;
  }
  await store.deleteTeacher(id).then(() => {
    toast.success(t('adminTeachers.notifications.deleted', { name }));
    closeDetail();
    applyFilters();
  }).catch(() => {
    toast.error(translateError(store.error));
  });
}

function translateError(code: string | null | undefined) {
  if (!code) {
    return t('adminTeachers.errors.generic');
  }
  const key = `errors.${code}`;
  const translated = t(key);
  return translated === key ? t('adminTeachers.errors.generic') : translated;
}

function hasUsageOverrides(overrides?: TeacherUsageOverrides | null) {
  if (!overrides) {
    return false;
  }
  return Object.values(overrides).some((value) => value !== null && value !== undefined);
}

function resetUsageOverridesForm() {
  usageOverridesForm.storageWarningPercent = null;
  usageOverridesForm.storageCriticalPercent = null;
  usageOverridesForm.streamingWarningPercent = null;
  usageOverridesForm.streamingCriticalPercent = null;
  usageOverridesForm.storageGraceDays = null;
  usageOverridesForm.streamingGraceDays = null;
}

function applyUsageOverridesForm(overrides?: TeacherUsageOverrides | null) {
  if (!overrides) {
    resetUsageOverridesForm();
    return;
  }
  usageOverridesForm.storageWarningPercent = overrides.storageWarningPercent ?? null;
  usageOverridesForm.storageCriticalPercent = overrides.storageCriticalPercent ?? null;
  usageOverridesForm.streamingWarningPercent = overrides.streamingWarningPercent ?? null;
  usageOverridesForm.streamingCriticalPercent = overrides.streamingCriticalPercent ?? null;
  usageOverridesForm.storageGraceDays = overrides.storageGraceDays ?? null;
  usageOverridesForm.streamingGraceDays = overrides.streamingGraceDays ?? null;
}

function normalizeOverrideValue(value: number | null) {
  if (value === null || value === undefined) {
    return null;
  }
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : null;
}

function buildUsageOverridesPayload(): TeacherUsageOverrides | null {
  if (!usageOverridesEnabled.value) {
    return {
      storageWarningPercent: null,
      storageCriticalPercent: null,
      streamingWarningPercent: null,
      streamingCriticalPercent: null,
      storageGraceDays: null,
      streamingGraceDays: null
    };
  }
  return {
    storageWarningPercent: normalizeOverrideValue(usageOverridesForm.storageWarningPercent),
    storageCriticalPercent: normalizeOverrideValue(usageOverridesForm.storageCriticalPercent),
    streamingWarningPercent: normalizeOverrideValue(usageOverridesForm.streamingWarningPercent),
    streamingCriticalPercent: normalizeOverrideValue(usageOverridesForm.streamingCriticalPercent),
    storageGraceDays: normalizeOverrideValue(usageOverridesForm.storageGraceDays),
    streamingGraceDays: normalizeOverrideValue(usageOverridesForm.streamingGraceDays)
  };
}
</script>

<style scoped>
.admin-teachers {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-6);
}

:deep(.theme-page__title) {
  font-size: 2.25rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--sakai-primary) 0%, var(--sakai-primary-700) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: var(--sakai-space-1);
}

.admin-teachers__alert {
  margin-bottom: var(--sakai-space-4);
}

.admin-teachers__toolbar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--sakai-space-4);
  align-items: end;
  margin-bottom: var(--sakai-space-5);
}

.admin-teachers__teacher {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.admin-teachers__teacher-name {
  font-weight: 600;
  color: var(--sakai-text-color);
}

.admin-teachers__teacher-meta {
  color: var(--sakai-text-color-secondary);
}

.admin-teachers__actions {
  display: flex;
  gap: var(--sakai-space-2);
  justify-content: flex-end;
}

.admin-teachers__usage-summary {
  display: grid;
  gap: 0.35rem;
  min-width: 12rem;
}

.admin-teachers__usage-summary-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.admin-teachers__usage-summary-text {
  color: var(--sakai-text-color);
  line-height: 1.35;
}

.admin-teachers__usage-summary-text--muted {
  color: var(--sakai-text-color-secondary);
}

.admin-teachers__section {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
  margin-bottom: var(--sakai-space-6);
}

.admin-teachers__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-3);
  margin-bottom: var(--sakai-space-2);
}

.admin-teachers__section-header--stacked {
  align-items: flex-start;
  flex-direction: column;
}

.admin-teachers__section-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.admin-teachers__section-subtitle {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  font-size: 0.92rem;
}

.admin-teachers__form {
  display: grid;
  gap: var(--sakai-space-4);
}

.admin-teachers__usage-overrides {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.admin-teachers__form--inline {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--sakai-space-3);
  align-items: end;
}

.admin-teachers__dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--sakai-space-3);
  margin-top: var(--sakai-space-4);
}

.admin-teachers__loading {
  display: grid;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-6);
}

.admin-teachers__meta {
  display: grid;
  gap: var(--sakai-space-4);
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.admin-teachers__meta dt {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--sakai-text-color-tertiary);
  font-weight: 700;
  letter-spacing: 0.05em;
}

.admin-teachers__meta dd {
  margin: 0.125rem 0 0;
  font-weight: 600;
  color: var(--sakai-text-color);
}

.admin-teachers__usage-skeleton,
.admin-teachers__usage {
  display: grid;
  gap: var(--sakai-space-4);
}

.admin-teachers__usage-header {
  display: grid;
  gap: 0.35rem;
}

.admin-teachers__usage-plan {
  font-size: 1rem;
  font-weight: 700;
}

.admin-teachers__usage-meta {
  color: var(--sakai-text-color-secondary);
  font-size: 0.92rem;
}

.admin-teachers__usage-item {
  display: grid;
  gap: 0.5rem;
}

.admin-teachers__usage-label {
  font-weight: 600;
}

.admin-teachers__usage-progress {
  display: flex;
  justify-content: space-between;
  gap: var(--sakai-space-3);
  width: 100%;
}

.admin-teachers__accounts {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
}

.admin-teachers__account {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--sakai-space-4);
  padding: var(--sakai-space-4);
  background: var(--sakai-surface-ground);
  border-radius: var(--sakai-border-radius-xl);
  border: 1px solid var(--sakai-border-color);
  transition: border-color 0.2s;
}

.admin-teachers__account:hover {
  border-color: var(--sakai-primary-300);
}

.admin-teachers__account-info h4 {
  margin: 0;
  font-size: 1.05rem;
}

.admin-teachers__account-info small {
  color: var(--sakai-text-color-tertiary);
}

.admin-teachers__account-actions {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-3);
  flex-wrap: wrap;
  justify-content: flex-end;
}

.admin-teachers__danger-zone {
  display: flex;
  justify-content: flex-end;
  padding-top: var(--sakai-space-5);
  border-top: 1px solid var(--sakai-border-color);
}

.admin-teachers__empty-detail {
  color: var(--sakai-text-color-tertiary);
  text-align: center;
  padding: var(--sakai-space-10);
  font-style: italic;
}

.admin-teachers__help {
  margin: 0;
  font-size: 0.875rem;
  color: var(--sakai-text-color-tertiary);
}
</style>
