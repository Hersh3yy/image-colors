# Component-layer audit (agent output, 2026-09-06)

## Live tree (from app.vue)
AppHeader(ref headerRef) · AppStatus · MainToolbar · OverallAnalaysis[sic]→GroupedColorsDoughnut, ColorPercentages×2→ColorPercentageTooltip
ActivePreset→ImageAnalysisResult · ImageAnalysisResult→{ImageDisplaySection→(BaseButton, GroupedColorsDoughnut, ActionButtonGroup, AnalysisStatsCard, AnalysisSettingsCard→InfoTooltip), ColorAnalysisResults→(InfoTooltip, ColorPercentages, ColorFamilyBreakdown, MobileColorGrid→(ViewModeToggle, ColorCard, ColorListItem), ColorDetailsTable, ProblematicMatches), ScreenshotModal→(ColorFamilyCompact, GroupedColorsDoughnut), ToastNotification}
ImageControls(698 lines)→ParentColors→ColorEditModal · FeedbackManager(ref)→FeedbackModal(774)→AlternativeMatches, <PlayModal> (WRONG TAG — registered as FeedbackPlayModal → renders nothing)
KnowledgeBaseModal(399) · FeedbackPlayModal(1033) · TrainModal(357)

## Dead (~1,900 lines, 13/50 = 26%)
ColorPalette(93), FlippableColorBlock(83), ImageInput(286), MobileColorCard(192), admin/KnowledgeBaseManager(241), feedback/DebugPanel(351), molecules/ColorMatch(127), molecules/StatusIndicator(230), molecules/ParentColorPicker(136); transitively: atoms/StatusBadge(116), atoms/LoadingSpinner(131), atoms/ColorSwatchGrid(42), molecules/ColorPickerModal(73)

## Atomic compliance
- No templates/ tier; feedback/ + admin/ outside taxonomy. tailwind theme.extend = {} (zero tokens).
- Oversized: ImageControls 698, PlayModal 1033, FeedbackModal 774, KnowledgeBaseModal 399, TrainModal 357, ColorDetailsTable 390 (molecule), GroupedColorsDoughnut 321 (molecule).
- Duplicates: ColorCard/ColorListItem/MobileColorCard; StatusBadge/StatusIndicator/AppStatus; ColorFamilyBreakdown/ColorFamilyCompact (same grouping code); ColorEditModal/ColorPickerModal.
- ColorSwatch atom writes clipboard (side effect). BaseButton has 10 props.

## Network from .vue
PlayModal.vue:807,:924 raw fetch, unawaited/uncaught; TrainModal.vue:247,:301,:322 → /.netlify/functions/training/* ; KnowledgeBaseManager (dead). No $fetch/useFetch anywhere.

## State
No Pinia/useState/provide-inject. usePresets() instantiated in app.vue, ImageControls, ActivePreset; useParentColors in app.vue + ImageControls (duplicate state hazard). Props drilling depth 4 with @feedback re-emitted at every level. Notification = template-ref method calls (headerRef.showNotification, feedbackManagerRef.showFeedbackForColor) + ToastNotification + orphaned tooltip state in app.vue:200-202/370-377 (never rendered).

## Styling
24 hardcoded hex literals in 10 files; unscoped <style> leak in ParentColorPicker; mobile handled only by MobileColorGrid + ColorAnalysisResults toggles.

## Charting
Highcharts 12.1.2 via CDN <script> in app.vue useHead; used only in GroupedColorsDoughnut; fallback = silent `if (!window.Highcharts) return`. package.json also has highcharts, highcharts-vue, chart.js, vue-chartjs, ag-charts-* (unused, 5 chart libs).

## Tests
4 files/21 tests; after jest→vi fix 17 pass, 4 fail (GroupedColorsDoughnut: bad [ref=] selector, call count). Nuxt auto-imported children not stubbed. Coverage 3/50 components, 1/9 composables.

## A11y
Zero aria-*/role in tree; no focus management/Escape on 6 modals; icon buttons unlabeled; ColorSwatch clickable div; color-only information channel.
