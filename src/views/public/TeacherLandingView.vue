<template>
  <template v-if="landing && localeReady">
    <component :is="currentTemplateComponent" :data="pageData">
    <div
      class="teacher-landing__wrapper"
      :class="[`teacher-landing__wrapper--${currentTemplate}`, { 'teacher-landing__wrapper--hide-header': hideHeader }]"
      :dir="pageDirection"
      :lang="activeLocale"
    >
      <div class="teacher-landing__background" aria-hidden="true"></div>
      <div class="teacher-landing__halo teacher-landing__halo--one" aria-hidden="true" />
      <div class="teacher-landing__halo teacher-landing__halo--two" aria-hidden="true" />
      <div class="teacher-landing__halo teacher-landing__halo--three" aria-hidden="true" />
      <ThemeProvider :style="landingThemeStyle">
        <header class="teacher-landing__header" :class="{ 'teacher-landing__header--compact': isHeaderCompact }">
          <div class="teacher-landing__header-inner teacher-landing__container">
            <div class="teacher-landing__brand">
              <div class="teacher-landing__brand-avatar">
                <img
                  v-if="brandAvatarUrl"
                  :src="brandAvatarUrl"
                  :alt="landing.teacher.displayName || landing.teacher.slug"
                  loading="lazy"
                  decoding="async"
                  fetchpriority="low"
                  @error="handleBrandAvatarError"
                />
                <span v-else class="teacher-landing__brand-avatar-fallback">
                  {{ brandInitials }}
                </span>
              </div>
              <span class="teacher-landing__brand-name">{{ landing.teacher.displayName }}</span>
              <span v-if="landing.teacher.headline" class="teacher-landing__brand-tagline">{{ landing.teacher.headline }}</span>
            </div>
            <nav class="teacher-landing__nav teacher-landing__nav--desktop" :aria-label="t('teacherLanding.navigation.label')">
              <a href="#hero" class="teacher-landing__nav-link">
                {{ t('teacherLanding.navigation.home') }}
              </a>
              <a href="#features" class="teacher-landing__nav-link">
                {{ t('teacherLanding.navigation.about') }}
              </a>
              <a href="#courses" class="teacher-landing__nav-link">
                {{ t('teacherLanding.navigation.courses') }}
              </a>

              <a href="#contact" class="teacher-landing__nav-link">
                {{ t('teacherLanding.navigation.contact') }}
              </a>
            </nav>
            <div class="teacher-landing__header-actions">
              <RouterLink
                v-if="canEditLanding"
                :to="editLandingRoute"
                class="teacher-landing__edit"
              >
                {{ t('teacherLanding.navigation.edit') }}
              </RouterLink>
              <button
                type="button"
                class="teacher-landing__language"
                :aria-label="languageToggleAria"
                @click="toggleLanguage"
              >
                <span aria-hidden="true">{{ languageToggleShortLabel }}</span>
                <span class="sr-only">{{ languageToggleAria }}</span>
              </button>
              <button
                v-if="canEditLanding && teacherLandingUrl"
                type="button"
                class="teacher-landing__share-copy teacher-landing__nav-cta--desktop"
                :class="{ 'is-copied': copyStatus === 'success' }"
                @click="copyLandingUrl"
                :title="copyButtonLabel"
              >
                {{ copyButtonLabel }}
              </button>
              <RouterLink
                :to="studentRegisterRoute"
                class="teacher-landing__nav-cta teacher-landing__nav-cta--primary teacher-landing__nav-cta--desktop"
                @click="trackLandingEvent('nav_register')"
              >
                {{ t('teacherLanding.navigation.register') }}
              </RouterLink>
              <button
                type="button"
                class="teacher-landing__nav-cta teacher-landing__nav-cta--ghost teacher-landing__nav-cta--desktop"
                @click="onTrackedLoginClick('nav_login')"
              >
                {{ t('teacherLanding.navigation.login') }}
              </button>
              <button
                type="button"
                class="teacher-landing__hamburger"
                :aria-label="t('teacherLanding.navigation.menu')"
                :aria-expanded="mobileMenuOpen"
                @click="mobileMenuOpen = !mobileMenuOpen"
              >
                <span v-if="!mobileMenuOpen" class="teacher-landing__hamburger-icon" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
                </span>
                <span v-else class="teacher-landing__hamburger-icon teacher-landing__hamburger-icon--close" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </span>
              </button>
            </div>
            <Teleport to="body">
              <Transition name="teacher-landing-drawer-backdrop">
                <div
                  v-show="mobileMenuOpen"
                  class="teacher-landing__drawer-backdrop"
                  role="presentation"
                  @click="mobileMenuOpen = false"
                />
              </Transition>
              <Transition :name="pageDirection === 'rtl' ? 'teacher-landing-drawer-panel-rtl' : 'teacher-landing-drawer-panel'">
                <aside
                  v-show="mobileMenuOpen"
                  class="teacher-landing__drawer"
                  :class="{ 'teacher-landing__drawer--rtl': pageDirection === 'rtl' }"
                  role="dialog"
                  :aria-label="t('teacherLanding.navigation.label')"
                  aria-modal="true"
                >
                  <nav class="teacher-landing__drawer-nav">
                    <a href="#hero" class="teacher-landing__nav-link" @click="mobileMenuOpen = false">{{ t('teacherLanding.navigation.home') }}</a>
                    <a href="#features" class="teacher-landing__nav-link" @click="mobileMenuOpen = false">{{ t('teacherLanding.navigation.about') }}</a>
                    <a href="#courses" class="teacher-landing__nav-link" @click="mobileMenuOpen = false">{{ t('teacherLanding.navigation.courses') }}</a>

                    <a href="#contact" class="teacher-landing__nav-link" @click="mobileMenuOpen = false">{{ t('teacherLanding.navigation.contact') }}</a>
                    <RouterLink
                      v-if="assistantLinkAvailable"
                      :to="assistantLoginRoute"
                      class="teacher-landing__nav-link"
                      @click="mobileMenuOpen = false"
                    >
                      {{ t('teacherLanding.navigation.assistant') }}
                    </RouterLink>
                    <button type="button" class="teacher-landing__nav-link" @click="onMobileLoginClick">
                      {{ t('teacherLanding.navigation.login') }}
                    </button>
                    <RouterLink :to="studentRegisterRoute" class="teacher-landing__nav-link teacher-landing__nav-link--cta" @click="mobileMenuOpen = false">
                      {{ t('teacherLanding.navigation.register') }}
                    </RouterLink>
                    <RouterLink
                      v-if="canEditLanding"
                      :to="editLandingRoute"
                      class="teacher-landing__nav-link teacher-landing__nav-link--ghost"
                      @click="mobileMenuOpen = false"
                    >
                      {{ t('teacherLanding.navigation.edit') }}
                    </RouterLink>
                  </nav>
                </aside>
              </Transition>
            </Teleport>
          </div>
        </header>

    <div class="teacher-landing__layout">
      <main class="teacher-landing__content">
        <div class="teacher-landing">
      <template v-for="sectionKey in sectionOrder" :key="sectionKey">
        <section
          v-if="sectionKey === 'hero'"
          id="hero"
          class="teacher-landing__section teacher-landing__section--hero"
        >
          <div class="teacher-landing__hero-cover" :style="heroCoverStyle">
            <CoverTheme
              v-if="activeCoverTheme"
              class="teacher-landing__cover-theme"
              :theme="activeCoverTheme"
              :title="heroTitle"
              :subtitle="heroSubtitle"
            />
            <template v-else>
              <div class="teacher-landing__hero-overlay" aria-hidden="true"></div>
              <div class="teacher-landing__hero-blobs" aria-hidden="true">
                <span class="teacher-landing__hero-blob teacher-landing__hero-blob--one"></span>
                <span class="teacher-landing__hero-blob teacher-landing__hero-blob--two"></span>
              </div>
            </template>
          </div>
          <div class="teacher-landing__modern-hero teacher-landing__modern-hero--below teacher-landing__container">
            <div class="teacher-landing__hero-aside">
              <div class="teacher-landing__hero-top">
                <div class="teacher-landing__hero-avatar teacher-landing__hero-avatar--standalone">
                  <img
                    v-if="brandAvatarUrl"
                    :src="brandAvatarUrl"
                    :alt="landing.teacher.displayName || landing.teacher.slug"
                    loading="lazy"
                    decoding="async"
                  />
                  <span v-else class="teacher-landing__hero-avatar-fallback">
                    {{ brandInitials }}
                  </span>
                </div>
                <div class="teacher-landing__modern-hero-text">
                  <p v-if="heroSubtitle" class="teacher-landing__modern-kicker">{{ heroSubtitle }}</p>
                  <h1 class="teacher-landing__modern-title">
                    {{ heroTitle }}
                    <span class="teacher-landing__modern-underline" aria-hidden="true"></span>
                  </h1>
                  <p v-if="heroDescription || profileBio" class="teacher-landing__modern-description">
                    {{ heroDescription || profileBio }}
                  </p>
                  <div v-if="trustItems.length" class="teacher-landing__trust">
                    <span v-for="(item, index) in trustItems" :key="`trust-${index}`" class="teacher-landing__trust-item">
                      {{ item }}
                    </span>
                  </div>
                  <div v-if="heroStats.length" class="teacher-landing__modern-stats">
                    <div v-for="(stat, index) in heroStats" :key="`modern-hero-stat-${index}`" class="teacher-landing__modern-stat">
                      <div class="teacher-landing__modern-stat-number">{{ stat.value }}</div>
                      <div class="teacher-landing__modern-stat-label">{{ stat.label }}</div>
                    </div>
                  </div>
                </div>
                <div class="teacher-landing__hero-actions">
                  <RouterLink
                    :to="studentRegisterRoute"
                    class="teacher-landing__modern-btn teacher-landing__modern-btn--primary"
                    @click="trackLandingEvent('hero_primary_register')"
                  >
                    {{ primaryCtaText }}
                  </RouterLink>
                  <button
                    type="button"
                    class="teacher-landing__modern-btn teacher-landing__modern-btn--outline"
                    @click="onTrackedLoginClick('hero_secondary_login')"
                  >
                    {{ t('teacherLanding.navigation.login') }}
                  </button>
                </div>
              </div>
            </div>
            
          </div>
          <div class="teacher-landing__hero-shell teacher-landing__hero-shell--legacy">
            <div class="teacher-landing__cover" :style="coverStyle">
              <CoverTheme
                v-if="activeCoverTheme"
                class="teacher-landing__cover-theme"
                :theme="activeCoverTheme"
                :title="heroTitle"
                :subtitle="heroSubtitle"
              />
              <picture v-else-if="coverImage" class="teacher-landing__cover-picture">
                <source v-if="coverSources.lg" media="(min-width: 1441px)" :srcset="coverSources.lg" />
                <source v-if="coverSources.md" media="(min-width: 769px)" :srcset="coverSources.md" />
                <source v-if="coverSources.sm" media="(max-width: 768px)" :srcset="coverSources.sm" />
                <img
                  :src="coverImage"
                  alt=""
                  class="teacher-landing__cover-image"
                  loading="eager"
                  decoding="async"
                  fetchpriority="high"
                />
              </picture>
              <div v-if="!activeCoverTheme" class="teacher-landing__cover-overlay" aria-hidden="true"></div>
              <div v-if="!activeCoverTheme" class="teacher-landing__cover-glow" aria-hidden="true"></div>
            </div>
            <div class="teacher-landing__profile-card">
              <div class="teacher-landing__profile-header">
                <div class="teacher-landing__profile-avatar">
                  <img
                    v-if="brandAvatarUrl"
                    :src="brandAvatarUrl"
                    :alt="landing.teacher.displayName || landing.teacher.slug"
                    loading="lazy"
                    decoding="async"
                    fetchpriority="high"
                    @error="handleBrandAvatarError"
                  />
                  <span v-else class="teacher-landing__profile-avatar-fallback">
                    {{ brandInitials }}
                  </span>
                </div>
                <div class="teacher-landing__profile-main">
                  <p class="teacher-landing__profile-name">{{ landing.teacher.displayName }}</p>
                  <p v-if="profileHeadline" class="teacher-landing__profile-headline">{{ profileHeadline }}</p>
                </div>
                <div class="teacher-landing__profile-actions">
                  <RouterLink
                    v-if="primaryCtaAction === 'register'"
                    :to="studentRegisterRoute"
                    class="teacher-landing__profile-cta teacher-landing__profile-cta--primary"
                    @click="trackLandingEvent('hero_primary_register')"
                  >
                    {{ primaryCtaText }}
                  </RouterLink>
                  <button
                    v-else-if="primaryCtaAction === 'login'"
                    type="button"
                    class="teacher-landing__profile-cta teacher-landing__profile-cta--primary"
                    @click="onTrackedLoginClick('hero_primary_login')"
                  >
                    {{ primaryCtaText }}
                  </button>
                  <a
                    v-else-if="cta.href"
                    :href="cta.href"
                    class="teacher-landing__profile-cta teacher-landing__profile-cta--primary"
                    @click="handleExploreLessonsClick"
                  >
                    {{ primaryCtaText }}
                  </a>
                  <RouterLink
                    v-if="secondaryCta === 'register'"
                    :to="studentRegisterRoute"
                    class="teacher-landing__profile-cta teacher-landing__profile-cta--ghost"
                    @click="trackLandingEvent('hero_secondary_register')"
                  >
                    {{ t('teacherLanding.navigation.register') }}
                  </RouterLink>
                  <button
                    v-else
                    type="button"
                    class="teacher-landing__profile-cta teacher-landing__profile-cta--ghost"
                    @click="onTrackedLoginClick('hero_secondary_login')"
                  >
                    {{ t('teacherLanding.navigation.login') }}
                  </button>
                </div>
                <div v-if="canEditLanding && teacherLandingUrl" class="teacher-landing__profile-link">
                  <span class="teacher-landing__profile-link-label">{{ t('teacherLanding.share.label') }}</span>
                  <div class="teacher-landing__profile-link-actions">
                    <a
                      :href="teacherLandingUrl"
                      target="_blank"
                      rel="noopener"
                      class="teacher-landing__profile-link-url"
                      :title="teacherLandingUrl"
                    >
                      {{ teacherLandingDisplayHost }}
                    </a>
                    <button
                      type="button"
                      class="teacher-landing__profile-link-copy"
                      :class="{ 'is-copied': copyStatus === 'success' }"
                      @click="copyLandingUrl"
                      :title="copyButtonLabel"
                    >
                      <span class="teacher-landing__profile-link-copy-text">{{ copyButtonLabel }}</span>
                    </button>
                    <details class="teacher-landing__profile-share" @toggle="onShareToggle">
                      <summary
                        class="teacher-landing__profile-share-toggle"
                        :aria-label="t('teacherLanding.share.shareAria')"
                      >
                        {{ t('teacherLanding.share.share') }}
                      </summary>
                      <div class="teacher-landing__profile-share-menu">
                        <a
                          v-for="item in shareLinks"
                          :key="item.id"
                          :href="item.href"
                          target="_blank"
                          rel="noopener"
                          class="teacher-landing__profile-share-link"
                        >
                          {{ item.label }}
                        </a>
                        <button
                          v-if="qrImageSrc"
                          type="button"
                          class="teacher-landing__profile-share-link teacher-landing__profile-share-link--button"
                          @click.prevent="toggleQrPanel"
                        >
                          {{ t('teacherLanding.share.qr') }}
                        </button>
                        <div v-if="qrPanelOpen && qrImageSrc" class="teacher-landing__profile-qr">
                          <img :src="qrImageSrc" :alt="t('teacherLanding.share.qrAlt')" />
                          <span class="teacher-landing__profile-qr-hint">{{ t('teacherLanding.share.qrHint') }}</span>
                        </div>
                      </div>
                    </details>
                    <span class="sr-only" aria-live="polite">{{ copyStatusMessage }}</span>
                  </div>
                </div>
              </div>
              <p v-if="profileBio" class="teacher-landing__profile-bio">{{ profileBio }}</p>
              <ul v-if="heroHighlights.length" class="teacher-landing__profile-highlights">
                <li v-for="(highlight, index) in heroHighlights" :key="`hero-highlight-${index}`">
                  {{ highlight }}
                </li>
              </ul>
              <div v-if="heroStats.length" class="teacher-landing__profile-stats">
                <div v-for="(stat, index) in heroStats" :key="`hero-stat-${index}`" class="teacher-landing__profile-stat">
                  <span class="teacher-landing__profile-stat-value">{{ stat.value }}</span>
                  <span class="teacher-landing__profile-stat-label">{{ stat.label }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section
          v-else-if="sectionKey === 'about'"
          id="features"
          class="teacher-landing__section teacher-landing__section--about teacher-landing__section--features"
        >
          <div class="teacher-landing__container teacher-landing__modern-section">
            <div class="teacher-landing__about-card">
              <div v-if="heroStats.length" class="teacher-landing__about-stat">
                <div class="teacher-landing__about-stat-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M20 20a8 8 0 1 0-16 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
                <div class="teacher-landing__about-stat-title">{{ heroStats[0].label }}</div>
                <div class="teacher-landing__about-stat-value">{{ heroStats[0].value }}</div>
              </div>
              <div class="teacher-landing__about-content">
                <div class="teacher-landing__modern-heading">
                  <p v-if="aboutSection?.subtitle" class="teacher-landing__modern-kicker">{{ aboutSection?.subtitle }}</p>
                  <h2 class="teacher-landing__modern-section-title">
                    {{ aboutSection?.title || t('teacherLanding.navigation.about') }}
                  </h2>
                  <p v-if="aboutSection?.description || profileBio" class="teacher-landing__modern-section-description">
                    {{ aboutSection?.description || profileBio }}
                  </p>
                </div>
              </div>
            </div>
            <!-- Removed modern features section per request -->
          </div>
          <TeacherAbout class="teacher-landing__legacy-block" :teacher="landing.teacher" :section="aboutSection" />
        </section>
        <section
          v-else-if="sectionKey === 'courses'"
          id="courses"
          class="teacher-landing__section teacher-landing__section--panel teacher-landing__section--courses"
        >
          <div class="teacher-landing__container teacher-landing__modern-section teacher-landing__modern-section--center">
            <div class="teacher-landing__modern-heading teacher-landing__modern-heading--center">
              <h2 class="teacher-landing__modern-section-title">{{ t('teacherLanding.navigation.courses') }}</h2>
              <p v-if="heroHighlights.length" class="teacher-landing__modern-section-description">
                {{ heroHighlights[0] }}
              </p>
            </div>
            <div
              v-if="loading && !featuredCourses.length"
              class="teacher-landing__modern-courses teacher-landing__modern-courses--skeleton"
            >
              <article
                v-for="index in 3"
                :key="`course-skeleton-${index}`"
                class="teacher-landing__modern-course-card teacher-landing__modern-course-card--skeleton"
              >
                <div class="teacher-landing__modern-course-media"></div>
                <div class="teacher-landing__modern-course-body">
                  <div class="teacher-landing__skeleton-line"></div>
                  <div class="teacher-landing__skeleton-line teacher-landing__skeleton-line--short"></div>
                  <div class="teacher-landing__skeleton-line teacher-landing__skeleton-line--pill"></div>
                </div>
              </article>
            </div>
            <div v-else class="teacher-landing__modern-courses">
                <article
                  v-for="course in featuredCourses"
                  :key="course.id || course.title"
                  class="teacher-landing__modern-course-card"
                  role="button"
                tabindex="0"
                @click="onCourseClick(course.raw)"
                @keydown.enter.prevent="onCourseClick(course.raw)"
                @keydown.space.prevent="onCourseClick(course.raw)"
                >
                  <div class="teacher-landing__modern-course-media">
                    <span
                      v-if="course.offerEndsAt"
                      class="teacher-landing__modern-course-timer teacher-landing__modern-course-timer--card"
                      aria-live="polite"
                    >
                      {{ formatCountdown(course.offerEndsAt) }}
                    </span>
                    <span
                      v-if="course.hasDiscount"
                      class="teacher-landing__badge teacher-landing__badge--soft teacher-landing__modern-course-badge"
                    >
                      {{ t('teacherLanding.course.offerBadge', activeLocale === 'ar' ? 'عرض' : 'Offer') }}
                    </span>
                    <img
                      :src="course.image"
                      :alt="course.title"
                    class="teacher-landing__modern-course-image"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div class="teacher-landing__modern-course-body">
                  <span v-if="course.level" class="teacher-landing__modern-course-level">{{ course.level }}</span>
                  <h3 class="teacher-landing__modern-course-title">{{ course.title }}</h3>
                  <p v-if="course.subtitle" class="teacher-landing__modern-course-subtitle">{{ course.subtitle }}</p>
                    <div v-if="course.tooltip" class="teacher-landing__modern-course-tooltip" role="tooltip">
                      <div class="teacher-landing__modern-course-tooltip-title">
                        {{ t('teacherLanding.course.tooltipTitle', 'ماذا ستتعلم؟') }}
                      </div>
                      <ul class="teacher-landing__modern-course-tooltip-list">
                        <li
                          v-for="(item, index) in formatCourseTooltip(course.tooltip)"
                          :key="`course-tooltip-${index}`"
                          class="teacher-landing__modern-course-tooltip-item"
                        >
                          {{ item }}
                        </li>
                      </ul>
                    </div>
                  <div class="teacher-landing__modern-course-meta">
                    <span class="teacher-landing__modern-course-stars" aria-hidden="true">*****</span>
                    <span class="teacher-landing__modern-course-rating">({{ course.ratingLabel }})</span>
                  </div>
                    <div class="teacher-landing__modern-course-footer">
                      <div class="teacher-landing__modern-course-price">
                        <span
                          v-if="course.hasDiscount && course.originalPriceLabel"
                          class="teacher-landing__modern-course-price-original"
                        >
                          {{ course.originalPriceLabel }}
                      </span>
                      <span class="teacher-landing__modern-course-price-current">
                        {{ course.priceLabel }}
                      </span>
                    </div>
                    <button
                      type="button"
                      class="teacher-landing__modern-course-cta"
                      @click.stop="onCourseClick(course.raw)"
                    >
                      {{ primaryCtaText }}
                    </button>
                  </div>
                </div>
              </article>
            </div>
            <section v-if="landing.testimonials?.length" class="teacher-landing__testimonials">
              <div class="teacher-landing__modern-heading teacher-landing__modern-heading--center">
                <p class="teacher-landing__modern-kicker">{{ t('teacherLanding.testimonials.badge') }}</p>
                <h2 class="teacher-landing__modern-section-title">{{ t('teacherLanding.testimonials.title') }}</h2>
              </div>
              <div class="teacher-landing__testimonials-grid">
                  <article
                    v-for="testimonial in landing.testimonials"
                    :key="testimonial.id"
                    class="teacher-landing__testimonial-card"
                  >
                    <div class="teacher-landing__testimonial-header">
                      <div
                        class="teacher-landing__testimonial-avatar"
                        :data-initial="getInitials(testimonial.author)"
                        aria-hidden="true"
                      ></div>
                      <div class="teacher-landing__testimonial-meta">
                        <p class="teacher-landing__testimonial-author">{{ testimonial.author }}</p>
                        <div class="teacher-landing__testimonial-stars" aria-hidden="true">
                          <span
                            v-for="n in 5"
                            :key="`testimonial-star-${testimonial.id}-${n}`"
                            class="teacher-landing__testimonial-star"
                          >
                            ★
                          </span>
                        </div>
                      </div>
                    </div>
                    <p class="teacher-landing__testimonial-quote">“{{ testimonial.quote }}”</p>
                  </article>
                </div>
              </section>
            <section v-if="faqItems.length" class="teacher-landing__faq">
              <div class="teacher-landing__modern-heading teacher-landing__modern-heading--center">
                <p class="teacher-landing__modern-kicker">{{ t('teacherLanding.faqs.badge') }}</p>
                <h2 class="teacher-landing__modern-section-title">{{ t('teacherLanding.faqs.title') }}</h2>
              </div>
              <div class="teacher-landing__faq-list">
                <details
                  v-for="item in faqItems"
                  :key="item.id || item.question"
                  class="teacher-landing__faq-item"
                >
                  <summary class="teacher-landing__faq-question">{{ item.question }}</summary>
                  <div class="teacher-landing__faq-answer">{{ item.answer }}</div>
                </details>
              </div>
            </section>
            <div class="teacher-landing__inquiry">
              <div class="teacher-landing__inquiry-copy">
                <h3 class="teacher-landing__inquiry-title">{{ t('teacherLanding.inquiry.title') }}</h3>
                <p class="teacher-landing__inquiry-subtitle">{{ t('teacherLanding.inquiry.subtitle') }}</p>
              </div>
                <form class="teacher-landing__inquiry-form" @submit.prevent="submitInquiry">
                  <div class="teacher-landing__inquiry-field">
                    <input
                      id="landing-inquiry-name"
                      v-model="inquiryForm.name"
                      type="text"
                    class="teacher-landing__inquiry-input"
                    :placeholder="t('teacherLanding.inquiry.namePlaceholder')"
                    :disabled="inquirySubmitting"
                    :aria-invalid="Boolean(inquiryErrors.name)"
                    required
                  />
                  <small v-if="inquiryErrors.name" class="teacher-landing__inquiry-error">
                    {{ inquiryErrors.name }}
                  </small>
                  </div>
                  <div class="teacher-landing__inquiry-field">
                    <input
                      id="landing-inquiry-phone"
                      v-model="inquiryForm.phone"
                      type="tel"
                    class="teacher-landing__inquiry-input"
                    :placeholder="t('teacherLanding.inquiry.phonePlaceholder')"
                    :disabled="inquirySubmitting"
                    :aria-invalid="Boolean(inquiryErrors.phone)"
                    required
                  />
                  <small v-if="inquiryErrors.phone" class="teacher-landing__inquiry-error">
                    {{ inquiryErrors.phone }}
                  </small>
                  </div>
                  <div class="teacher-landing__inquiry-field">
                    <input
                      id="landing-inquiry-email"
                      v-model="inquiryForm.email"
                      type="email"
                    class="teacher-landing__inquiry-input"
                    :placeholder="t('teacherLanding.inquiry.emailPlaceholder')"
                    :disabled="inquirySubmitting"
                    :aria-invalid="Boolean(inquiryErrors.email)"
                    required
                  />
                  <small v-if="inquiryErrors.email" class="teacher-landing__inquiry-error">
                    {{ inquiryErrors.email }}
                  </small>
                  </div>
                  <div class="teacher-landing__inquiry-field teacher-landing__inquiry-field--full">
                    <textarea
                      id="landing-inquiry-message"
                      v-model="inquiryForm.message"
                    class="teacher-landing__inquiry-input teacher-landing__inquiry-textarea"
                    :placeholder="t('teacherLanding.inquiry.messagePlaceholder')"
                    :disabled="inquirySubmitting"
                    :aria-invalid="Boolean(inquiryErrors.message)"
                    rows="4"
                    required
                  ></textarea>
                  <small v-if="inquiryErrors.message" class="teacher-landing__inquiry-error">
                    {{ inquiryErrors.message }}
                  </small>
                </div>
                <div class="teacher-landing__inquiry-actions">
                  <button
                    type="submit"
                    class="teacher-landing__modern-btn teacher-landing__modern-btn--primary"
                    :disabled="inquirySubmitting"
                  >
                    {{ inquirySubmitting ? t('teacherLanding.inquiry.submitting') : t('teacherLanding.inquiry.submit') }}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div class="teacher-landing__panel teacher-landing__legacy-block">
            <TeacherLessonsGrid
              :courses="courses"
              :teacher-slug="landing.teacher.slug"
              :loading="loading"
              @course-click="onCourseAnalytics"
            />
          </div>
        </section>

      </template>
        </div>
      </main>
    </div>
    <footer class="teacher-landing__footer teacher-landing__modern-footer">
      <div class="teacher-landing__container teacher-landing__footer-grid">
        <section class="teacher-landing__footer-brand">
          <div class="teacher-landing__footer-left">
            <span v-if="footerSocialLinks.length" class="teacher-landing__footer-contact-title">
              {{ t('teacherLanding.navigation.contact') }}
            </span>
            <div v-if="footerSocialLinks.length || footerPhoneLink" class="teacher-landing__footer-socials">
              <a
                v-for="item in footerSocialLinks"
                :key="`footer-social-${item.href}`"
                :href="item.href"
                target="_blank"
                rel="noopener"
                class="teacher-landing__footer-social"
                :aria-label="item.label"
              >
                <img
                  :src="item.icon"
                  :alt="item.label"
                  class="teacher-landing__footer-social-icon"
                  loading="lazy"
                  decoding="async"
                />
              </a>
              <button
                v-if="footerPhoneLink"
                type="button"
                class="teacher-landing__footer-social teacher-landing__footer-social--phone"
                :aria-label="footerPhoneLink.label"
                @click="showFooterPhone = !showFooterPhone"
              >
                <img
                  :src="CONTACT_ICON"
                  alt=""
                  class="teacher-landing__footer-social-icon"
                  loading="lazy"
                  decoding="async"
                />
                <span v-if="showFooterPhone" class="teacher-landing__footer-social-text">
                  {{ footerPhoneLink.value }}
                </span>
              </button>
            </div>
            <div class="teacher-landing__footer-actions">
              <RouterLink
                :to="studentRegisterRoute"
                class="teacher-landing__footer-cta teacher-landing__footer-cta--primary"
                @click="trackLandingEvent('footer_register')"
              >
                {{ t('teacherLanding.navigation.register') }}
              </RouterLink>
              <button
                type="button"
                class="teacher-landing__footer-cta teacher-landing__footer-cta--ghost"
                @click="onTrackedLoginClick('footer_login')"
              >
                {{ t('teacherLanding.navigation.login') }}
              </button>
              <RouterLink
                v-if="assistantLinkAvailable"
                :to="assistantLoginRoute"
                class="teacher-landing__footer-cta teacher-landing__footer-cta--ghost"
              >
                {{ t('teacherLanding.navigation.assistant') }}
              </RouterLink>
            </div>
            <div class="teacher-landing__footer-powered">
              Powered by
              <a
                class="teacher-landing__footer-powered-link"
                href="https://zidni.cloud"
                target="_blank"
                rel="noopener"
              >
                Zidni AI
              </a>
            </div>
          </div>
        </section>
      </div>
      
    </footer>
      </ThemeProvider>
    </div>
    </component>
  </template>
  <div v-else class="teacher-landing__state" aria-hidden="true"></div>
</template>

<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, watch, ref, reactive } from 'vue';
  import { RouterLink, useRoute, useRouter } from 'vue-router';
  import { useI18n } from 'vue-i18n';
  import ThemeProvider from '@/components/teacherLanding/ThemeProvider.vue';
  import CoverTheme from '@/components/teacherLanding/CoverTheme.vue';
  import TeacherTemplateModern from '@/views/public/templates/TeacherTemplateModern.vue';
  import TeacherTemplateMinimal from '@/views/public/templates/TeacherTemplateMinimal.vue';
  import TeacherTemplateClassic from '@/views/public/templates/TeacherTemplateClassic.vue';
import TeacherAbout from '@/components/teacherLanding/TeacherAbout.vue';
import TeacherLessonsGrid from '@/components/teacherLanding/TeacherLessonsGrid.vue';

import { useAuthStore } from '@/stores/auth';
import { useTeacherLandingStore } from '@/stores/teacherLanding';
import { useTenantStore } from '@/stores/tenant';
  import { useToast } from '@/composables/useToast';
  import api from '@/services/api';
  import { buildTenantUrl } from '@/lib/host';
  import { TEACHER_LANDING_DEFAULT_BG } from '@/constants/teacherLandingBackground';
  import { LOCALE_STORAGE_KEY, loadLocaleMessages, type SupportedLocale } from '@/plugins/i18n';
  import { classifyHost } from '@/utils/tenantHost';
  import { withCacheBusting } from '@/utils/cacheBusting';
import { submitLandingInquiry } from '@/services/landingInquiries';
import { fetchPublicTeacherOffers } from '@/services/teacherLanding.api';
import type { OfferResponse } from '@/api/offers';
import type {
  TeacherLandingCourse,
  TeacherLandingFooterContact,
  TeacherLandingPublicResponse,
  TeacherLandingSection,
  TeacherLandingSeo,
  TeacherLandingTeacherInfo,
  TeacherLandingTestimonial
} from '@/services/teacherLanding.api';

const store = useTeacherLandingStore();
const tenantStore = useTenantStore();
const localeReady = ref(false);
const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();
const toast = useToast();

const brandAvatarError = ref(false);
const mobileMenuOpen = ref(false);
const copyStatus = ref<'idle' | 'success' | 'error'>('idle');
  const copyResetTimer = ref<number | null>(null);
  const qrPanelOpen = ref(false);
  const offers = ref<OfferResponse[]>([]);
  const offersLoading = ref(false);

  type PublicCourseOffer = {
    code: string;
    type: 'PERCENTAGE' | 'FIXED' | 'BUNDLE';
    value: number;
    validUntil?: string | null;
  };

  const courseOffers = reactive<Record<string, PublicCourseOffer[]>>({});
const countdownNow = ref(Date.now());
let countdownTimer: number | null = null;

const inquiryForm = reactive({
  name: '',
  phone: '',
  email: '',
  message: ''
});
const inquiryErrors = reactive({
  name: '',
  phone: '',
  email: '',
  message: ''
});
const inquirySubmitting = ref(false);

const hostInfo = computed(() => classifyHost());

const slug = computed(() => {
  const teacherSlug = route.params.teacherSlug as string | undefined;
  if (typeof teacherSlug === 'string' && teacherSlug.trim().length > 0) {
    return teacherSlug.trim();
  }

  const slugParam = route.params.slug as string | undefined;
  if (typeof slugParam === 'string' && slugParam.trim().length > 0) {
    return slugParam.trim();
  }

  const storeSlug = (tenantStore.slug || '').trim();
  if (storeSlug) {
    return storeSlug;
  }

  const hostSlug = (hostInfo.value.tenantSlug || '').trim();
  if (hostSlug) {
    return hostSlug;
  }

  return '';
});

const normalizeLocale = (value: string): SupportedLocale => (value === 'en' ? 'en' : 'ar');

const activeLocale = computed(() => normalizeLocale(locale.value));
const pageDirection = computed(() => (activeLocale.value === 'ar' ? 'rtl' : 'ltr'));

const languageToggleAria = computed(() =>
  activeLocale.value === 'ar'
    ? t('teacherLanding.language.switchToEnglish')
    : t('teacherLanding.language.switchToArabic')
);

const languageToggleShortLabel = computed(() =>
  activeLocale.value === 'ar'
    ? t('teacherLanding.language.shortEnglish')
    : t('teacherLanding.language.shortArabic')
);

const DEFAULT_COURSES_HASH = '#courses';

const fallbackLanding = computed<TeacherLandingPublicResponse>(() => {
  const heroHighlights = [
    t('teacherLanding.defaults.hero.highlights.interactive'),
    t('teacherLanding.defaults.hero.highlights.mentors'),
    t('teacherLanding.defaults.hero.highlights.projects')
  ].filter(Boolean);

  const heroStats = [
    {
      label: t('teacherLanding.defaults.hero.stats.students.label'),
      value: t('teacherLanding.defaults.hero.stats.students.value')
    },
    {
      label: t('teacherLanding.defaults.hero.stats.sessions.label'),
      value: t('teacherLanding.defaults.hero.stats.sessions.value')
    }
  ].filter((stat) => stat.label && stat.value);

  const aboutHighlights = [
    t('teacherLanding.defaults.about.highlights.curriculum'),
    t('teacherLanding.defaults.about.highlights.support'),
    t('teacherLanding.defaults.about.highlights.outcomes')
  ].filter(Boolean);

  const courses: TeacherLandingCourse[] = [
    {
      id: 'default-lesson-physics',
      type: 'course',
      title: t('teacherLanding.defaults.lessons.physics.title'),
      subtitle: t('teacherLanding.defaults.lessons.physics.subtitle'),
      tags: [
        t('teacherLanding.defaults.lessons.physics.tags.0'),
        t('teacherLanding.defaults.lessons.physics.tags.1')
      ].filter(Boolean)
    },
    {
      id: 'default-lesson-chemistry',
      type: 'course',
      title: t('teacherLanding.defaults.lessons.chemistry.title'),
      subtitle: t('teacherLanding.defaults.lessons.chemistry.subtitle'),
      tags: [
        t('teacherLanding.defaults.lessons.chemistry.tags.0'),
        t('teacherLanding.defaults.lessons.chemistry.tags.1')
      ].filter(Boolean)
    },
    {
      id: 'default-lesson-math',
      type: 'course',
      title: t('teacherLanding.defaults.lessons.math.title'),
      subtitle: t('teacherLanding.defaults.lessons.math.subtitle'),
      tags: [
        t('teacherLanding.defaults.lessons.math.tags.0'),
        t('teacherLanding.defaults.lessons.math.tags.1')
      ].filter(Boolean)
    }
  ].filter((course) => course.title);

  const testimonials: TeacherLandingTestimonial[] = [
    {
      id: 1,
      author: t('teacherLanding.defaults.testimonials.omar.author'),
      quote: t('teacherLanding.defaults.testimonials.omar.quote')
    },
    {
      id: 2,
      author: t('teacherLanding.defaults.testimonials.salma.author'),
      quote: t('teacherLanding.defaults.testimonials.salma.quote')
    }
  ].filter((item) => item.author && item.quote);

  return {
    teacher: {
      id: 0,
      slug: slug.value || 'demo-teacher',
      displayName: t('teacherLanding.defaults.teacherName'),
      headline: t('teacherLanding.defaults.teacherHeadline'),
      bio: t('teacherLanding.defaults.teacherBio'),
      photoUrl: '',
      avatarUrl: '',
      updatedAt: new Date(0).toISOString()
    },
    template: 'modern',
    themePrimary: '#2563eb',
    themeSecondary: '#0ea5e9',
    footerContact: null,
    sections: [
      {
        type: 'hero',
        title: t('teacherLanding.defaults.hero.title'),
        subtitle: t('teacherLanding.defaults.hero.subtitle'),
        description: t('teacherLanding.defaults.hero.description'),
        ctaText: t('teacherLanding.defaults.hero.ctaText'),
        ctaHref: DEFAULT_COURSES_HASH,
        highlights: heroHighlights,
        stats: heroStats
      },
      {
        type: 'about',
        title: t('teacherLanding.defaults.about.title'),
        subtitle: t('teacherLanding.defaults.about.subtitle'),
        description: t('teacherLanding.defaults.about.description'),
        highlights: aboutHighlights
      }
    ],
    courses,
    social: null,
    seo: {
      title: t('teacherLanding.defaults.seo.title'),
      description: t('teacherLanding.defaults.seo.description')
    },
    testimonials
  };
});

const landing = computed<TeacherLandingPublicResponse>(() => {
  const fallback = fallbackLanding.value;
  const remote = store.data;

  if (!remote) {
    return fallback;
  }

  const remoteSections = remote.sections ?? [];
  const fallbackHero = fallback.sections.find((section) => section.type === 'hero');
  const fallbackAbout = fallback.sections.find((section) => section.type === 'about');
  const remoteHero = remoteSections.find((section) => section?.type === 'hero');
  const remoteAbout = remoteSections.find((section) => section?.type === 'about');

  const normalizedHero =
    (hasSectionContent(remoteHero) ? normalizeSection(remoteHero, fallbackHero) : fallbackHero) ?? fallbackHero;
  const normalizedAbout =
    (hasSectionContent(remoteAbout) ? normalizeSection(remoteAbout, fallbackAbout) : fallbackAbout) ?? fallbackAbout;

  const additionalSections = remoteSections
    .filter((section) => {
      const type = section?.type;
      return type && !['hero', 'about'].includes(type);
    })
    .map((section) => normalizeSection(section))
    .filter((section): section is TeacherLandingSection => Boolean(section));

  return {
    teacher: normalizeTeacher(remote.teacher, fallback.teacher),
    template: remote.template ?? fallback.template,
    themePrimary: remote.themePrimary ?? fallback.themePrimary,
    themeSecondary: remote.themeSecondary ?? fallback.themeSecondary,
    footerContact: remote.footerContact ?? fallback.footerContact,
    sections: [normalizedHero, normalizedAbout, ...additionalSections].filter(Boolean) as TeacherLandingSection[],
    courses: normalizeCourses(remote.courses, fallback.courses),
    social: remote.social ?? fallback.social,
    seo: normalizeSeo(remote.seo, fallback.seo),
    testimonials: normalizeTestimonials(remote.testimonials, fallback.testimonials)
  };
});

const landingSlug = computed(() => ensureString(slug.value, ''));

const perTenantLocaleKey = computed(() => {
  const slugValue = landingSlug.value;
  if (!slugValue) {
    return LOCALE_STORAGE_KEY;
  }
  return `${LOCALE_STORAGE_KEY}::teacher-landing::${slugValue.toLowerCase()}`;
});

const persistLocale = (value: SupportedLocale) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(perTenantLocaleKey.value, value);
};

const applyDocumentLanguage = (lang: SupportedLocale) => {
  if (typeof document === 'undefined') {
    return;
  }
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  document.documentElement.dir = dir;
  const body = document.body;
  if (body) {
    body.setAttribute('lang', lang);
    body.setAttribute('dir', dir);
    body.classList.toggle('teacher-landing-body-rtl', dir === 'rtl');
  }
};

const toggleLanguage = async () => {
  const next: SupportedLocale = activeLocale.value === 'ar' ? 'en' : 'ar';
  await loadLocaleMessages(next);
  locale.value = next;
};

const resolveLocaleFromRecord = (value: unknown): string => {
  if (!value || typeof value !== 'object') {
    return '';
  }
  const root = value as Record<string, unknown>;
  const nested = root.branding;
  const source = nested && typeof nested === 'object' ? (nested as Record<string, unknown>) : root;
  return ensureString(
    (source.defaultLocale as string | undefined) || (source.locale as string | undefined),
    ''
  );
};

const resolvePreferredLocale = (): SupportedLocale | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const landingLocale = resolveLocaleFromRecord(tenantStore.branding?.landing?.content);
  if (landingLocale) {
    return normalizeLocale(landingLocale);
  }
  const brandingLocale = resolveLocaleFromRecord(tenantStore.branding?.branding);
  if (brandingLocale) {
    return normalizeLocale(brandingLocale);
  }
  return null;
};

const applyPreferredLocale = async () => {
  const preferred = resolvePreferredLocale();
  if (!preferred || preferred === activeLocale.value) {
    return;
  }
  await loadLocaleMessages(preferred);
  locale.value = preferred;
};

watch(
  activeLocale,
  (value) => {
    persistLocale(value);
    applyDocumentLanguage(value);
  },
  { immediate: true }
);

const studentRegisterRoute = computed(() => ({
  name: 'student-register',
  query: {
    tenant: slug.value
  }
}));

const editLandingRoute = computed(() => ({
  name: 'teacher-landing-content'
}));

const assistantLoginRoute = computed(() => {
  const slugValue = slug.value.trim();
  if (slugValue) {
    return { name: 'assistant-login', query: { tenant: slugValue } };
  }
  return { name: 'assistant-login' };
});

const redirectToStudentLogin = () => {
  const slugValue = slug.value.trim();
  if (!slugValue) {
    return;
  }
  const target = buildTenantUrl(slugValue, '/login');
  window.location.href = target;
};

function onMobileLoginClick() {
  mobileMenuOpen.value = false;
  redirectToStudentLogin();
}

const onTrackedLoginClick = (eventName: string) => {
  trackLandingEvent(eventName);
  redirectToStudentLogin();
};

const assistantLinkAvailable = computed(() => Boolean(slug.value.trim()));
const BLOCKED_EXTERNAL_IMAGE_HOSTS = ['facebook.com', 'fbcdn.net'];

function isBlockedExternalImage(candidate: string): boolean {
  try {
    const parsed = new URL(candidate, 'http://localhost');
    const hostname = parsed.hostname.toLowerCase();
    return BLOCKED_EXTERNAL_IMAGE_HOSTS.some((blocked) =>
      hostname === blocked || hostname.endsWith(`.${blocked}`)
    );
  } catch (error) {
    return false;
  }
}

function ensureString(value: string | null | undefined, fallback = ''): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return value;
    }
  }
  return fallback;
}

const apiBaseUrl = import.meta.env.VITE_API_URL?.trim() || '';

function resolveAssetAgainstApiBase(candidate: string): string {
  if (!candidate) {
    return candidate;
  }

  const normalized = candidate.trim();

  if (
    normalized.startsWith('@/') ||
    normalized.startsWith('src/') ||
    normalized.startsWith('assets/') ||
    normalized.startsWith('./') ||
    normalized.startsWith('../')
  ) {
    return normalized;
  }

  if (/^(?:https?:)?\/\//i.test(normalized) || normalized.startsWith('data:') || normalized.startsWith('blob:')) {
    return normalized;
  }

  if (!apiBaseUrl) {
    return normalized;
  }

  try {
    return new URL(normalized, apiBaseUrl).toString();
  } catch (error) {
    console.warn('[TeacherLandingView] unable to resolve asset against API base', error);
    return normalized;
  }
}

function ensureAssetUrl(value: string | null | undefined, fallback = ''): string {
  const candidate = ensureString(value, '').trim();
  if (!candidate) {
    return ensureString(fallback, '').trim();
  }
  if (isBlockedExternalImage(candidate)) {
    return ensureString(fallback, '').trim();
  }

  return resolveAssetAgainstApiBase(candidate);
}

function ensureList(values: Array<string | null | undefined> | undefined, fallback?: string[]): string[] {
  const items = (values ?? [])
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => entry.length > 0);
  if (items.length) {
    return items;
  }
  return fallback ? [...fallback] : [];
}

function ensureStats(
  values: TeacherLandingSection['stats'] | undefined,
  fallback?: TeacherLandingSection['stats']
): TeacherLandingSection['stats'] {
  const stats = (values ?? [])
    .map((stat) => ({
      label: ensureString(stat?.label, ''),
      value: ensureString(stat?.value, '')
    }))
    .filter((stat) => stat.label && stat.value);
  if (stats.length) {
    return stats;
  }
  return fallback ? [...fallback] : [];
}

function hasSectionContent(section: TeacherLandingSection | undefined) {
  if (!section) {
    return false;
  }
  const textFields = [
    section.title,
    section.subtitle,
    section.description,
    section.ctaText,
    section.imageUrl,
    section.quoteAuthor
  ];
  const hasText = textFields.some((field) => typeof field === 'string' && field.trim().length > 0);
  const hasHighlights = section.highlights?.some((item) => typeof item === 'string' && item.trim().length > 0);
  const hasStats = section.stats?.some(
    (stat) =>
      (typeof stat?.label === 'string' && stat.label.trim().length > 0) ||
      (typeof stat?.value === 'string' && stat.value.trim().length > 0)
  );
  return hasText || hasHighlights || hasStats;
}

function normalizeSection(
  section: TeacherLandingSection | undefined,
  fallback?: TeacherLandingSection
): TeacherLandingSection | undefined {
  if (!fallback && !section) {
    return undefined;
  }
  const base = fallback ? { ...fallback } : ({} as TeacherLandingSection);
  if (!section) {
    return {
      ...base,
      highlights: base.highlights ?? [],
      stats: base.stats ?? []
    };
  }
    const normalized: TeacherLandingSection = {
      ...base,
      ...section,
      title: ensureString(section.title, ensureString(base.title, '')),
      subtitle: ensureString(section.subtitle, ensureString(base.subtitle, '')),
      description: ensureString(section.description, ensureString(base.description, '')),
      ctaText: ensureString(section.ctaText, ensureString(base.ctaText, '')),
      ctaHref: ensureString(section.ctaHref, base.ctaHref || '#'),
      imageUrl: ensureAssetUrl(section.imageUrl, ensureAssetUrl(base.imageUrl, '')),
      coverTheme: ensureString(section.coverTheme, ensureString(base.coverTheme, '')),
      quoteAuthor: ensureString(section.quoteAuthor, ensureString(base.quoteAuthor, '')),
      highlights: ensureList(section.highlights, base.highlights),
      stats: ensureStats(section.stats, base.stats)
    };
  if (!normalized.type && base.type) {
    normalized.type = base.type;
  }
  return normalized;
}

function normalizeTeacher(
  teacher: TeacherLandingTeacherInfo,
  fallback: TeacherLandingTeacherInfo
): TeacherLandingTeacherInfo {
  return {
    id: teacher?.id ?? fallback.id,
    slug: ensureString(teacher?.slug, fallback.slug),
    displayName: ensureString(teacher?.displayName, fallback.displayName || ''),
    headline: ensureString(teacher?.headline, fallback.headline || ''),
    bio: ensureString(teacher?.bio, fallback.bio || ''),
    photoUrl: ensureAssetUrl(teacher?.photoUrl, ensureAssetUrl(fallback.photoUrl, '')),
    avatarUrl: ensureAssetUrl(teacher?.avatarUrl, ensureAssetUrl(fallback.avatarUrl, '')),
    updatedAt: teacher?.updatedAt ?? fallback.updatedAt ?? null
  };
}

function normalizeSeo(seo?: TeacherLandingSeo | null, fallback?: TeacherLandingSeo | null): TeacherLandingSeo | null {
  if (!seo && !fallback) {
    return null;
  }
  const base = fallback ?? {};
  const title = ensureString(seo?.title, ensureString(base.title, ''));
  const description = ensureString(seo?.description, ensureString(base.description, ''));
  if (!title && !description) {
    return null;
  }
  return { title, description };
}

function normalizeCourses(
  courses: TeacherLandingCourse[] | undefined,
  fallbackCourses: TeacherLandingCourse[]
): TeacherLandingCourse[] {
  const normalized = (courses ?? [])
    .filter((course) => ensureString(course?.title, '').length > 0)
    .map((course) => ({
      ...course,
      currency: course.currency ? course.currency.toUpperCase() : course.currency
    }));
  return normalized.length ? normalized : fallbackCourses;
}

function normalizeTestimonials(
  testimonials: TeacherLandingTestimonial[] | undefined,
  fallbackTestimonials: TeacherLandingTestimonial[]
): TeacherLandingTestimonial[] {
  const normalized = (testimonials ?? []).filter(
    (testimonial) => ensureString(testimonial?.author, '').length > 0 && ensureString(testimonial?.quote, '').length > 0
  );
  return normalized.length ? normalized : fallbackTestimonials;
}

const currentTemplate = computed<'modern' | 'minimal' | 'classic'>(() => {
  const candidate = ensureString(landing.value.template as string | null | undefined, '').toLowerCase();
  if (candidate === 'minimal' || candidate === 'classic') {
    return candidate;
  }
  return 'modern';
});

const templateComponentMap = {
  modern: TeacherTemplateModern,
  minimal: TeacherTemplateMinimal,
  classic: TeacherTemplateClassic
} as const;

const currentTemplateComponent = computed(() => templateComponentMap[currentTemplate.value] ?? TeacherTemplateModern);

const pageData = computed(() => ({
  landing: landing.value
}));

const COURSE_TYPE_SEGMENTS = ['course', 'record', 'live', 'blend', 'cohort', 'bootcamp'];

const courses = computed(() => {
  const filtered = landing.value.courses.filter((course) => {
    const normalizedType = ensureString(course.type, '').trim().toLowerCase();
    if (!normalizedType) {
      return true;
    }

    if (COURSE_TYPE_SEGMENTS.some((segment) => normalizedType.includes(segment))) {
      return true;
    }

    const tags = Array.isArray(course.tags) ? course.tags : [];
    return tags.some((tag) => {
      const normalizedTag = ensureString(tag as string | null | undefined, '').toLowerCase();
      return COURSE_TYPE_SEGMENTS.some((segment) => normalizedTag.includes(segment));
    });
  });

  return filtered;
});

const loading = computed(() => store.loading);

const brandAvatarUrl = computed(() => {
  const candidate =
    landing.value.teacher.photoUrl?.trim() || landing.value.teacher.avatarUrl?.trim() || '';
  if (!candidate || brandAvatarError.value) {
    return '';
  }
  return withCacheBusting(candidate, landing.value.teacher.updatedAt ?? undefined);
});

const brandInitials = computed(() => {
  const source = landing.value.teacher.displayName || landing.value.teacher.slug || '';
  return source
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('')
    .trim() || '?';
});

function getInitials(name: string | undefined) {
  const source = typeof name === 'string' ? name : '';
  return source
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('')
    .trim() || '?';
}

watch(
  () => [landing.value.teacher.photoUrl, landing.value.teacher.avatarUrl, landing.value.teacher.updatedAt],
  () => {
    brandAvatarError.value = false;
  }
);

function handleBrandAvatarError() {
  brandAvatarError.value = true;
}

  const heroSection = computed<TeacherLandingSection | undefined>(() =>
    landing.value.sections.find((section) => section.type === 'hero')
  );
  const COVER_THEME_IDS = ['c1', 'c2', 'c3'] as const;
  type CoverThemeId = (typeof COVER_THEME_IDS)[number];
  const COVER_THEME_PREFIX = 'theme:';
  const extractCoverThemeFromImageUrl = (value: string | null | undefined): CoverThemeId | '' => {
    const candidate = ensureString(value, '').trim();
    if (!candidate.startsWith(COVER_THEME_PREFIX)) {
      return '';
    }
    const theme = candidate.slice(COVER_THEME_PREFIX.length).trim();
    return COVER_THEME_IDS.includes(theme as CoverThemeId) ? (theme as CoverThemeId) : '';
  };
  const activeCoverTheme = computed<CoverThemeId | ''>(() => {
    const heroCandidate = ensureString(
      (heroSection.value as TeacherLandingSection | undefined)?.coverTheme as string | undefined,
      ''
    ).trim();
    if (COVER_THEME_IDS.includes(heroCandidate as CoverThemeId)) {
      return heroCandidate as CoverThemeId;
    }

    const heroThemeFromImage = extractCoverThemeFromImageUrl(heroSection.value?.imageUrl);
    if (heroThemeFromImage) {
      return heroThemeFromImage;
    }

    const landingHero = (landing.value as Record<string, unknown> | undefined)?.hero as Record<string, unknown> | undefined;
    const landingBrandingHero = (landing.value as Record<string, unknown> | undefined)?.branding as Record<string, unknown> | undefined;
    const landingBrandingHeroTheme =
      (landingBrandingHero?.hero as Record<string, unknown> | undefined)?.coverTheme as string | undefined;

    const tenantHero = tenantStore.branding?.landing?.content?.hero as Record<string, unknown> | undefined;
    const tenantBrandingHero = tenantStore.branding?.branding?.hero as Record<string, unknown> | undefined;

    const fallbackCandidate = ensureString(
      landingHero?.coverTheme as string | undefined,
      ensureString(
        landingBrandingHeroTheme,
        ensureString(
          (tenantHero?.coverTheme as string | undefined) ?? (tenantBrandingHero?.coverTheme as string | undefined),
          ''
        )
      )
    ).trim();

    return COVER_THEME_IDS.includes(fallbackCandidate as CoverThemeId) ? (fallbackCandidate as CoverThemeId) : '';
  });
const aboutSection = computed<TeacherLandingSection | undefined>(() =>
  landing.value.sections.find((section) => section.type === 'about')
);
const contactSection = computed<TeacherLandingSection | undefined>(() =>
  landing.value.sections.find((section) => section.type === 'contact')
);

const DEFAULT_SECTION_ORDER = ['hero', 'about', 'courses', 'testimonials'];
const sectionOrder = computed(() => {
  const ordered = landing.value.sections
    .map((section) => ensureString(section.type, '').trim().toLowerCase())
    .filter((type) => type.length && type !== 'contact');
  const unique = Array.from(new Set(ordered));
  return [...unique, ...DEFAULT_SECTION_ORDER.filter((type) => !unique.includes(type))];
});

const hideHeader = true;

  const heroCoverStyle = computed(() => {
    if (activeCoverTheme.value) {
      return {};
    }
    const cover = heroImageSrc.value || selectedBg.value || '';
    if (!cover) {
      return {};
    }
    return {
      backgroundImage: `url(${cover})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    } as Record<string, string>;
  });

type HeroCtaAction = 'register' | 'login' | 'custom';
type ContactCtaAction = 'register' | 'login' | 'custom';

const profileHeadline = computed(() =>
  ensureString(
    landing.value.teacher.headline,
    ensureString(heroSection.value?.subtitle, '')
  )
);

const profileBio = computed(() =>
  ensureString(
    landing.value.teacher.bio,
    ensureString(aboutSection.value?.description, ensureString(heroSection.value?.description, ''))
  )
);

const heroTitle = computed(() =>
  ensureString(
    heroSection.value?.title,
    ensureString(landing.value.teacher.displayName, landing.value.teacher.slug)
  )
);

const heroSubtitle = computed(() =>
  ensureString(heroSection.value?.subtitle, ensureString(landing.value.teacher.headline, ''))
);

const heroDescription = computed(() =>
  ensureString(heroSection.value?.description, ensureString(profileBio.value, ''))
);

  const heroImageSrc = computed(() => {
    const imageValue = ensureString(heroSection.value?.imageUrl, '').trim();
    if (extractCoverThemeFromImageUrl(imageValue)) {
      return '';
    }
    const cover = ensureAssetUrl(imageValue, '');
    if (cover) {
      return withCacheBusting(cover, landing.value.teacher.updatedAt ?? undefined);
    }
  if (coverImage.value) {
    return coverImage.value;
  }
  if (brandAvatarUrl.value) {
    return brandAvatarUrl.value;
  }
  return selectedBg.value || '';
});

const contactTitle = computed(() =>
  ensureString(
    contactSection.value?.title,
    t('teacherLanding.contact.title', { name: landing.value.teacher.displayName })
  )
);

const contactSubtitle = computed(() =>
  ensureString(contactSection.value?.subtitle, t('teacherLanding.contact.subtitle'))
);

const contactCtaText = computed(() =>
  ensureString(contactSection.value?.ctaText, t('teacherLanding.contact.register'))
);

const contactCtaAction = computed<ContactCtaAction>(() => {
  const action = ensureString(contactSection.value?.ctaAction, '');
  return action === 'login' || action === 'custom' ? action : 'register';
});

const contactCtaHref = computed(() => ensureString(contactSection.value?.ctaHref, ''));

const heroHighlights = computed(() => {
  const highlights = (heroSection.value?.highlights ?? aboutSection.value?.highlights ?? []) as Array<string | null>;
  return highlights
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length)
    .slice(0, 6);
});

const heroStats = computed(() => {
  const stats = heroSection.value?.stats ?? [];
  return stats
    .map((stat) => ({
      label: stat?.label ? String(stat.label).trim() : '',
      value: stat?.value ? String(stat.value).trim() : ''
    }))
    .filter((stat) => stat.label && stat.value)
    .slice(0, 4);
});

const trustItems = computed(() =>
  [
    t('teacherLanding.trust.items.0'),
    t('teacherLanding.trust.items.1'),
    t('teacherLanding.trust.items.2')
  ].filter((item) => ensureString(item, '').length > 0)
);

const resetInquiryErrors = () => {
  inquiryErrors.name = '';
  inquiryErrors.phone = '';
  inquiryErrors.email = '';
  inquiryErrors.message = '';
};

const submitInquiry = async () => {
  if (inquirySubmitting.value) {
    return;
  }
  resetInquiryErrors();
  const name = inquiryForm.name.trim();
  const phone = inquiryForm.phone.trim();
  const email = inquiryForm.email.trim();
  const message = inquiryForm.message.trim();

  if (!name) {
    inquiryErrors.name = t('teacherLanding.inquiry.validation.nameRequired');
  }
  if (!phone) {
    inquiryErrors.phone = t('teacherLanding.inquiry.validation.phoneRequired');
  }
  if (!email) {
    inquiryErrors.email = t('teacherLanding.inquiry.validation.emailRequired');
  }
  if (!message) {
    inquiryErrors.message = t('teacherLanding.inquiry.validation.messageRequired');
  }

  if (inquiryErrors.name || inquiryErrors.phone || inquiryErrors.email || inquiryErrors.message) {
    return;
  }

  inquirySubmitting.value = true;
  try {
    await submitLandingInquiry({
      name,
      email,
      phone,
      message,
      teacherSlug: landing.value.teacher.slug || landingSlug.value,
      route: route.fullPath
    });
    inquiryForm.name = '';
    inquiryForm.phone = '';
    inquiryForm.email = '';
    inquiryForm.message = '';
    toast.success(t('teacherLanding.inquiry.success'));
  } catch (error) {
    console.error('[TeacherLandingView] failed to submit inquiry', error);
    toast.error(t('teacherLanding.inquiry.error'));
  } finally {
    inquirySubmitting.value = false;
  }
};

const DEFAULT_FEATURE_ICONS = ['⏱️', '💸', '🎓', '🧑‍🏫', '📚', '🧩'];

const featuresList = computed(() => {
  const highlightSource = aboutSection.value?.highlights ?? heroSection.value?.highlights ?? heroHighlights.value;
  const normalized = (highlightSource ?? [])
    .map((item) => ensureString(item, '').trim())
    .filter((item) => item.length)
    .slice(0, 6);

  if (!normalized.length) {
    return [
      {
        icon: DEFAULT_FEATURE_ICONS[0],
        title: t('teacherLanding.defaults.hero.highlights.interactive'),
        description: t('teacherLanding.defaults.about.highlights.curriculum')
      },
      {
        icon: DEFAULT_FEATURE_ICONS[1],
        title: t('teacherLanding.defaults.hero.highlights.mentors'),
        description: t('teacherLanding.defaults.about.highlights.support')
      },
      {
        icon: DEFAULT_FEATURE_ICONS[2],
        title: t('teacherLanding.defaults.hero.highlights.projects'),
        description: t('teacherLanding.defaults.about.highlights.outcomes')
      }
    ];
  }

  return normalized.map((title, index) => ({
    icon: DEFAULT_FEATURE_ICONS[index % DEFAULT_FEATURE_ICONS.length],
    title,
    description: normalized[(index + 1) % normalized.length]
  }));
});

function formatPrice(value: number | null | undefined, currencyCode: string | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return t('teacherLanding.hero.cta');
  }
  const currency = ensureString(currencyCode, 'USD').toUpperCase();
  try {
    return new Intl.NumberFormat(activeLocale.value || 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(value);
  } catch (error) {
    return `${value} ${currency}`;
  }
}

function resolveCourseImage(course: TeacherLandingCourse): string {
  const cover = ensureAssetUrl(course.coverUrl, '');
  if (cover) {
    return cover;
  }
  if (coverImage.value) {
    return coverImage.value;
  }
  if (heroImageSrc.value) {
    return heroImageSrc.value;
  }
  return selectedBg.value || '';
}

function resolveCourseTooltip(course: TeacherLandingCourse): string {
  const record = course as Record<string, unknown> | null | undefined;
  const candidate =
    ensureString(record?.['description'], '') ||
    ensureString(record?.['details'], '') ||
    ensureString(record?.['summary'], '') ||
    ensureString(course.subtitle, '');
  return ensureString(candidate, '').trim();
}

function formatCourseTooltip(value: string): string[] {
  const cleaned = ensureString(value, '').trim();
  if (!cleaned) {
    return [];
  }
  const byLines = cleaned
    .split(/\r?\n/)
    .map((item) => item.replace(/^[-•\u2022]+\s*/g, '').trim())
    .filter(Boolean);
  if (byLines.length > 1) {
    return byLines;
  }
  const byBullets = cleaned
    .split(/[•\u2022]/)
    .map((item) => item.replace(/^[-•\u2022]+\s*/g, '').trim())
    .filter(Boolean);
  return byBullets.length > 1 ? byBullets : byLines;
}

function resolveApplicableOffers(course: TeacherLandingCourse): OfferResponse[] {
  const courseId = resolveCourseIdNumber(course);
  const activeOffers = offers.value.filter((offer) => offer.status === 'CURRENT');
  if (!activeOffers.length) {
    return [];
  }
  return activeOffers.filter((offer) => {
    if (offer.applicability === 'ALL_COURSES') {
      return true;
    }
    if (offer.applicability !== 'SPECIFIC_COURSES') {
      return false;
    }
    if (!courseId || !Array.isArray(offer.courses)) {
      return false;
    }
    return offer.courses.some((item) => Number(item.id) === courseId);
  });
}

function resolveBestDiscount(course: TeacherLandingCourse): {
  discountedPrice?: number;
  discountAmount?: number;
  offer?: OfferResponse;
} {
  if (typeof course.price !== 'number' || Number.isNaN(course.price)) {
    return {};
  }
  const price = course.price;
  let bestDiscount = 0;
  let bestOffer: OfferResponse | undefined;
    for (const offer of resolveApplicableOffers(course)) {
      let discount = 0;
      if (offer.type === 'PERCENTAGE' && typeof offer.percentage === 'number') {
        discount = (price * offer.percentage) / 100;
      } else if (offer.type === 'FIXED' && typeof offer.amount === 'number') {
        discount = offer.amount;
      } else if (offer.type === 'BUNDLE' && typeof offer.bundlePrice === 'number') {
        discount = Math.max(0, price - offer.bundlePrice);
      }
      if (discount > bestDiscount) {
        bestDiscount = discount;
        bestOffer = offer;
      }
    }
  if (!bestOffer || bestDiscount <= 0) {
    return {};
  }
  const discountedPrice = Math.max(0, price - bestDiscount);
  return { discountedPrice, discountAmount: bestDiscount, offer: bestOffer };
}

function resolveOfferEnd(offer?: OfferResponse): number | null {
  const value = offer?.validUntil;
  if (!value) {
    return null;
  }
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return null;
  }
  return timestamp;
}

function formatCountdown(endAt: number | null): string {
  if (!endAt) {
    return '';
  }
  const diff = Math.max(0, endAt - countdownNow.value);
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const featuredCourses = computed(() => {
  const items = courses.value;
  if (!items.length) {
    return [] as Array<{
      id: string | null | undefined;
      title: string;
      subtitle: string;
      tooltip: string;
      level: string;
      ratingLabel: string;
    priceLabel: string;
    originalPriceLabel?: string;
    hasDiscount: boolean;
    offerEndsAt?: number | null;
    image: string;
    raw: TeacherLandingCourse;
  }>;
  }

    const mapped = items.map((course, index) => {
      const detailDiscount = resolveBestDiscountFromCourseOffers(course);
      const fallbackDiscount = resolveBestDiscount(course);
      const usingCourseOffers = typeof detailDiscount.discountedPrice === 'number';
      const discount = usingCourseOffers ? detailDiscount : fallbackDiscount;
      const hasDiscount = typeof discount.discountedPrice === 'number';
      const currentPrice = hasDiscount ? discount.discountedPrice : course.price ?? null;
      const offerEndsAt = hasDiscount
        ? usingCourseOffers
          ? resolveCourseOfferEnd(detailDiscount.offer)
          : resolveOfferEnd((discount as { offer?: OfferResponse }).offer)
        : null;
      return {
        id: course.id,
        title: course.title,
        subtitle: ensureString(course.subtitle, ''),
        tooltip: resolveCourseTooltip(course),
        level: ensureString(course.type, t('teacherLanding.navigation.courses')),
        ratingLabel: String((landing.value.testimonials?.length ?? 0) + index + 1),
        priceLabel: formatPrice(currentPrice as number | null | undefined, course.currency ?? null),
        originalPriceLabel: hasDiscount ? formatPrice(course.price ?? null, course.currency ?? null) : undefined,
        hasDiscount,
        offerEndsAt,
        image: resolveCourseImage(course),
        raw: course
      };
    });

    const getPriceForSort = (item: typeof mapped[number]) => {
      const detailDiscount = resolveBestDiscountFromCourseOffers(item.raw);
      const fallbackDiscount = resolveBestDiscount(item.raw);
      const discount = typeof detailDiscount.discountedPrice === 'number' ? detailDiscount : fallbackDiscount;
      const price = item.hasDiscount
        ? item.raw.price != null
          ? item.raw.price - (discount.discountAmount ?? 0)
          : -Infinity
        : item.raw.price ?? -Infinity;
      return typeof price === 'number' && Number.isFinite(price) ? price : -Infinity;
    };

  return mapped.slice().sort((a, b) => getPriceForSort(b) - getPriceForSort(a));
});

const mentorAvatarFallbacks = [
  'https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80'
];

const mentorsList = computed(() => {
  const mentors: Array<{ name: string; role: string; quote: string; avatar: string }> = [
    {
      name: ensureString(landing.value.teacher.displayName, landing.value.teacher.slug),
      role: ensureString(landing.value.teacher.headline, t('teacherLanding.navigation.about')),
      quote: ensureString(heroDescription.value, ''),
      avatar: heroImageSrc.value || mentorAvatarFallbacks[0]
    }
  ];

  const testimonialMentors = (landing.value.testimonials ?? [])
    .slice(0, 2)
    .map((item, index) => ({
      name: ensureString(item.author, ''),
      role: t('teacherLanding.navigation.testimonials'),
      quote: ensureString(item.quote, ''),
      avatar: mentorAvatarFallbacks[(index + 1) % mentorAvatarFallbacks.length]
    }))
    .filter((item) => item.name && item.quote);

  return [...mentors, ...testimonialMentors].slice(0, 3);
});

type LandingFaqItem = { id?: number; question?: string; answer?: string; locale?: string | null };
const faqItems = computed<LandingFaqItem[]>(() => {
  const raw = (landing.value as Record<string, any> | null | undefined)?.faqs;
  if (!Array.isArray(raw)) {
    return [];
  }
  const active = activeLocale.value;
  return raw
    .filter((item) => item && typeof item === 'object')
    .filter((item) => {
      const question = ensureString((item as LandingFaqItem).question, '').trim();
      const answer = ensureString((item as LandingFaqItem).answer, '').trim();
      return question.length && answer.length;
    })
    .filter((item) => {
      const localeValue = ensureString((item as LandingFaqItem).locale, '').trim();
      if (!localeValue) return true;
      return normalizeLocale(localeValue) === active;
    });
});


  
function scrollToSection(hash: string) {
  if (typeof document === 'undefined' || !hash?.startsWith('#')) {
    return false;
  }
  const target = document.querySelector(hash);
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return true;
}

function routerPushSafe(to: Parameters<typeof router.push>[0]) {
  return router.push(to).catch(() => undefined);
}

function handleExploreLessonsClick(event: Event) {
  const href = cta.value.href;
  if (!href) {
    return;
  }
  trackLandingEvent('hero_primary_custom');
  if (href.startsWith('#')) {
    event.preventDefault();
    if (scrollToSection(href) && typeof window !== 'undefined') {
      const pageTitle = typeof document !== 'undefined' ? document.title : '';
      window.history.replaceState(null, pageTitle, href);
    }
  }
}

const cta = computed(() => ({
  text: heroSection.value?.ctaText,
  href: heroSection.value?.ctaHref || DEFAULT_COURSES_HASH
}));

const primaryCtaText = computed(() =>
  ensureString(cta.value.text, t('teacherLanding.hero.cta'))
);

const primaryCtaAction = computed<HeroCtaAction>(() => {
  const action = heroSection.value?.ctaAction;
  if (action === 'login' || action === 'custom') {
    return action;
  }
  return 'register';
});

const secondaryCta = computed<'register' | 'login'>(() =>
  primaryCtaAction.value === 'login' ? 'register' : 'login'
);

const resolveFooterContactHref = (key: keyof TeacherLandingFooterContact, rawValue: unknown): string => {
  const candidate = ensureString(rawValue as string | null | undefined, '');
  if (!candidate) {
    return '';
  }

  if (key === 'whatsapp') {
    const digits = candidate.replace(/[^\d]/g, '');
    if (!digits) {
      return '';
    }
    return `https://wa.me/${digits}`;
  }

  if (key === 'phone') {
    const digits = candidate.replace(/[^\d]/g, '');
    return digits ? `tel:${digits}` : '';
  }

  if (key === 'email') {
    return candidate.includes('@') ? `mailto:${candidate}` : '';
  }

  if (/^https?:\/\//i.test(candidate)) {
    return candidate;
  }

  return `https://${candidate.replace(/^\/+/, '')}`;
};

const footerContactLinks = computed(() => {
  const contact = landing.value.footerContact;
  if (!contact) {
    return [] as Array<{ href: string; label: string; value: string; key: string }>;
  }
  const map: Array<[keyof TeacherLandingFooterContact, string]> = [
    ['whatsapp', 'teacherLanding.footerContact.whatsapp'],
    ['phone', 'teacherLanding.footerContact.phone'],
    ['email', 'teacherLanding.footerContact.email'],
    ['website', 'teacherLanding.footerContact.website'],
    ['facebook', 'teacherLanding.footerContact.facebook'],
    ['instagram', 'teacherLanding.footerContact.instagram'],
    ['linkedin', 'teacherLanding.footerContact.linkedin'],
    ['telegram', 'teacherLanding.footerContact.telegram']
  ];
  return map
    .map(([key, labelKey]) => {
      const value = ensureString(contact[key] as string | null | undefined, '').trim();
      if (!value) return null;
      const href = resolveFooterContactHref(key, value);
      return {
        href,
        label: t(labelKey),
        value,
        key: String(key)
      };
    })
    .filter((item): item is { href: string; label: string; value: string; key: string } => Boolean(item));
});

function getSocialShort(item: { href: string; label: string }): string {
  const label = ensureString(item.label, '').toLowerCase();
  if (label.includes('whatsapp')) return 'WA';
  if (label.includes('telegram')) return 'TG';
  if (label.includes('youtube')) return 'YT';
  if (label.includes('facebook')) return 'FB';
  if (label.includes('instagram')) return 'IG';
  if (label.includes('tiktok')) return 'TT';
  if (label.includes('website')) return 'WB';
  if (label.includes('linkedin')) return 'IN';
  if (label.includes('email')) return 'EM';
  if (label.includes('phone')) return 'PH';

  try {
    const hostname = new URL(item.href, 'http://localhost').hostname.toLowerCase();
    if (hostname.includes('wa.me') || hostname.includes('whatsapp')) return 'WA';
    if (hostname.includes('t.me') || hostname.includes('telegram')) return 'TG';
    if (hostname.includes('youtu')) return 'YT';
    if (hostname.includes('facebook')) return 'FB';
    if (hostname.includes('instagram')) return 'IG';
    if (hostname.includes('tiktok')) return 'TT';
    if (hostname.includes('linkedin')) return 'IN';
  } catch (error) {
    // fall through to default
  }

  return ensureString(item.label, '?').slice(0, 2).toUpperCase();
}

const SOCIAL_ICON_MAP: Record<string, string> = {
  facebook: new URL('@/assets/social icons/Platform=Facebook, Color=Original.svg', import.meta.url).href,
  github: new URL('@/assets/social icons/Platform=Github, Color=Original.svg', import.meta.url).href,
  instagram: new URL('@/assets/social icons/Platform=Instagram, Color=Original.svg', import.meta.url).href,
  linkedin: new URL('@/assets/social icons/Platform=LinkedIn, Color=Original.svg', import.meta.url).href,
  telegram: new URL('@/assets/social icons/Platform=Telegram, Color=Original.svg', import.meta.url).href,
  whatsapp: new URL('@/assets/social icons/Platform=WhatsApp, Color=Original.svg', import.meta.url).href,
  youtube: new URL('@/assets/social icons/Platform=YouTube, Color=Original.svg', import.meta.url).href
};
const CONTACT_ICON = new URL('@/assets/social icons/contact.svg', import.meta.url).href;

const resolveSocialIcon = (key: string, href: string): string | null => {
  if (SOCIAL_ICON_MAP[key]) {
    return SOCIAL_ICON_MAP[key];
  }
  if (key === 'website' && /github\.com/i.test(href)) {
    return SOCIAL_ICON_MAP.github;
  }
  return null;
};

const footerSocialLinks = computed(() => {
  return footerContactLinks.value
    .filter((item) => item.href)
    .map((item) => {
      const icon = resolveSocialIcon(item.key, item.href);
      if (!icon) return null;
      return {
        ...item,
        icon,
        short: getSocialShort(item)
      };
    })
    .filter((item): item is { href: string; label: string; value: string; key: string; icon: string; short: string } => Boolean(item));
});

const footerPhoneLink = computed(() => footerContactLinks.value.find((item) => item.key === 'phone') ?? null);
const showFooterPhone = ref(false);

function onNewsletterSubmit() {
  trackLandingEvent('footer_newsletter_submit');
  void routerPushSafe(studentRegisterRoute.value);
}

const JSON_LD_SCRIPT_ID = 'teacher-landing-jsonld';

const setMetaElement = (attribute: 'name' | 'property', key: string, content: string) => {
  if (typeof document === 'undefined' || !key) {
    return;
  }
  let element = document.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
};

const removeMetaElement = (attribute: 'name' | 'property', key: string) => {
  if (typeof document === 'undefined') {
    return;
  }
  const element = document.querySelector(`meta[${attribute}="${key}"]`);
  if (element?.parentNode) {
    element.parentNode.removeChild(element);
  }
};

const updateSeoMeta = (value: TeacherLandingPublicResponse) => {
  if (typeof document === 'undefined') {
    return;
  }
  const teacherName = ensureString(value.teacher.displayName, value.teacher.slug);
  const fallbackTitle = teacherName
    ? `${teacherName} - ${t('teacherLanding.meta.suffix')}`
    : t('teacherLanding.meta.suffix');
  const title = ensureString(value.seo?.title, fallbackTitle);
  document.title = title;

  const description = ensureString(
    value.seo?.description,
    ensureString(value.teacher.bio, ensureString(value.teacher.headline, ''))
  );

  if (description) {
    setMetaElement('name', 'description', description);
  } else {
    removeMetaElement('name', 'description');
  }

  if (title) {
    setMetaElement('property', 'og:title', title);
  }
  if (description) {
    setMetaElement('property', 'og:description', description);
  } else {
    removeMetaElement('property', 'og:description');
  }
  setMetaElement('property', 'og:type', 'website');
  setMetaElement('name', 'twitter:card', 'summary_large_image');
  if (typeof window !== 'undefined') {
    setMetaElement('property', 'og:url', `${window.location.origin}${window.location.pathname}`);
  }

  const brandingData = (tenantStore.branding?.branding ?? {}) as Record<string, unknown>;
  const brandingSeo = (brandingData.seo ?? {}) as Record<string, unknown>;
  const valueSeo = (value.seo ?? {}) as Record<string, unknown>;
  const brandingOgImage = ensureString(
    (valueSeo.ogImage as string | undefined) ||
      (valueSeo.image as string | undefined) ||
      (brandingSeo.ogImage as string | undefined) ||
      (brandingSeo.image as string | undefined) ||
      (brandingData.ogImage as string | undefined),
    ''
  );
  const ogImage = ensureString(brandingOgImage, ensureString(brandAvatarUrl.value, ensureString(selectedBg.value, '')));
  if (ogImage) {
    setMetaElement('property', 'og:image', ogImage);
    setMetaElement('name', 'twitter:image', ogImage);
  } else {
    removeMetaElement('property', 'og:image');
    removeMetaElement('name', 'twitter:image');
  }
  if (title) {
    setMetaElement('name', 'twitter:title', title);
  }
  if (description) {
    setMetaElement('name', 'twitter:description', description);
  } else {
    removeMetaElement('name', 'twitter:description');
  }
};

const updateJsonLdMeta = (value: TeacherLandingPublicResponse, courseItems: TeacherLandingCourse[]) => {
  if (typeof document === 'undefined') {
    return;
  }

  const existing = document.getElementById(JSON_LD_SCRIPT_ID) as HTMLScriptElement | null;
  const script = existing ?? document.createElement('script');
  script.type = 'application/ld+json';
  script.id = JSON_LD_SCRIPT_ID;

  const organizationName = ensureString(value.teacher.displayName, value.teacher.slug);
  const description = ensureString(
    value.seo?.description,
    ensureString(value.teacher.bio, ensureString(value.teacher.headline, ''))
  );
  const pageUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
  const organization: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: organizationName || undefined,
    description: description || undefined,
    url: pageUrl || undefined,
    logo: ensureString(brandAvatarUrl.value, '') || undefined
  };

  const footerContact = value.footerContact;
  const sameAs = footerContact
    ? (Object.keys(footerContact) as Array<keyof TeacherLandingFooterContact>)
        .map((key) => resolveFooterContactHref(key, footerContact[key]))
        .filter((href) => ensureString(href, '').length > 0)
    : [];
  if (sameAs.length > 0) {
    organization.sameAs = sameAs;
  }

  const personName = ensureString(value.teacher.displayName, value.teacher.slug);
  const personDescription = ensureString(value.teacher.bio, value.teacher.headline);
  const personImage = ensureString(value.teacher.photoUrl, value.teacher.avatarUrl ?? '');
  const person: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: personName || undefined,
    description: personDescription || undefined,
    jobTitle: ensureString(value.teacher.headline, '') || undefined,
    url: pageUrl || undefined,
    image: personImage || undefined,
    worksFor: organizationName ? { '@type': 'Organization', name: organizationName } : undefined
  };
  if (sameAs.length > 0) {
    person.sameAs = sameAs;
  }

  const courseElements = courseItems
    .filter((course) => ensureString(course?.title, '').length > 0)
    .map((course, index) => ({
      '@type': 'Course',
      name: ensureString(course.title, ''),
      description: ensureString(course.subtitle, ''),
      position: index + 1
    }));

  const payload: Array<Record<string, unknown>> = [organization, person];

    if (courseElements.length > 0) {
      payload.push({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: organizationName ? `${organizationName} Courses` : undefined,
        itemListElement: courseElements
      });
    }

    script.textContent = JSON.stringify(payload.length === 1 ? payload[0] : payload, null, 2);

  if (!existing) {
    document.head.appendChild(script);
  }
};

const clearJsonLdScript = () => {
  if (typeof document === 'undefined') {
    return;
  }
  const existing = document.getElementById(JSON_LD_SCRIPT_ID);
  existing?.parentNode?.removeChild(existing);
};

function resolveCourseOfferEnd(offer?: PublicCourseOffer): number | null {
  const value = offer?.validUntil;
  if (!value) {
    return null;
  }
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return null;
  }
  return timestamp;
}

function clearCourseOffers() {
  Object.keys(courseOffers).forEach((key) => {
    delete courseOffers[key];
  });
}

async function loadCourseOffers() {
  clearCourseOffers();
  const teacherSlug = slug.value;
  if (!teacherSlug) {
    return;
  }
  const courseIds = courses.value
    .map((course) => resolveCourseIdNumber(course))
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const uniqueCourseIds = Array.from(new Set(courseIds));
  if (!uniqueCourseIds.length) {
    return;
  }
  await Promise.allSettled(
    uniqueCourseIds.map(async (courseId) => {
      try {
        const { data } = await api.get<{ course?: { offers?: PublicCourseOffer[] } }>(
          `/public/tenants/${teacherSlug}/courses/${courseId}`
        );
        courseOffers[String(courseId)] = Array.isArray(data?.course?.offers) ? data.course.offers : [];
      } catch (error) {
        courseOffers[String(courseId)] = [];
      }
    })
  );
}

function resolveBestDiscountFromCourseOffers(course: TeacherLandingCourse): {
  discountedPrice?: number;
  discountAmount?: number;
  offer?: PublicCourseOffer;
} {
  const courseId = resolveCourseIdNumber(course);
  if (!courseId) {
    return {};
  }
  const offersForCourse = courseOffers[String(courseId)] ?? [];
  if (!offersForCourse.length) {
    return {};
  }
  if (typeof course.price !== 'number' || Number.isNaN(course.price)) {
    return {};
  }
  const price = course.price;
  let bestDiscount = 0;
  let bestOffer: PublicCourseOffer | undefined;
  for (const offer of offersForCourse) {
    let discount = 0;
    if (offer.type === 'PERCENTAGE') {
      discount = (price * offer.value) / 100;
    } else if (offer.type === 'FIXED') {
      discount = offer.value;
    } else if (offer.type === 'BUNDLE') {
      discount = Math.max(0, price - offer.value);
    }
    if (discount > bestDiscount) {
      bestDiscount = discount;
      bestOffer = offer;
    }
  }
  if (!bestOffer || bestDiscount <= 0) {
    return {};
  }
  const discountedPrice = Math.max(0, price - bestDiscount);
  return { discountedPrice, discountAmount: bestDiscount, offer: bestOffer };
}

async function load() {
  if (!slug.value) {
    return;
  }
  localeReady.value = false;
  try {
    await store.load(slug.value, { force: true });
  } catch (error) {
    console.warn('[TeacherLandingView] failed to load landing', error);
  }

  try {
    offersLoading.value = true;
    const data = await fetchPublicTeacherOffers(slug.value);
    offers.value = Array.isArray(data) ? (data as OfferResponse[]) : [];
  } catch (error) {
    offers.value = [];
    console.warn('[TeacherLandingView] failed to load offers', error);
  } finally {
    offersLoading.value = false;
  }

  await loadCourseOffers();

  try {
    await tenantStore.fetchBranding(slug.value);
    await applyPreferredLocale();
  } catch (error) {
    console.warn('[TeacherLandingView] failed to load tenant branding', error);
  } finally {
    localeReady.value = true;
  }
}

watch(slug, async (newSlug, oldSlug) => {
  if (newSlug && newSlug !== oldSlug) {
    await load();
  }
});

onMounted(async () => {
  await load();
  countdownNow.value = Date.now();
  countdownTimer = window.setInterval(() => {
    countdownNow.value = Date.now();
  }, 1000);
});

const selectedBg = ref<string | null>(TEACHER_LANDING_DEFAULT_BG);
const isHeaderCompact = ref(false);
const showFloatingActions = ref(false);

const landingThemeStyle = computed<Record<string, string>>(() => {
  const colors = (tenantStore.branding?.branding?.colors ?? {}) as Record<string, string>;
  const themePrimary = ensureString(landing.value.themePrimary as string | null | undefined, '').trim();
  const themeSecondary = ensureString(landing.value.themeSecondary as string | null | undefined, '').trim();
  const primary = themePrimary || ensureString(colors.primary, '').trim();
  const secondary = themeSecondary || ensureString(colors.secondary, '').trim();
  const accent = ensureString(colors.accent, '').trim();
  const resolvedSecondary = secondary || primary;
  const style: Record<string, string> = {};

  if (primary) {
    style['--teacher-color-primary'] = primary;
  }
  if (resolvedSecondary) {
    style['--teacher-color-secondary'] = resolvedSecondary;
  }
  if (accent) {
    style['--teacher-color-accent'] = accent;
  }
  if (primary || resolvedSecondary) {
    const gradientStart = primary || resolvedSecondary;
    const gradientEnd = resolvedSecondary || primary;
    style['--teacher-gradient'] = `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`;
  }

  return style;
});

const coverImage = computed(() => {
  const candidate = selectedBg.value || '';
  return ensureString(candidate, '');
});

const coverSources = computed(() => {
  const original = coverImage.value;
  if (!original || !/\/original\./i.test(original)) {
    return { lg: '', md: '', sm: '' };
  }
  const buildVariant = (size: string) => original.replace(/\/original\./i, `/${size}.`);
  return {
    lg: buildVariant('1920'),
    md: buildVariant('1440'),
    sm: buildVariant('1024')
  };
});

const coverStyle = computed(() => {
  return {
    backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.18), rgba(15, 23, 42, 0))`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  };
});

const teacherLandingUrl = computed(() => {
  const slugValue = landingSlug.value;
  if (!slugValue) {
    return '';
  }
  if (typeof window !== 'undefined') {
    const { host, isGlobalAppHost } = hostInfo.value;
    if (host && !isGlobalAppHost) {
      return `${window.location.protocol}//${host}/`;
    }
  }
  return buildTenantUrl(slugValue, '/');
});

const teacherLandingDisplayHost = computed(() => {
  const url = teacherLandingUrl.value;
  if (!url) {
    return '';
  }
  try {
    const parsed = new URL(url);
    return parsed.host;
  } catch (error) {
    return url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  }
});

const copyButtonLabel = computed(() => {
  if (copyStatus.value === 'success') {
    return t('teacherLanding.share.copied');
  }
  if (copyStatus.value === 'error') {
    return t('teacherLanding.share.copyFailed');
  }
  return t('teacherLanding.share.copy');
});

const copyStatusMessage = computed(() => {
  if (copyStatus.value === 'success') {
    return t('teacherLanding.share.copied');
  }
  if (copyStatus.value === 'error') {
    return t('teacherLanding.share.copyFailed');
  }
  return '';
});

const clearCopyStatusTimer = () => {
  if (copyResetTimer.value === null) {
    return;
  }
  if (typeof window !== 'undefined') {
    window.clearTimeout(copyResetTimer.value);
  }
  copyResetTimer.value = null;
};

const setCopyStatus = (status: 'success' | 'error') => {
  copyStatus.value = status;
  clearCopyStatusTimer();
  if (typeof window !== 'undefined') {
    copyResetTimer.value = window.setTimeout(() => {
      copyStatus.value = 'idle';
      copyResetTimer.value = null;
    }, 2200);
  }
};

const fallbackCopy = (value: string) => {
  if (typeof document === 'undefined') {
    throw new Error('document unavailable');
  }
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  const success = document.execCommand('copy');
  document.body.removeChild(textarea);
  if (!success) {
    throw new Error('copy failed');
  }
};

const copyLandingUrl = async () => {
  const url = teacherLandingUrl.value;
  if (!url) {
    return;
  }
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
    } else {
      fallbackCopy(url);
    }
    setCopyStatus('success');
  } catch (error) {
    console.warn('[TeacherLandingView] failed to copy url', error);
    setCopyStatus('error');
  }
};

const qrImageSrc = computed(() => {
  const url = teacherLandingUrl.value;
  if (!url) {
    return '';
  }
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`;
});

const onShareToggle = (event: Event) => {
  const target = event.target as HTMLDetailsElement | null;
  if (!target?.open) {
    qrPanelOpen.value = false;
  }
};

const toggleQrPanel = () => {
  qrPanelOpen.value = !qrPanelOpen.value;
};

const canEditLanding = computed(() => {
  if (!auth.isTeacherLike) {
    return false;
  }
  const authSlug = ensureString(auth.tenantSlug ?? '', '').toLowerCase();
  const pageSlug = ensureString(landingSlug.value, '').toLowerCase();
  if (!authSlug || !pageSlug) {
    return false;
  }
  return authSlug === pageSlug;
});

const shareMessage = computed(() =>
  t('teacherLanding.share.message', { teacher: landing.value.teacher.displayName || landing.value.teacher.slug })
);

const shareLinks = computed(() => {
  const url = teacherLandingUrl.value;
  if (!url) {
    return [];
  }
  const encodedUrl = encodeURIComponent(url);
  const encodedMessage = encodeURIComponent(shareMessage.value);
  return [
    {
      id: 'whatsapp',
      label: t('teacherLanding.share.whatsapp'),
      href: `https://wa.me/?text=${encodedMessage}%20${encodedUrl}`
    },
    {
      id: 'telegram',
      label: t('teacherLanding.share.telegram'),
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}`
    },
    {
      id: 'x',
      label: t('teacherLanding.share.x'),
      href: `https://x.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`
    }
  ];
});

  function resolveBackgroundAsset(raw: string | null | undefined): string | null {
    if (typeof raw !== 'string') {
      return null;
    }
    const candidate = raw.trim();
    if (!candidate) {
      return null;
    }
    if (candidate.startsWith(COVER_THEME_PREFIX)) {
      return null;
    }

    if (isBlockedExternalImage(candidate)) {
      return null;
    }

  if (/^(?:https?:)?\/\//i.test(candidate) || candidate.startsWith('data:') || candidate.startsWith('blob:')) {
    return candidate;
  }

  if (candidate.startsWith('/')) {
    return candidate;
  }

  const withoutAlias = candidate
    .replace(/^@\/assets\//, '')
    .replace(/^src\/assets\//, '')
    .replace(/^assets\//, '')
    .replace(/^\.\//, '');

  if (!withoutAlias) {
    return null;
  }

  try {
    return new URL(`../../assets/${withoutAlias}`, import.meta.url).href;
  } catch (error) {
    console.warn(`[TeacherLandingView] unable to resolve background image "${candidate}"`, error);
    return null;
  }
}

watch(
  () => landing.value,
  (value) => {
    updateSeoMeta(value);
  },
  { immediate: true }
);

watch(
  () => [landing.value, courses.value] as const,
  ([landingValue, courseItems]) => {
    updateJsonLdMeta(landingValue, courseItems);
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  clearJsonLdScript();
});

onBeforeUnmount(() => {
  clearCopyStatusTimer();
});

watch(
  () => activeLocale.value,
  () => {
    updateSeoMeta(landing.value);
    updateJsonLdMeta(landing.value, courses.value);
  }
);

watch(
  () => brandAvatarError.value,
  () => {
    updateSeoMeta(landing.value);
    updateJsonLdMeta(landing.value, courses.value);
  }
);

watch(
  () => heroSection.value?.imageUrl,
  (imageUrl) => {
    const resolved = resolveBackgroundAsset(imageUrl);
    selectedBg.value = resolved ?? TEACHER_LANDING_DEFAULT_BG;
    updateSeoMeta(landing.value);
    updateJsonLdMeta(landing.value, courses.value);
  },
  { immediate: true }
);

const onCourseAnalytics = (course: TeacherLandingCourse) => {
  trackLandingEvent('course_click', {
    id: ensureString(course?.id, ''),
    title: ensureString(course?.title, '')
  });
};

function ensureIdentifier(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
}

function resolveCourseIdentifier(course: TeacherLandingCourse): string {
  const record = course as Record<string, unknown> | null | undefined;
  const candidates = [course?.id ?? null, record?.['courseId'] ?? null, record?.['slug'] ?? null];
  for (const candidate of candidates) {
    const identifier = ensureIdentifier(candidate);
    if (identifier) {
      return identifier;
    }
  }
  return '';
}

function resolveCourseIdNumber(course: TeacherLandingCourse): number | null {
  const identifier = resolveCourseIdentifier(course);
  const numeric = Number(identifier);
  if (Number.isFinite(numeric)) {
    return numeric;
  }
  return null;
}

const onCourseClick = (course: TeacherLandingCourse) => {
  const courseId = resolveCourseIdentifier(course);
  const teacherSlug = ensureIdentifier(landing.value.teacher.slug);
  if (!courseId || !teacherSlug) {
    return;
  }
  onCourseAnalytics(course);
  router.push({
    name: 'public-course-detail',
    params: {
      slug: teacherSlug,
      courseId
    }
  });
};

const trackLandingEvent = (eventName: string, payload: Record<string, string> = {}) => {
  if (typeof window === 'undefined') {
    return;
  }
  const dataLayer = (window as unknown as { dataLayer?: Array<Record<string, unknown>> }).dataLayer;
  if (Array.isArray(dataLayer)) {
    dataLayer.push({ event: eventName, ...payload });
  }
};

const handleScroll = () => {
  if (typeof window === 'undefined') {
    return;
  }
  isHeaderCompact.value = window.scrollY > 24;
  showFloatingActions.value = window.scrollY > 320;
};

onMounted(() => {
  handleScroll();
  window.addEventListener('scroll', handleScroll, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
  if (countdownTimer !== null) {
    window.clearInterval(countdownTimer);
    countdownTimer = null;
  }
});

</script>

<style scoped>
.teacher-landing__background {
  position: fixed;
  inset: 0;
  /* primary background image comes from the CSS variable (set by the component) */
  background-image:
    linear-gradient(180deg, rgba(15, 23, 42, 0.02) 0%, transparent 60%),
    radial-gradient(circle at 14% 12%, color-mix(in srgb, var(--teacher-color-primary) 12%, transparent), transparent 52%),
    radial-gradient(circle at 86% 10%, color-mix(in srgb, var(--teacher-color-secondary) 12%, transparent), transparent 56%),
    radial-gradient(circle at 28% 85%, color-mix(in srgb, var(--teacher-color-accent) 10%, transparent), transparent 60%),
    #f4f5fe;
  /* temporarily set to 0 to ensure visibility while debugging stacking contexts */
  z-index: 0;
}

.teacher-landing__background::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(90deg, rgba(15, 23, 42, 0.02) 0.5px, transparent 0.5px),
    linear-gradient(180deg, rgba(15, 23, 42, 0.02) 0.5px, transparent 0.5px),
    radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.5), transparent 55%),
    radial-gradient(circle at 80% 60%, rgba(255, 255, 255, 0.35), transparent 60%);
  background-size: 26px 26px, 26px 26px, auto, auto;
  opacity: 0.45;
  pointer-events: none;
}

.teacher-landing__halo {
  position: fixed;
  border-radius: 999px;
  filter: blur(80px);
  opacity: 0.4;
  z-index: -2;
}

.teacher-landing__halo--one {
  width: 28rem;
  height: 28rem;
  top: -12rem;
  right: -8rem;
  background: radial-gradient(circle, color-mix(in srgb, var(--teacher-color-primary) 45%, transparent), transparent 65%);
}

.teacher-landing__halo--two {
  width: 22rem;
  height: 22rem;
  bottom: 10vh;
  left: -6rem;
  background: radial-gradient(circle, color-mix(in srgb, var(--teacher-color-secondary) 40%, transparent), transparent 60%);
}

.teacher-landing__halo--three {
  width: 18rem;
  height: 18rem;
  top: 28vh;
  right: 12vw;
  background: radial-gradient(circle, color-mix(in srgb, var(--teacher-color-accent) 32%, transparent), transparent 70%);
}

.teacher-landing__wrapper {
  position: relative;
  min-height: 100vh;
  font-family: inherit;
  color: var(--teacher-color-text-primary, #0f172a);
  overflow-x: hidden;
  --teacher-container-max: 1120px;
  --teacher-section-padding: 72px;
  --teacher-section-padding-mobile: 44px;
  --teacher-radius-card: 18px;
  --teacher-radius-button: 12px;
  --teacher-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  --teacher-shadow-hover: 0 14px 40px rgba(0, 0, 0, 0.12);
  --teacher-border: rgba(0, 0, 0, 0.08);
  --teacher-text-body: 16px;
  --modern-primary: var(--teacher-color-primary, #2563eb);
  --modern-dark: #0f172a;
  --modern-gray: #64748b;
  --teacher-surface: rgba(255, 255, 255, 0.95);
  --teacher-surface-strong: rgba(255, 255, 255, 0.98);
  background: #ffffff;
}

.teacher-landing__wrapper--modern .teacher-landing__background,
.teacher-landing__wrapper--modern .teacher-landing__halo {
  display: none;
}

.teacher-landing__wrapper--modern :deep(.teacher-theme__texture) {
  display: none;
}

.teacher-landing__wrapper--minimal {
  --teacher-radius-card: 12px;
  --teacher-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  background: #ffffff;
}

.teacher-landing__wrapper--classic {
  --teacher-radius-card: 14px;
  --teacher-shadow: 0 12px 30px rgba(15, 23, 42, 0.1);
  background: #f9fafb;
}

.teacher-landing__wrapper--minimal .teacher-landing__background,
.teacher-landing__wrapper--minimal .teacher-landing__halo {
  display: none;
}

.teacher-landing__wrapper--classic .teacher-landing__halo {
  opacity: 0.45;
}

.teacher-landing__wrapper--hide-header .teacher-landing__header {
  display: none !important;
}

.teacher-landing__wrapper--hide-header .teacher-landing__modern-hero {
  grid-template-columns: 1fr;
}

.teacher-landing__wrapper--hide-header .teacher-landing__modern-hero-media {
  display: none;
}

.teacher-landing__wrapper--hide-header .teacher-landing__modern-actions {
  justify-content: flex-start;
}

.teacher-landing__wrapper--hide-header .teacher-landing__trust {
  justify-content: flex-start;
}

.teacher-landing__wrapper--hide-header .teacher-landing__modern-hero-text {
  justify-self: start;
  text-align: left;
}

.teacher-landing__wrapper--hide-header .teacher-landing__layout {
  padding: 0 !important;
}

.teacher-landing__wrapper--hide-header .teacher-landing__content {
  margin-top: 0 !important;
  padding-top: 0 !important;
}

.teacher-landing__wrapper--hide-header .teacher-landing__section--hero {
  margin-top: 0 !important;
  padding-top: 0 !important;
}

:global(html),
:global(body),
:global(#app) {
  margin: 0;
  padding: 0;
}

.teacher-landing__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2rem;
  max-width: 100%;
  margin: 0 auto;
  padding: clamp(1.5rem, 3vw, 2rem) 0
    clamp(var(--teacher-section-padding-mobile), 6vw, var(--teacher-section-padding));
  align-items: start;
}

.teacher-landing__content {
  min-width: 0;
}

[dir='rtl'] .teacher-landing__content {
  order: 1;
}

.teacher-landing__header,
.teacher-landing {
  --teacher-header-height: clamp(4rem, 8vw, 4.75rem);

}

.teacher-landing__header {
  position: sticky;
  top: 0;
  z-index: 30;
  /* make header slightly transparent so hero art can be visible */
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--teacher-border);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
  min-height: var(--teacher-header-height);

}

.teacher-landing__header--compact {
  --teacher-header-height: 3.5rem;
}

.teacher-landing__header-inner {
  max-width: var(--teacher-container-max);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1rem clamp(1.25rem, 3vw, 2rem);
}

.teacher-landing__header--compact .teacher-landing__header-inner {
  padding: 0.6rem clamp(1.25rem, 3vw, 2rem);
}

.teacher-landing__header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.teacher-landing__edit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.45rem 0.95rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
  color: var(--teacher-color-text-primary, #0f172a);
  font-weight: 600;
  text-decoration: none;
  border: 1px solid rgba(15, 23, 42, 0.12);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.teacher-landing__edit:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.12);
}

.teacher-landing__edit:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.2);
}

.teacher-landing__language {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 999px;
  border: 1px solid rgba(37, 99, 235, 0.25);
  background: rgba(241, 245, 249, 0.85);
  color: var(--teacher-color-primary, #2563eb);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.teacher-landing__language:hover,
.teacher-landing__language:focus-visible {
  background: rgba(37, 99, 235, 0.18);
  color: var(--teacher-color-primary, #1d4ed8);
  outline: none;
  box-shadow: 0 0 0 3px rgba(191, 219, 254, 0.55);
}

.teacher-landing__brand {
  display: grid;
  gap: 0.15rem;
  align-items: center;
  grid-template-columns: auto 1fr;
}

.teacher-landing__brand-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.85rem;
  margin-right: 0.75rem;
  background: linear-gradient(135deg, var(--teacher-color-primary, #2563eb), var(--teacher-color-secondary, #0ea5e9));
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.35);
  overflow: hidden;
  position: relative;
  grid-row: span 2;
}

.teacher-landing__header--compact .teacher-landing__brand-avatar {
  width: 2.1rem;
  height: 2.1rem;
  margin-right: 0.6rem;
  border-radius: 0.7rem;
}

.teacher-landing__brand-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.teacher-landing__brand-avatar-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 1.1rem;
  color: #fff;
  text-transform: uppercase;
}

.teacher-landing__brand-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--teacher-color-text-primary, #1f2937);
  grid-column: 2;

}

.teacher-landing__header--compact .teacher-landing__brand-name {
  font-size: 1rem;
}

.teacher-landing__brand-tagline {
  font-size: 0.9rem;
  color: var(--teacher-color-text-secondary, #64748b);
  grid-column: 2;
}

.teacher-landing__header--compact .teacher-landing__brand-tagline {
  font-size: 0.8rem;
}
.teacher-landing__nav {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.35rem;
  border-radius: 999px;
  background: rgba(241, 245, 249, 0.75);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);

}

.teacher-landing__header--compact .teacher-landing__nav-link {
  padding: 0.45rem 0.95rem;
  font-size: 0.9rem;
}

.teacher-landing__nav-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.55rem 1.2rem;

  border-radius: 999px;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  color: var(--teacher-color-text-primary, #111827);
  transition: color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;

}

.teacher-landing__nav-link::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: rgba(255, 255, 255, 0.9);
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: -1;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}

.teacher-landing__nav-link:hover {
  color: var(--teacher-color-primary, #2563eb);
  transform: translateY(-1px);
}

.teacher-landing__nav-link:hover::after {
  opacity: 1;
}

.teacher-landing__nav-link:focus-visible {
  outline: none;
  color: var(--teacher-color-primary, #2563eb);
  transform: translateY(-1px);
}

.teacher-landing__nav-link:focus-visible::after {

  opacity: 1;
}

.teacher-landing__nav-link--cta {
  background: linear-gradient(135deg, var(--teacher-color-primary, #2563eb), var(--teacher-color-secondary, #0ea5e9));
  color: #fff;
  border-radius: 0.9rem;
  box-shadow: 0 12px 22px rgba(37, 99, 235, 0.22);
}

.teacher-landing__nav-link--cta::after {
  display: none;
}

.teacher-landing__nav-link--cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 34px rgba(37, 99, 235, 0.3);
}

.teacher-landing__nav-link--cta:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.7), 0 0 0 6px rgba(37, 99, 235, 0.35);
  transform: translateY(-1px);

}

.teacher-landing__nav-link--ghost {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.4);
  color: var(--teacher-color-text-primary, #111827);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.teacher-landing__nav-link--ghost::after {
  background: rgba(255, 255, 255, 0.95);
}

.teacher-landing__nav-link--ghost:hover {
  color: var(--teacher-color-primary, #2563eb);
  box-shadow: 0 16px 28px rgba(15, 23, 42, 0.12);
}

.teacher-landing__nav-link--ghost:focus-visible {
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.35);
}

.teacher-landing {
  position: relative;
  display: grid;
  gap: 0;
  padding: 0;
  max-width: 100%;
  margin: 0;
  font-family: inherit; /* inherit Cairo from ThemeProvider */
  overflow-x: hidden;
}

.teacher-landing__section {
  position: relative;
  display: grid;
  gap: 1.5rem;
  scroll-margin-top: calc(var(--teacher-header-height) + 1rem);
  padding-block: var(--teacher-section-padding);

}

.teacher-landing__section--features,
.teacher-landing__section--courses {
  padding-block: clamp(
    calc(var(--teacher-section-padding-mobile) * 0.125),
    3vw,
    calc(var(--teacher-section-padding) * 0.125)
  );
}

.teacher-landing__section--features {
  padding-top: clamp(
    calc(var(--teacher-section-padding-mobile) * 0.25),
    2vw,
    calc(var(--teacher-section-padding) * 0.25)
  );
}

.teacher-landing__section--hero {
  padding: 0;
  position: relative;
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  background: #ffffff;
  display: block;
  overflow-x: clip;
}

.teacher-landing__section--hero .teacher-landing__container {
  max-width: var(--teacher-container-max);
  width: 100%;
  padding-inline: clamp(1.25rem, 4vw, 3.5rem);
  margin: 0 auto;
}

.teacher-landing__hero-cover {
  position: relative;
  aspect-ratio: 2.6 / 1;
  height: auto;
  min-height: clamp(14rem, 38vw, 30rem);
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  overflow: hidden;
  transition: none;
}

@media (max-width: 640px) {
  .teacher-landing__hero-cover {
    min-height: clamp(12rem, 55vw, 22rem);
  }
}

.teacher-landing__hero-overlay {
  position: absolute;
  inset: 0;
  display: none;
  z-index: 1;
}

.teacher-landing__hero-blobs {
  display: none;
}

.teacher-landing__hero-blob {
  position: absolute;
  border-radius: 999px;
  filter: blur(60px);
  opacity: 0.6;
}

.teacher-landing__hero-blob--one {
  width: 260px;
  height: 260px;
  top: 12%;
  left: 10%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.45), transparent 60%);
}

.teacher-landing__hero-blob--two {
  width: 320px;
  height: 320px;
  bottom: 8%;
  right: 12%;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.5), transparent 65%);
}

.teacher-landing__hero-shell {
  display: grid;
  gap: 0;
}

.teacher-landing__cover {
  aspect-ratio: 2.6 / 1;
  height: auto;
  min-height: clamp(12rem, 34vw, 24rem);
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  border-radius: 0;
  overflow: hidden;
  position: relative;
  box-shadow: none;
  border: none;
}

@media (max-width: 768px) {
  .teacher-landing__cover {
    min-height: clamp(12rem, 60vw, 20rem);
  }
}

.teacher-landing__cover-picture {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.teacher-landing__cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  display: block;
}

.teacher-landing__cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.35), transparent 65%);
  z-index: 1;
}

.teacher-landing__cover-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.35), transparent 55%);
  mix-blend-mode: screen;
  z-index: 2;
}

.teacher-landing__profile-card {
  background: var(--teacher-surface-strong);
  border-radius: var(--teacher-radius-card);
  padding: clamp(1.75rem, 4vw, 2.5rem);
  box-shadow: var(--teacher-shadow);
  border: 1px solid var(--teacher-border);
  margin-top: clamp(-4rem, -10vw, -3rem);
  backdrop-filter: blur(6px);
}

.teacher-landing__profile-header {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1.5rem;
  align-items: center;
}

.teacher-landing__profile-avatar {
  width: clamp(4.5rem, 10vw, 5.75rem);
  height: clamp(4.5rem, 10vw, 5.75rem);
  border-radius: 1.5rem;
  background: linear-gradient(135deg, var(--teacher-color-primary, #2563eb), var(--teacher-color-secondary, #0ea5e9));
  display: grid;
  place-items: center;
  overflow: hidden;
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.28);
  position: relative;
}

.teacher-landing__profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.teacher-landing__profile-avatar-fallback {
  color: #fff;
  font-weight: 700;
  font-size: 1.4rem;
  text-transform: uppercase;
}

.teacher-landing__profile-main {
  display: grid;
  gap: 0.35rem;
}

.teacher-landing__profile-name {
  margin: 0;
  font-size: clamp(1.6rem, 3vw, 2rem);
  font-weight: 700;
  color: var(--teacher-color-text-primary, #0f172a);
}

.teacher-landing__profile-headline {
  margin: 0;
  color: var(--teacher-color-text-secondary, #475569);
  font-size: 1rem;
}

.teacher-landing__profile-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  justify-self: end;
  grid-column: 2;
}

.teacher-landing__profile-link {
  margin-top: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: var(--teacher-color-text-secondary, #475569);
  font-size: 0.85rem;
  grid-column: 2;
}

.teacher-landing__profile-link-label {
  font-weight: 600;
  letter-spacing: 0.01em;
}

.teacher-landing__profile-link-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.teacher-landing__profile-link-url {
  font-weight: 600;
  color: var(--teacher-color-primary, #2563eb);
  text-decoration: none;
  padding: 0.4rem 0.65rem;
  border-radius: 0.8rem;
  background: color-mix(in srgb, var(--teacher-color-primary, #2563eb) 10%, #ffffff);
  border: 1px solid color-mix(in srgb, var(--teacher-color-primary, #2563eb) 18%, transparent);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.teacher-landing__profile-link-url:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 20px color-mix(in srgb, var(--teacher-color-primary, #2563eb) 12%, transparent);
}

.teacher-landing__profile-link-copy {
  border: none;
  background: var(--teacher-gradient, linear-gradient(135deg, #2563eb, #0ea5e9));
  color: #fff;
  border-radius: 999px;
  padding: 0.45rem 0.9rem;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.teacher-landing__profile-link-copy:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 20px color-mix(in srgb, var(--teacher-color-primary, #2563eb) 20%, transparent);
}

.teacher-landing__profile-link-copy.is-copied {
  background: linear-gradient(135deg, #16a34a, #22c55e);
}

.teacher-landing__profile-link-copy:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--teacher-color-primary, #2563eb) 55%, transparent);
  outline-offset: 2px;
}

.teacher-landing__profile-share {
  position: relative;
}

.teacher-landing__profile-share-toggle {
  border: 1px solid color-mix(in srgb, var(--teacher-color-primary, #2563eb) 20%, transparent);
  background: rgba(255, 255, 255, 0.85);
  color: var(--teacher-color-primary, #2563eb);
  border-radius: 999px;
  padding: 0.45rem 0.95rem;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
  list-style: none;
}

.teacher-landing__profile-share-toggle::-webkit-details-marker {
  display: none;
}

.teacher-landing__profile-share-toggle:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 20px color-mix(in srgb, var(--teacher-color-primary, #2563eb) 16%, transparent);
}

.teacher-landing__profile-share-toggle:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--teacher-color-primary, #2563eb) 55%, transparent);
  outline-offset: 2px;
}

.teacher-landing__profile-share-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  inset-inline-start: 0;
  display: grid;
  gap: 0.35rem;
  padding: 0.6rem;
  min-width: 180px;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 0.9rem;
  border: 1px solid rgba(148, 163, 184, 0.25);
  box-shadow: 0 18px 28px rgba(15, 23, 42, 0.12);
  z-index: 10;
}

.teacher-landing__profile-share-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.65rem;
  border-radius: 0.75rem;
  color: var(--teacher-color-text-primary, #0f172a);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.85rem;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.teacher-landing__profile-share-link--button {
  border: none;
  background: transparent;
  cursor: pointer;
}

.teacher-landing__profile-share-link:hover,
.teacher-landing__profile-share-link:focus-visible {
  background: color-mix(in srgb, var(--teacher-color-primary, #2563eb) 12%, transparent);
  color: var(--teacher-color-primary, #2563eb);
  transform: translateY(-1px);
}

.teacher-landing__profile-qr {
  display: grid;
  justify-items: center;
  gap: 0.4rem;
  padding: 0.6rem 0.5rem 0.2rem;
}

.teacher-landing__profile-qr img {
  width: 160px;
  height: 160px;
  border-radius: 0.75rem;
  background: #fff;
  padding: 0.35rem;
  border: 1px solid rgba(148, 163, 184, 0.25);
}

.teacher-landing__profile-qr-hint {
  font-size: 0.75rem;
  color: var(--teacher-color-text-secondary, #64748b);
  text-align: center;
}

.teacher-landing__profile-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border-radius: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.teacher-landing__profile-cta--primary {
  background: var(--teacher-color-primary, #2563eb);
  color: #fff;
  box-shadow: 0 1rem 2rem rgba(37, 99, 235, 0.2);
}

.teacher-landing__profile-cta--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 1.25rem 2.5rem rgba(37, 99, 235, 0.25);
}

.teacher-landing__profile-cta--ghost {
  border: 1px solid rgba(37, 99, 235, 0.2);
  color: var(--teacher-color-primary, #2563eb);
  background: rgba(255, 255, 255, 0.8);
}

.teacher-landing__profile-cta--ghost:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 1);
}

.teacher-landing__profile-bio {
  margin: 1.25rem 0 0;
  color: var(--teacher-color-text-secondary, #475569);
  line-height: 1.7;
}

.teacher-landing__profile-highlights {
  list-style: none;
  padding: 0;
  margin: 1.5rem 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.teacher-landing__profile-highlights li {
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.12);
  color: var(--teacher-color-primary, #2563eb);
  font-weight: 600;
  font-size: 0.85rem;
}

.teacher-landing__profile-stats {
  margin-top: 1.75rem;
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}

.teacher-landing__profile-stat {
  background: rgba(15, 23, 42, 0.03);
  border-radius: 1rem;
  padding: 0.85rem 1rem;
  display: grid;
  gap: 0.25rem;
}

.teacher-landing__profile-stat-value {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--teacher-color-text-primary, #0f172a);
}

.teacher-landing__profile-stat-label {
  font-size: 0.85rem;
  color: var(--teacher-color-text-secondary, #64748b);
}

.teacher-landing__section--card {
  background: var(--teacher-surface-strong);
  border-radius: var(--teacher-radius-card);
  padding: clamp(2rem, 4vw, 3rem);
  box-shadow: var(--teacher-shadow);
  border: 1px solid var(--teacher-border);
  overflow: hidden;
}

.teacher-landing__section--card::before {
  content: '';
  position: absolute;
  inset: -40% 10% auto 10%;
  height: 65%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.12), transparent 65%);
  filter: blur(20px);
  opacity: 0.75;
  pointer-events: none;
}

.teacher-landing__section--panel {
  padding: clamp(1.5rem, 4vw, 2.5rem);
}

.teacher-landing__panel {
  background: var(--teacher-surface);
  border-radius: calc(var(--teacher-radius-card) + 0.25rem);
  border: 1px solid var(--teacher-border);
  overflow: hidden;
  box-shadow: var(--teacher-shadow);
  position: relative;
  isolation: isolate;
}

.teacher-landing__panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, rgba(59, 130, 246, 0.08), transparent 45%);
  z-index: -1;
}

.teacher-landing__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.8rem;
  border-radius: 0.9rem;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--teacher-color-primary, #1d4ed8);
  background: color-mix(in srgb, var(--teacher-color-primary, #2563eb) 12%, #ffffff);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65);
}

.teacher-landing__badge--soft {
  color: var(--teacher-color-secondary, #0f766e);
  background: rgba(15, 118, 110, 0.12);
}

.teacher-landing__section--contact {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(14, 116, 144, 0.08));
  border-radius: 2rem;
  padding: clamp(2.5rem, 4vw, 3.25rem);
  border: 1px solid color-mix(in srgb, var(--teacher-color-primary, #2563eb) 18%, transparent);
  box-shadow: 0 1.5rem 3rem rgba(37, 99, 235, 0.08);
  position: relative;
  overflow: hidden;
}

.teacher-landing__section--contact::before,
.teacher-landing__section--contact::after {
  content: '';
  position: absolute;
  width: clamp(12rem, 30vw, 18rem);
  height: clamp(12rem, 32vw, 18rem);
  border-radius: 50%;
  filter: blur(30px);
  opacity: 0.5;
  pointer-events: none;
}

.teacher-landing__section--contact::before {
  top: -25%;
  right: -15%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.4), transparent 60%);
}

.teacher-landing__section--contact::after {
  bottom: -35%;
  left: -10%;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.35), transparent 60%);
}

.teacher-landing__contact {
  display: grid;
  gap: clamp(1.5rem, 3vw, 2.5rem);
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  align-items: start;
}

.teacher-landing__contact-title {
  margin: 0;
  font-size: clamp(2rem, 4vw, 2.5rem);
  color: var(--teacher-color-text-primary, #0f172a);
}

.teacher-landing__contact-subtitle {
  margin: 0.75rem 0 0;
  font-size: 1rem;
  color: var(--teacher-color-text-secondary, #475569);
  line-height: 1.6;
}

.teacher-landing__contact-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.teacher-landing__contact-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.9rem 1.8rem;
  border-radius: 0.9rem;
  background: var(--teacher-color-primary, #2563eb);
  color: #fff;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 1.25rem 2.6rem rgba(37, 99, 235, 0.18);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.teacher-landing__contact-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 1.75rem 3.5rem rgba(37, 99, 235, 0.25);
}

.teacher-landing__contact-cta:focus-visible {
  outline: none;
  transform: translateY(-1px);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.75), 0 0 0 6px rgba(37, 99, 235, 0.35);
}


.teacher-landing__contact-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.85rem 1.5rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.6);
  color: var(--teacher-color-primary, #1d4ed8);
  font-weight: 600;
  text-decoration: none;
  border: 1px solid rgba(37, 99, 235, 0.24);
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.teacher-landing__contact-secondary:hover {
  background: rgba(255, 255, 255, 0.75);
  transform: translateY(-2px);
}

.teacher-landing__contact-secondary:focus-visible {
  outline: none;
  background: rgba(255, 255, 255, 0.85);
  transform: translateY(-1px);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.75), 0 0 0 6px rgba(37, 99, 235, 0.25);
}

.teacher-landing__contact-links {
  list-style: none;
  padding: 1.5rem;
  margin: 0;
  background: rgba(255, 255, 255, 0.82);
  border-radius: 1.5rem;
  border: 1px solid rgba(148, 163, 184, 0.2);
  display: grid;
  gap: 1rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.teacher-landing__contact-link {
  display: grid;
  gap: 0.3rem;
  text-decoration: none;
  color: inherit;
  position: relative;
  padding: 0.75rem 1.5rem 0.75rem 0;
  border-radius: 0.9rem;
  transition: color 0.2s ease, box-shadow 0.2s ease;
}

.teacher-landing__contact-link-label {
  font-weight: 700;
  color: var(--teacher-color-text-primary, #0f172a);
}

.teacher-landing__contact-link-url {
  font-size: 0.85rem;
  color: var(--teacher-color-text-secondary, #475569);
  word-break: break-all;
}

.teacher-landing__contact-link::after {
  content: '->';
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.85rem;
  color: var(--teacher-color-primary, #2563eb);
}

.teacher-landing__contact-link:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.28);
}

.teacher-landing__floating-contact {
  position: fixed;
  bottom: clamp(1.5rem, 4vw, 2.5rem);
  right: clamp(1.25rem, 4vw, 2.25rem);
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  border-radius: 999px;
  background: #fff;
  color: #16a34a;
  font-weight: 600;
  text-decoration: none;
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.18);
  z-index: 40;
}

.teacher-landing__floating-actions {
  position: fixed;
  bottom: clamp(1.25rem, 4vw, 2.4rem);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.75rem;
  padding: 0.6rem 0.9rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 18px 32px rgba(15, 23, 42, 0.18);
  z-index: 39;
  flex-wrap: wrap;
  justify-content: center;
}

.teacher-landing__floating-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.55rem 1.1rem;
  border-radius: 999px;
  border: 1px solid rgba(37, 99, 235, 0.2);
  background: rgba(255, 255, 255, 0.7);
  color: var(--teacher-color-primary, #2563eb);
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;
}

.teacher-landing__floating-action:hover,
.teacher-landing__floating-action:focus-visible {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.95);
}

.teacher-landing__floating-action--primary {
  background: var(--teacher-color-primary, #2563eb);
  color: #fff;
  border-color: transparent;
}

.teacher-landing__floating-action--ghost {
  border-color: rgba(15, 118, 110, 0.25);
  color: var(--teacher-color-secondary, #0f766e);
}

.teacher-landing__floating-contact-icon {
  width: 1.6rem;
  height: 1.6rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.teacher-landing__floating-contact-icon svg {
  width: 1.4rem;
  height: 1.4rem;
}

.teacher-landing__floating-contact-label {
  font-size: 0.95rem;
}

.teacher-landing__floating-contact-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 999px;
  background: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.2);
}

[dir='rtl'] .teacher-landing__floating-contact {
  right: auto;
  left: clamp(1.25rem, 4vw, 2.25rem);
}

[dir='rtl'] .teacher-landing__floating-actions {
  left: 50%;
  transform: translateX(-50%);
}

.teacher-landing__state {
  min-height: 60vh;
  display: grid;
  place-items: center;
  color: var(--teacher-color-text-secondary, #6b7280);
  font-size: 1.1rem;
}

.teacher-landing__loader {
  animation: pulse 1.2s ease-in-out infinite;
}

.teacher-landing__hamburger {
  display: none;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  padding: 0;
  border: none;
  border-radius: 0.5rem;
  background: color-mix(in srgb, var(--teacher-color-primary, #2563eb) 12%, transparent);
  color: var(--teacher-color-primary, #2563eb);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.teacher-landing__hamburger:hover,
.teacher-landing__hamburger:focus-visible {
  background: color-mix(in srgb, var(--teacher-color-primary, #2563eb) 20%, transparent);
}

.teacher-landing__hamburger:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--teacher-color-primary, #2563eb);
}

.teacher-landing__hamburger-icon {
  display: block;
  line-height: 0;
}

.teacher-landing__drawer-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9998;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
}

.teacher-landing__drawer {
  position: fixed;
  top: 0;
  bottom: 0;
  right: 0;
  z-index: 9999;
  width: min(320px, 85vw);
  padding: 1.5rem;
  background: var(--teacher-color-surface, #fff);
  box-shadow: -8px 0 24px rgba(0, 0, 0, 0.12);
  overflow-y: auto;
}

.teacher-landing__drawer--rtl {
  right: auto;
  left: 0;
  box-shadow: 8px 0 24px rgba(0, 0, 0, 0.12);
}

.teacher-landing__drawer-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 2rem;
}

.teacher-landing__drawer-nav .teacher-landing__nav-link {
  display: flex;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
}

.teacher-landing-drawer-backdrop-enter-active,
.teacher-landing-drawer-backdrop-leave-active {
  transition: opacity 0.2s ease;
}

.teacher-landing-drawer-backdrop-enter-from,
.teacher-landing-drawer-backdrop-leave-to {
  opacity: 0;
}

.teacher-landing-drawer-panel-enter-active,
.teacher-landing-drawer-panel-leave-active {
  transition: transform 0.25s ease;
}

.teacher-landing-drawer-panel-enter-from,
.teacher-landing-drawer-panel-leave-to {
  transform: translateX(100%);
}

.teacher-landing-drawer-panel-rtl-enter-active,
.teacher-landing-drawer-panel-rtl-leave-active {
  transition: transform 0.25s ease;
}

.teacher-landing-drawer-panel-rtl-enter-from,
.teacher-landing-drawer-panel-rtl-leave-to {
  transform: translateX(-100%);
}

@media (max-width: 1024px) {
  .teacher-landing__layout {
    padding: clamp(1.25rem, 4vw, 2rem);
  }
}

@media (max-width: 768px) {
  .teacher-landing__section {
    padding-block: var(--teacher-section-padding-mobile);
  }

  .teacher-landing__nav--desktop {
    display: none;
  }

  .teacher-landing__hamburger {
    display: flex;
  }

  .teacher-landing__header-inner {
    flex-direction: column;
    align-items: stretch;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .teacher-landing__header-actions {
    width: 100%;
    margin-left: 0;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .teacher-landing__language {
    width: 3rem;
    height: 3rem;
  }

  .teacher-landing {
    padding: 0;
  }

  .teacher-landing__container {
    padding-inline: 1rem;
  }

  .teacher-landing__section--card {
    padding: 1.75rem;
  }

  .teacher-landing__brand-icon {
    margin-right: 0.5rem;
  }

  .teacher-landing__cover {
    border-radius: 1.6rem;
  }

  .teacher-landing__profile-card {
    margin-top: -2.5rem;
  }

  .teacher-landing__profile-header {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .teacher-landing__profile-actions {
    justify-self: start;
    grid-column: 1;
  }

  .teacher-landing__profile-link {
    grid-column: 1;
  }

  .teacher-landing__floating-contact-label {
    display: none;
  }

  .teacher-landing__floating-contact {
    padding: 0.7rem;
  }
}

@media (prefers-reduced-motion: no-preference) {
  :global(html) {
    scroll-behavior: smooth;
  }
}

@media (prefers-reduced-motion: reduce) {
  :global(html) {
    scroll-behavior: auto;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
}

/* Harmonize legacy overrides with new tokens */
.teacher-landing__wrapper {
  background: inherit;
  color: var(--teacher-color-text-primary, #0f172a);
}

.teacher-landing__container {
  width: min(var(--teacher-container-max), 100%);
  margin: 0 auto;
  padding: 0 24px;
}

@media (max-width: 768px) {
  .teacher-landing__layout {
    max-width: 100%;
    padding-inline: 1rem;
  }

  .teacher-landing__container {
    width: 100%;
    max-width: 100%;
    padding-inline: 1rem;
  }

  .teacher-landing__section {
    width: 100%;
  }
}

.teacher-landing__header {
  position: sticky;
  top: 0;
  z-index: 120;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 24px rgba(17, 24, 39, 0.06);
}

.teacher-landing__header-inner {
  min-height: 76px;
}

.teacher-landing__brand {
  gap: 0.75rem;
}

.teacher-landing__brand-name {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--modern-dark);
}

.teacher-landing__brand-tagline {
  color: var(--modern-gray);
}

.teacher-landing__nav-link {
  font-weight: 600;
  color: var(--modern-dark);
}

.teacher-landing__nav-link::after {
  background: var(--modern-primary);
}

.teacher-landing__nav-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0.7rem 1.4rem;
  border-radius: var(--teacher-radius-button);
  font-weight: 650;
  border: 2px solid transparent;
  transition: transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease;
}

.teacher-landing__nav-cta--primary {
  background: var(--teacher-gradient);
  color: white;
  box-shadow: var(--teacher-shadow);
}

.teacher-landing__nav-cta--ghost {
  border-color: color-mix(in srgb, var(--teacher-color-primary, #2563eb) 60%, transparent);
  color: var(--teacher-color-primary, #2563eb);
  background: transparent;
}

.teacher-landing__nav-cta:hover,
.teacher-landing__nav-cta:focus-visible {
  transform: translateY(-1px);
}

.teacher-landing__share-copy {
  padding: 0.68rem 1.1rem;
  border-radius: 999px;
  border: 2px dashed rgba(0, 196, 118, 0.45);
  background: white;
  color: var(--modern-primary);
  font-weight: 800;
}

.teacher-landing__share-copy.is-copied {
  border-style: solid;
  background: rgba(0, 196, 118, 0.12);
}

.teacher-landing__section--hero {
  padding: clamp(6rem, 15vh, 9rem) 0 clamp(4rem, 10vh, 6rem);
  min-height: 72vh;
  background: #111827;
  color: #fff;
}

.teacher-landing__wrapper--minimal .teacher-landing__section--hero {
  background: #ffffff;
  color: var(--teacher-color-text-primary, #0f172a);
}

.teacher-landing__wrapper--classic .teacher-landing__section--hero {
  background: #f8fafc;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  color: var(--teacher-color-text-primary, #0f172a);
}

.teacher-landing__wrapper--minimal .teacher-landing__modern-kicker,
.teacher-landing__wrapper--classic .teacher-landing__modern-kicker {
  color: var(--teacher-color-primary, #2563eb);
}

.teacher-landing__wrapper--minimal .teacher-landing__modern-underline,
.teacher-landing__wrapper--classic .teacher-landing__modern-underline {
  background: var(--teacher-color-primary, #2563eb);
}

.teacher-landing__wrapper--minimal .teacher-landing__hero-overlay,
.teacher-landing__wrapper--classic .teacher-landing__hero-overlay {
  background: transparent;
}

.teacher-landing__wrapper--minimal .teacher-landing__hero-blobs,
.teacher-landing__wrapper--classic .teacher-landing__hero-blobs {
  display: none;
}

.teacher-landing__wrapper--minimal .teacher-landing__modern-description,
.teacher-landing__wrapper--classic .teacher-landing__modern-description {
  color: #4b5563;
}

[dir='ltr'] .teacher-landing__modern-hero-text {
  justify-self: start;
  text-align: left;
}

[dir='rtl'] .teacher-landing__modern-hero--below {
  flex-direction: row;
}

[dir='ltr'] .teacher-landing__modern-hero--below {
  flex-direction: row-reverse;
}

[dir='rtl'] .teacher-landing__wrapper--hide-header .teacher-landing__modern-actions,
[dir='rtl'] .teacher-landing__wrapper--hide-header .teacher-landing__trust {
  justify-content: flex-end;
}

.teacher-landing__wrapper--minimal .teacher-landing__modern-btn--outline,
.teacher-landing__wrapper--classic .teacher-landing__modern-btn--outline {
  background: transparent;
  color: var(--teacher-color-primary, #2563eb);
  border-color: rgba(37, 99, 235, 0.4);
}

.teacher-landing__modern-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 64px;
  align-items: center;
  position: relative;
  z-index: 2;
}

.teacher-landing__modern-hero--below {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 1.6rem;
  padding: 16px 0 0;
  margin-top: 0;
  flex-wrap: wrap;
  background: #ffffff;
  position: relative;
  z-index: 3;
}

[dir='rtl'] .teacher-landing__modern-hero--below {
  flex-direction: row;
}

[dir='ltr'] .teacher-landing__modern-hero--below {
  flex-direction: row-reverse;
}

[dir='rtl'] .teacher-landing__hero-aside {
  align-items: flex-end;
}

[dir='ltr'] .teacher-landing__hero-aside {
  align-items: flex-start;
}

[dir='rtl'] .teacher-landing__modern-hero-text {
  order: 2;
  text-align: right;
}

.teacher-landing__modern-hero-text {
  align-self: center;
  justify-self: start;
  text-align: left;
  width: 100%;
  max-width: 560px;
  flex: 1 1 320px;
  margin-bottom: 0;
  padding: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  border: none;
  order: 2;
}

.teacher-landing__hero-avatar--standalone {
  margin-top: 0;
  flex: 0 0 120px;
  z-index: 4;
}

.teacher-landing__hero-avatar {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.95);
  display: grid;
  place-items: center;
  box-shadow: 0 24px 50px rgba(15, 23, 42, 0.3);
  margin-bottom: 0.6rem;
  position: relative;
}

.teacher-landing__hero-aside {
  display: flex;
  flex-direction: row;
  gap: 2rem;
  flex: 0 0 auto;
  margin-top: -24px;
  order: 1;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.teacher-landing__hero-top {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 1.25rem;
  width: 100%;
}

.teacher-landing__hero-top .teacher-landing__modern-hero-text {
  flex: 1 1 360px;
}

.teacher-landing__hero-actions {
  display: flex;
  flex-direction: row;
  gap: 0.6rem;
  align-items: center;
  justify-content: flex-start;
  width: fit-content;
  align-self: center;
  margin-top: 0;
  order: 3;
}

[dir='rtl'] .teacher-landing__hero-actions {
  justify-content: flex-start;
  margin-inline-start: auto;
  margin-inline-end: 0;
  align-self: center;
}

[dir='ltr'] .teacher-landing__hero-actions {
  justify-content: flex-end;
  margin-inline-start: auto;
  margin-inline-end: 0;
}

[dir='rtl'] .teacher-landing__hero-top {
  justify-content: flex-start;
}

[dir='rtl'] .teacher-landing__hero-top .teacher-landing__hero-avatar {
  order: 1;
}

[dir='rtl'] .teacher-landing__hero-top .teacher-landing__modern-hero-text {
  order: 2;
}

[dir='rtl'] .teacher-landing__hero-top .teacher-landing__hero-actions {
  order: 3;
}

@media (max-width: 640px) {
  .teacher-landing__hero-aside {
    row-gap: 0.75rem;
  }
}

[dir='ltr'] .teacher-landing__hero-actions {
  justify-content: flex-end;
}

.teacher-landing__hero-avatar::before,
.teacher-landing__hero-avatar::after {
  content: '';
  position: absolute;
  inset: -12px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.28);
  opacity: 0.7;
}

.teacher-landing__hero-avatar::after {
  inset: -22px;
  border-color: rgba(255, 255, 255, 0.15);
  opacity: 0.5;
}

.teacher-landing__hero-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.teacher-landing__hero-avatar-fallback {
  font-weight: 800;
  font-size: 1.6rem;
  color: #111827;
}

.teacher-landing__modern-kicker {
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--teacher-color-primary, #2563eb);
  margin-bottom: 1rem;
}

.teacher-landing__modern-title {
  font-size: clamp(2.125rem, 4vw, 2.875rem);
  font-weight: 750;
  line-height: 1.05;
  margin: 0 0 1.2rem;
  color: inherit;
  position: relative;
  text-shadow: none;
}

.teacher-landing__modern-underline {
  display: none;
  width: 128px;
  height: 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.8);
  vertical-align: middle;
  margin-left: 10px;
}

.teacher-landing__modern-description {
  font-size: 1.05rem;
  color: #374151;
  max-width: 56ch;
  margin-bottom: 2.2rem;
  display: none;
}

.teacher-landing__modern-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2.8rem;
}

.teacher-landing__trust {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-bottom: 2rem;
  display: none;
}

.teacher-landing__trust-item {
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--teacher-color-primary, #2563eb) 12%, transparent);
  color: #1f2937;
  font-weight: 600;
  font-size: 0.85rem;
}

.teacher-landing__section--hero .teacher-landing__trust-item {
  background: color-mix(in srgb, var(--teacher-color-primary, #2563eb) 12%, transparent);
  color: var(--teacher-color-primary, #2563eb);
}

.teacher-landing__modern-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 1.6rem;
  border-radius: var(--teacher-radius-button);
  font-size: 1rem;
  font-weight: 650;
  border: 1px solid transparent;
  cursor: pointer;
  transition: transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease, color 180ms ease;
}

.teacher-landing__modern-btn--primary {
  background: linear-gradient(135deg, var(--teacher-color-primary, #2563eb), color-mix(in srgb, var(--teacher-color-primary) 40%, var(--teacher-color-secondary)));
  color: #ffffff;
  box-shadow: 0 16px 34px rgba(37, 99, 235, 0.3);
}

.teacher-landing__modern-btn--outline {
  background: transparent;
  border-color: rgba(37, 99, 235, 0.4);
  color: var(--teacher-color-primary, #2563eb);
}

.teacher-landing__modern-btn:hover,
.teacher-landing__modern-btn:focus-visible {
  transform: translateY(-2px);
}

.teacher-landing__modern-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 1.6rem;
  width: 100%;
  max-width: 560px;
  padding: 1.2rem 1.4rem;
  border-radius: 16px;
  border: 1px solid var(--teacher-border);
  background: #ffffff;
  box-shadow: var(--teacher-shadow);
  display: none;
}

.teacher-landing__modern-stat-number {
  font-size: 2.6rem;
  font-weight: 900;
  color: var(--modern-primary);
  line-height: 1;
}

.teacher-landing__modern-stat-label {
  margin-top: 0.35rem;
  color: var(--modern-gray);
  font-weight: 600;
}

.teacher-landing__modern-hero-media {
  position: relative;
}

.teacher-landing__modern-hero-image {
  width: 100%;
  border-radius: 18px;
  object-fit: cover;
  box-shadow: 0 28px 60px rgba(15, 23, 42, 0.18);
}

.teacher-landing__hero-shell--legacy,
.teacher-landing__legacy-block {
  display: none;
}

.teacher-landing__modern-section {
  padding: 110px 0;
}

.teacher-landing__section--features .teacher-landing__modern-section {
  padding-top: 0;
}

.teacher-landing__about-card {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.2fr);
  gap: 2.2rem;
  padding: clamp(1.75rem, 4vw, 2.5rem);
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(248, 250, 252, 0.96));
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.2);
  margin-top: 0;
  margin-bottom: 2.4rem;
}

.teacher-landing__about-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.6rem;
  background: rgba(255, 255, 255, 0.75);
  border-radius: 18px;
  padding: 1.6rem 1.4rem;
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.teacher-landing__about-stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #ffffff;
  background: linear-gradient(135deg, var(--teacher-color-primary, #2563eb), var(--teacher-color-secondary, #0ea5e9));
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.25);
}

.teacher-landing__about-stat-icon svg {
  width: 24px;
  height: 24px;
  stroke: currentColor;
}

.teacher-landing__about-stat-title {
  font-weight: 700;
  color: #1f2937;
}

.teacher-landing__about-stat-value {
  font-size: clamp(2.2rem, 4vw, 3rem);
  font-weight: 900;
  color: var(--teacher-color-primary, #2563eb);
}

.teacher-landing__about-stat-note {
  font-size: 0.95rem;
  color: #64748b;
  margin: 0;
}

.teacher-landing__about-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.teacher-landing__modern-section--center,
.teacher-landing__modern-heading--center {
  text-align: center;
}

.teacher-landing__modern-heading {
  max-width: 780px;
  margin-bottom: 3.2rem;
}

.teacher-landing__modern-heading--center {
  margin-left: auto;
  margin-right: auto;
}

.teacher-landing__modern-section-title {
  font-size: clamp(1.375rem, 2.8vw, 1.75rem);
  margin: 0 0 1rem;
  color: var(--modern-dark);
}

.teacher-landing__modern-section-description {
  color: #4b5563;
  font-size: 1rem;
  line-height: 1.7;
}

.teacher-landing__modern-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.8rem;
}

.teacher-landing__modern-feature-card {
  background: #ffffff;
  padding: 2.1rem 1.9rem;
  border-radius: 18px;
  text-align: center;
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.08);
}

.teacher-landing__modern-feature-icon {
  font-size: 2.4rem;
  margin-bottom: 1rem;
}

.teacher-landing__modern-feature-title {
  font-size: 1.2rem;
  margin-bottom: 0.6rem;
  color: var(--modern-dark);
}

.teacher-landing__modern-feature-description {
  color: var(--modern-gray);
}

.teacher-landing__section--courses {
  background: var(--modern-light);
}

.teacher-landing__modern-courses {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 2rem;
}

.teacher-landing__modern-course-card {
  background: white;
  border-radius: var(--teacher-radius-card);
  overflow: visible;
  text-align: left;
  box-shadow: var(--teacher-shadow);
  transition: transform 220ms ease, box-shadow 220ms ease;
  position: relative;
  z-index: 1;
}

.teacher-landing__modern-course-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--teacher-shadow-hover);
}

.teacher-landing__modern-course-card--skeleton {
  overflow: hidden;
  background: rgba(255, 255, 255, 0.7);
}

.teacher-landing__modern-course-card--skeleton .teacher-landing__modern-course-media {
  background: linear-gradient(90deg, rgba(148, 163, 184, 0.12), rgba(148, 163, 184, 0.24), rgba(148, 163, 184, 0.12));
  animation: pulse 1.6s ease-in-out infinite;
}

.teacher-landing__skeleton-line {
  height: 14px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(148, 163, 184, 0.16), rgba(148, 163, 184, 0.28), rgba(148, 163, 184, 0.16));
  animation: pulse 1.6s ease-in-out infinite;
  margin-bottom: 0.8rem;
}

.teacher-landing__skeleton-line--short {
  width: 70%;
}

.teacher-landing__skeleton-line--pill {
  width: 40%;
  height: 20px;
}

.teacher-landing__modern-course-media {
  height: 230px;
  overflow: hidden;
  position: relative;
}

.teacher-landing__modern-course-badge {
  position: absolute;
  inset-block-start: 0.75rem;
  inset-inline-start: 0.75rem;
  z-index: 2;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.15);
  font-size: 1.05rem;
  font-weight: 700;
  padding: 0.55rem 1.2rem;
  background: color-mix(in srgb, var(--teacher-color-secondary, #0f766e) 22%, #ffffff);
  color: var(--teacher-color-secondary, #0f766e);
  border: 1px solid color-mix(in srgb, var(--teacher-color-secondary, #0f766e) 45%, transparent);
}

[dir='rtl'] .teacher-landing__modern-course-badge {
  inset-inline-start: auto;
  inset-inline-end: 0.75rem;
}

.teacher-landing__modern-course-timer--card {
  position: absolute;
  inset-block-start: 0.75rem;
  inset-inline-end: 0.75rem;
  z-index: 2;
}

[dir='rtl'] .teacher-landing__modern-course-timer--card {
  inset-inline-start: 0.75rem;
  inset-inline-end: auto;
}

.teacher-landing__modern-course-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.teacher-landing__modern-course-body {
  padding: 2rem;
}

.teacher-landing__modern-course-level {
  display: inline-block;
  padding: 0.4rem 0.95rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--teacher-color-primary, #2563eb) 14%, transparent);
  color: var(--teacher-color-primary, #2563eb);
  font-weight: 800;
  margin-bottom: 0.9rem;
}

.teacher-landing__modern-course-title {
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
  color: var(--teacher-color-text-primary, #0f172a);
}

.teacher-landing__modern-course-subtitle {
  color: var(--teacher-color-text-secondary, #64748b);
  margin-bottom: 0.8rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.teacher-landing__modern-course-tooltip {
  position: absolute;
  inset-inline: 1.25rem;
  bottom: calc(100% + 12px);
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.12);
  padding: 0.85rem 1rem;
  color: #0f172a;
  text-align: start;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.2s ease, transform 0.2s ease;
  pointer-events: none;
  z-index: 5;
}

.teacher-landing__modern-course-tooltip-title {
  font-weight: 700;
  font-size: 0.9rem;
  margin-bottom: 0.35rem;
}

.teacher-landing__modern-course-tooltip-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.35rem;
}

.teacher-landing__modern-course-tooltip-item {
  position: relative;
  padding-inline-start: 1rem;
  font-size: 0.85rem;
  color: #475569;
  line-height: 1.6;
}

.teacher-landing__modern-course-tooltip-item::before {
  content: '';
  position: absolute;
  inset-inline-start: 0;
  inset-block-start: 0.55rem;
  width: 0.35rem;
  height: 0.35rem;
  border-radius: 999px;
  background: rgba(71, 85, 105, 0.65);
}

.teacher-landing__modern-course-card:hover .teacher-landing__modern-course-tooltip,
.teacher-landing__modern-course-card:focus-within .teacher-landing__modern-course-tooltip {
  opacity: 1;
  transform: translateY(0);
}

@media (max-width: 768px) {
  .teacher-landing__modern-course-tooltip {
    display: none;
  }
}

.teacher-landing__modern-course-meta {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  color: #fbbf24;
  margin-bottom: 1.2rem;
}

.teacher-landing__modern-course-rating {
  color: var(--teacher-color-text-secondary, #64748b);
  font-weight: 700;
}

.teacher-landing__modern-course-footer {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 0.9rem;
}

.teacher-landing__testimonials {
  margin-top: 3rem;
  display: grid;
  gap: 2rem;
}

.teacher-landing__testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.teacher-landing__testimonial-card {
  position: relative;
  padding: 1.5rem 1.6rem 1.7rem;
  border-radius: 1.35rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95));
  border: 1px solid rgba(148, 163, 184, 0.24);
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08);
  transition: transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease;
}

.teacher-landing__testimonial-card:hover {
  transform: translateY(-4px);
  border-color: rgba(37, 99, 235, 0.25);
  box-shadow: 0 24px 44px rgba(15, 23, 42, 0.12);
}

.teacher-landing__testimonial-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 1rem;
}

.teacher-landing__testimonial-avatar {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--teacher-color-primary, #2563eb), var(--teacher-color-secondary, #0ea5e9));
  color: #fff;
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 0.02em;
  box-shadow: 0 10px 18px rgba(37, 99, 235, 0.2);
}

.teacher-landing__testimonial-avatar::before {
  content: attr(data-initial);
}

.teacher-landing__testimonial-meta {
  display: grid;
  gap: 0.25rem;
}

.teacher-landing__testimonial-quote {
  font-size: 0.95rem;
  color: #0f172a;
  line-height: 1.7;
  margin: 0;
  position: relative;
}

.teacher-landing__testimonial-author {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.teacher-landing__testimonial-stars {
  display: inline-flex;
  gap: 2px;
  color: #f59e0b;
  font-size: 0.8rem;
}

.teacher-landing__testimonial-star {
  line-height: 1;
}

.teacher-landing__faq {
  margin-top: 3rem;
  display: grid;
  gap: 2rem;
}

.teacher-landing__faq-list {
  display: grid;
  gap: 1rem;
}

.teacher-landing__faq-item {
  border-radius: 1.1rem;
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.25);
  padding: 1.1rem 1.4rem;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.teacher-landing__faq-question {
  cursor: pointer;
  font-weight: 700;
  color: #0f172a;
  list-style: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.teacher-landing__faq-question::-webkit-details-marker {
  display: none;
}

.teacher-landing__faq-answer {
  margin-top: 0.8rem;
  color: #475569;
  line-height: 1.7;
}

.teacher-landing__modern-course-price {
  font-size: 1.4rem;
  font-weight: 900;
  color: var(--teacher-color-primary, #2563eb);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
}

.teacher-landing__modern-course-price-original {
  font-size: 0.95rem;
  color: #94a3b8;
  text-decoration: line-through;
  font-weight: 700;
}

.teacher-landing__modern-course-price-current {
  font-size: 1.4rem;
  font-weight: 900;
  color: var(--teacher-color-primary, #2563eb);
}

.teacher-landing__modern-course-timer {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
  color: #0f172a;
  font-size: 0.9rem;
  font-weight: 800;
}

.teacher-landing__modern-course-cta {
  border: none;
  border-radius: 999px;
  padding: 0.75rem 1.3rem;
  background: linear-gradient(
    135deg,
    var(--teacher-color-primary, #2563eb),
    color-mix(in srgb, var(--teacher-color-primary, #2563eb) 40%, var(--teacher-color-secondary, #0ea5e9))
  );
  color: white;
  font-weight: 800;
  cursor: pointer;
  align-self: center;
  box-shadow: 0 14px 28px color-mix(in srgb, var(--teacher-color-primary, #2563eb) 35%, transparent);
}

.teacher-landing__modern-course-cta:hover,
.teacher-landing__modern-course-cta:focus-visible {
  transform: translateY(-1px);
  box-shadow: 0 18px 34px color-mix(in srgb, var(--teacher-color-primary, #2563eb) 45%, transparent);
}

.teacher-landing__section--mentors {
  background: white;
}

.teacher-landing__modern-mentors {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2.1rem;
}

.teacher-landing__modern-mentor-card {
  text-align: center;
}

.teacher-landing__modern-mentor-avatar {
  width: 156px;
  height: 156px;
  margin: 0 auto 1.1rem;
  border-radius: 50%;
  overflow: hidden;
  border: 6px solid rgba(0, 196, 118, 0.12);
  box-shadow: 0 18px 40px rgba(0, 196, 118, 0.15);
}

.teacher-landing__modern-mentor-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.teacher-landing__modern-mentor-name {
  font-size: 1.2rem;
  margin-bottom: 0.35rem;
  color: var(--modern-dark);
}

.teacher-landing__modern-mentor-role {
  color: var(--modern-gray);
  margin-bottom: 0.7rem;
}

.teacher-landing__modern-mentor-quote {
  color: #4b5563;
  font-style: italic;
}

.teacher-landing__section--contact {
  background: var(--modern-orange);
  color: white;
  border-radius: 0;
}

.teacher-landing__contact {
  max-width: 960px;
  margin: 0 auto;
  background: transparent;
  box-shadow: none;
  padding: 110px 24px;
}

.teacher-landing__contact-title {
  font-size: clamp(2.2rem, 4vw, 2.9rem);
}

.teacher-landing__contact-subtitle {
  color: rgba(255, 255, 255, 0.92);
}

.teacher-landing__contact-actions {
  justify-content: center;
}

.teacher-landing__contact-cta,
.teacher-landing__contact-secondary {
  border-radius: 999px;
  font-weight: 800;
}

.teacher-landing__contact-cta {
  background: white;
  color: var(--modern-orange);
}

.teacher-landing__contact-secondary {
  border-color: rgba(255, 255, 255, 0.7);
  color: white;
}

.teacher-landing__contact-links--light .teacher-landing__contact-link {
  border-color: rgba(255, 255, 255, 0.32);
  background: rgba(255, 255, 255, 0.12);
}

.teacher-landing__modern-footer {
  background: #f9fafb;
  color: #0f172a;
  padding: 72px 0 36px;
  margin-top: 0;
  border-top: 1px solid rgba(148, 163, 184, 0.25);
}

.teacher-landing__footer-grid {
  display: flex;
  align-items: center;
  justify-content: center;
}

.teacher-landing__footer-brand {
  width: 100%;
  max-width: 860px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.9rem;
}

.teacher-landing__footer-left {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.teacher-landing__footer-socials {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-bottom: 1.4rem;
  justify-content: center;
}

.teacher-landing__footer-social {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-weight: 900;
  background: #ffffff;
  color: #0f172a;
  border: 1px solid rgba(148, 163, 184, 0.35);
  transition: transform 160ms ease, background-color 160ms ease, border-color 160ms ease;
}

.teacher-landing__footer-social--phone {
  width: auto;
  padding-inline: 0.6rem;
  gap: 0.45rem;
}

.teacher-landing__footer-social-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
}

.teacher-landing__footer-social-icon {
  width: 22px;
  height: 22px;
  display: block;
}

.teacher-landing__footer-social:hover,
.teacher-landing__footer-social:focus-visible {
  background: #ffffff;
  border-color: rgba(15, 23, 42, 0.4);
  transform: translateY(-2px);
}

.teacher-landing__footer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  justify-content: center;
}

.teacher-landing__footer-contact-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #64748b;
}

.teacher-landing__footer-powered {
  margin-top: 0.4rem;
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 600;
}

.teacher-landing__footer-powered-link {
  color: inherit;
  font-weight: 700;
  text-decoration: none;
  margin-inline-start: 0.35rem;
}

.teacher-landing__footer-powered-link:hover,
.teacher-landing__footer-powered-link:focus-visible {
  text-decoration: underline;
}


.teacher-landing__footer-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.82rem 1.5rem;
  border-radius: 999px;
  font-weight: 800;
  border: 1px solid rgba(15, 23, 42, 0.15);
  cursor: pointer;
}

.teacher-landing__footer-cta--primary {
  background: #111827;
  color: #ffffff;
}

.teacher-landing__footer-cta--ghost {
  border-color: rgba(15, 23, 42, 0.2);
  color: #111827;
  background: #ffffff;
}

.teacher-landing__footer-heading {
  font-size: 1.05rem;
  margin: 0 0 1rem;
}

.teacher-landing__footer-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.6rem;
}

.teacher-landing__footer-link {
  color: #475569;
  text-decoration: none;
  font-weight: 600;
}

.teacher-landing__footer-link:hover,
.teacher-landing__footer-link:focus-visible {
  color: #111827;
}

.teacher-landing__footer-contact-list {
  list-style: none;
  margin: 1rem 0 0;
  padding: 0;
  display: grid;
  gap: 0.85rem;
}

.teacher-landing__footer-contact-link {
  display: grid;
  gap: 0.3rem;
  text-decoration: none;
  padding: 0.55rem 0.75rem;
  border-radius: 0.9rem;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: #ffffff;
  color: inherit;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.teacher-landing__footer-contact-link:hover,
.teacher-landing__footer-contact-link:focus-visible {
  transform: translateY(-1px);
  box-shadow: var(--teacher-shadow-hover);
}

.teacher-landing__footer-contact-label {
  font-weight: 700;
  font-size: 0.85rem;
  color: #0f172a;
}

.teacher-landing__footer-contact-value {
  font-size: 0.85rem;
  color: #64748b;
  word-break: break-all;
}

.teacher-landing__footer-subtitle {
  margin: 0.5rem 0 0;
  color: #64748b;
  font-size: 0.95rem;
}

.teacher-landing__footer-empty {
  margin: 0.75rem 0 0;
  color: #64748b;
  font-size: 0.9rem;
}

.teacher-landing__copyright {
  margin-top: 3.2rem;
  padding-top: 1.8rem;
  border-top: 1px solid rgba(148, 163, 184, 0.3);
  text-align: center;
  color: #64748b;
  font-weight: 600;
}

@media (max-width: 1200px) {
  .teacher-landing__modern-hero {
    gap: 44px;
  }
}

@media (max-width: 1024px) {
  .teacher-landing__modern-hero {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .teacher-landing__modern-hero-text {
    justify-self: start;
    text-align: left;
    max-width: 100%;
    margin-bottom: 1.8rem;
    background: transparent;
  }

  [dir='rtl'] .teacher-landing__modern-hero-text {
    text-align: right;
    justify-self: end;
  }

  .teacher-landing__modern-hero--below {
    justify-content: flex-start;
    margin-top: -32px;
    flex-wrap: wrap;
  }

  .teacher-landing__modern-heading {
    margin-left: auto;
    margin-right: auto;
  }

  .teacher-landing__modern-actions,
  .teacher-landing__modern-stats {
    justify-content: center;
  }

  .teacher-landing__about-card {
    grid-template-columns: 1fr;
    text-align: center;
  }

}

@media (max-width: 860px) {
  .teacher-landing__nav-cta--desktop {
    display: none;
  }

  .teacher-landing__modern-footer {
    padding: 72px 0 32px;
  }
}

.teacher-landing__inquiry {
  margin-top: var(--sakai-space-6);
  display: grid;
  gap: var(--sakai-space-4);
  padding: var(--sakai-space-5);
  border-radius: var(--sakai-border-radius-xl);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 60%, transparent);
  background: color-mix(in srgb, var(--sakai-surface) 75%, transparent);
  box-shadow: var(--sakai-shadow-sm);
  max-width: 560px;
  width: min(100%, 560px);
  margin-inline: auto;
}

.teacher-landing__inquiry-copy {
  display: grid;
  gap: 0.5rem;
  text-align: center;
}

.teacher-landing__inquiry-title {
  margin: 0;
  font-size: 1.4rem;
  color: var(--sakai-text-strong);
}

.teacher-landing__inquiry-subtitle {
  margin: 0;
  color: var(--sakai-text-muted);
}

.teacher-landing__inquiry-form {
  display: grid;
  gap: var(--sakai-space-3);
  grid-template-columns: 1fr;
}

.teacher-landing__inquiry-field {
  display: grid;
  gap: 0.35rem;
}

.teacher-landing__inquiry-field--full {
  grid-column: 1 / -1;
}

.teacher-landing__inquiry-label {
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.teacher-landing__inquiry-input {
  width: 100%;
  border-radius: var(--sakai-border-radius-md);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
  background: var(--sakai-surface);
  color: var(--sakai-text-color);
  padding: 0.75rem 0.9rem;
  font-size: 0.95rem;
  transition: border-color var(--sakai-transition-duration) var(--sakai-transition-ease),
    box-shadow var(--sakai-transition-duration) var(--sakai-transition-ease);
}

[dir='rtl'] .teacher-landing__inquiry-input {
  text-align: right;
}

.teacher-landing__inquiry-input:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--sakai-primary) 55%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--sakai-primary) 20%, transparent);
}

.teacher-landing__inquiry-input:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.teacher-landing__inquiry-textarea {
  resize: vertical;
  min-height: 120px;
}

.teacher-landing__inquiry-error {
  color: var(--sakai-danger);
  font-size: 0.8rem;
}

.teacher-landing__inquiry-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
}

@media (max-width: 767px) {
  .teacher-landing__inquiry-form {
    grid-template-columns: 1fr;
  }
}
</style>

