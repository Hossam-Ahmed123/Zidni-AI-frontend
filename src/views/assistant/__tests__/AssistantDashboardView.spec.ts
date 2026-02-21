import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import AssistantDashboardView from '../AssistantDashboardView.vue';

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}));

const authStoreMock: Record<string, any> = {
  assistantName: '',
  assistantPermissions: [] as string[]
};

const featuresStoreMock: Record<string, any> = {
  loading: false,
  loaded: false,
  featureError: null as string | null,
  hasAttemptedSecureLoad: false,
  ensureLoaded: vi.fn(),
  refresh: vi.fn(),
  listFeatureCodes: vi.fn(() => [])
};

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authStoreMock
}));

vi.mock('@/stores/features', () => ({
  useFeaturesStore: () => featuresStoreMock
}));

vi.mock('@/stores/teacherAssistants', () => ({
  ASSISTANT_PERMISSION_OPTIONS: []
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (params && typeof params.count !== 'undefined') {
        return `${key}:${params.count}`;
      }
      return key;
    }
  })
}));

describe('AssistantDashboardView', () => {
  const mountView = () =>
    mount(AssistantDashboardView, {
      global: {
        stubs: {
          ThemePage: {
            template: '<div><slot name="meta" /><slot /></div>'
          },
          UiCard: {
            template: '<div class="ui-card"><slot name="title" /><slot name="subtitle" /><slot /></div>'
          },
          UiButton: {
            template: '<button class="ui-button" @click="$emit(\'click\')"><slot /></button>'
          },
          UiIcon: {
            template: '<i class="ui-icon" />'
          },
          UiAlert: {
            template: '<div class="ui-alert"><slot /></div>'
          },
          UiSkeleton: {
            template: '<div class="ui-skeleton"></div>'
          }
        }
      }
    });

  beforeEach(() => {
    authStoreMock.assistantName = '';
    authStoreMock.assistantPermissions = [];

    featuresStoreMock.loading = false;
    featuresStoreMock.loaded = false;
    featuresStoreMock.featureError = null;
    featuresStoreMock.hasAttemptedSecureLoad = false;
    featuresStoreMock.ensureLoaded = vi.fn().mockResolvedValue(undefined);
    featuresStoreMock.refresh = vi.fn().mockResolvedValue(undefined);
    featuresStoreMock.listFeatureCodes = vi.fn(() => []);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows skeleton while initial feature load is pending', async () => {
    authStoreMock.assistantPermissions = ['students.view'];
    featuresStoreMock.loading = true;
    featuresStoreMock.loaded = false;
    featuresStoreMock.hasAttemptedSecureLoad = false;

    const wrapper = mountView();
    await nextTick();

    expect(featuresStoreMock.ensureLoaded).toHaveBeenCalled();
    expect(wrapper.find('.assistant-dashboard__links-loading').exists()).toBe(true);
    expect(wrapper.find('.assistant-dashboard__empty').exists()).toBe(false);
  });

  it('shows available quick links while other feature-gated links are pending', async () => {
    authStoreMock.assistantPermissions = ['courses.manage', 'students.view'];
    featuresStoreMock.loading = true;
    featuresStoreMock.loaded = false;
    featuresStoreMock.hasAttemptedSecureLoad = false;

    const wrapper = mountView();
    await nextTick();

    expect(wrapper.find('.assistant-dashboard__links-loading').exists()).toBe(true);
    const quickLinks = wrapper.findAll('.assistant-dashboard__link-item');
    expect(quickLinks).toHaveLength(1);
    expect(quickLinks[0].text()).toContain('assistant.dashboard.links.courses.title');
  });

  it('shows alert when links are hidden by disabled features', async () => {
    authStoreMock.assistantPermissions = ['students.view'];
    featuresStoreMock.loading = false;
    featuresStoreMock.loaded = true;
    featuresStoreMock.hasAttemptedSecureLoad = true;
    featuresStoreMock.listFeatureCodes = vi.fn(() => []);

    const wrapper = mountView();
    await nextTick();

    const alert = wrapper.find('.assistant-dashboard__links-alert');
    expect(alert.text()).toContain('assistant.dashboard.featuresDisabled:1');
    expect(alert.text()).toContain('assistant.dashboard.featuresDisabledListIntro');
    const disabledItems = wrapper.findAll('.assistant-dashboard__disabled-link');
    expect(disabledItems).toHaveLength(1);
    expect(disabledItems[0].text()).toContain(
      'assistant.dashboard.links.students.title'
    );
    expect(wrapper.find('.assistant-dashboard__empty-title').text()).toBe(
      'assistant.dashboard.featuresDisabledTitle'
    );
  });

  it('keeps permission shortcuts visible when feature load fails', async () => {
    authStoreMock.assistantPermissions = ['courses.manage'];
    featuresStoreMock.featureError = 'features.errors.loadFailed';
    featuresStoreMock.hasAttemptedSecureLoad = true;

    const wrapper = mountView();
    await nextTick();

    const quickLinks = wrapper.findAll('.assistant-dashboard__link-item');
    expect(quickLinks).toHaveLength(1);
    expect(quickLinks[0].text()).toContain('assistant.dashboard.links.courses.title');
    expect(wrapper.find('.assistant-dashboard__links-alert').text()).toContain(
      'assistant.dashboard.featuresLoadError'
    );
  });

  it('keeps shortcuts visible while secure features refresh after the first load', async () => {
    authStoreMock.assistantPermissions = ['students.view'];
    featuresStoreMock.loading = true;
    featuresStoreMock.loaded = true;
    featuresStoreMock.hasAttemptedSecureLoad = true;
    featuresStoreMock.listFeatureCodes = vi.fn(() => ['teacherRosterGroups']);

    const wrapper = mountView();
    await nextTick();

    expect(wrapper.find('.assistant-dashboard__links-loading').exists()).toBe(false);
    const quickLinks = wrapper.findAll('.assistant-dashboard__link-item');
    expect(quickLinks).toHaveLength(1);
    expect(quickLinks[0].text()).toContain('assistant.dashboard.links.students.title');
  });
});
