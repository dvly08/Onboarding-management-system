const THEME_STORAGE_KEY = "gs_onboarding_theme";
const RESOURCES_STORAGE_KEY = "gs_onboarding_resources";
const METRICS_STORAGE_KEY = "gs_onboarding_metrics";
const EXPECTATIONS_STORAGE_KEY = "gs_onboarding_expectations";
const MANAGER_SETTINGS_STORAGE_KEY = "gs_onboarding_manager_settings";
const PLAN_TEMPLATES_STORAGE_KEY = "gs_onboarding_plan_templates";
const TAG_REGISTRY_STORAGE_KEY = "gs_onboarding_tag_registry";
const REMINDERS_STORAGE_KEY = "gs_onboarding_reminders";

const SAMPLE_REMINDERS = [
  { id: "rem_sample_1", title: "Review contractor progress", dueDate: null, done: false },
  { id: "rem_sample_2", title: "Send weekly 1:1 recap", dueDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10), done: false },
  { id: "rem_sample_3", title: "Check ramp targets", dueDate: new Date().toISOString().slice(0, 10), done: true },
];

const state = {
  bootstrap: null,
  dashboard: null,
  managerRecords: [],
  planDraft: null,
  planEditorExpandedPhases: new Set(),
  selectedPhaseId: null,
  taskFilter: "all",
  currentRole: "contractor",
  quickStartTaskId: null,
  theme: "light",
  lastFocusedElement: null,
  newContractorStep: 1,
  newContractorSelectedPlan: "default",
  resourcesCardExpanded: { operatingNorms: true, internalResources: true },
  workspaceSubView: "main",
  reminderEditorReminderId: null,
  oneOnOneEditorAction: null,
  oneOnOneEditorItemId: null,
  oneOnOneTemplateEditingId: null,
  selectedOneOnOneMeetingId: null,
  oneOnOneView: "list",
  oneOnOneSetupTemplateId: "",
  remindersTab: "current",
  operatingNormEditorSectionIndex: null,
};

const elements = {
  loginHero: document.querySelector("#login-hero"),
  loginForm: document.querySelector("#login-form"),
  viewerEmail: document.querySelector("#viewer-email"),
  roleButtons: Array.from(document.querySelectorAll(".role-option")),
  loginMessage: document.querySelector("#login-message"),
  workspace: document.querySelector("#workspace"),
  demoHints: document.querySelector("#demo-hints"),
  workspaceKicker: document.querySelector("#workspace-kicker"),
  workspaceTitle: document.querySelector("#workspace-title"),
  workspaceSubtitle: document.querySelector("#workspace-subtitle"),
  workspaceMessage: document.querySelector("#workspace-message"),
  workspaceNav: document.querySelector("#workspace-nav"),
  workspaceMain: document.querySelector("#workspace-main"),
  viewReminders: document.querySelector("#view-reminders"),
  viewOneOnOnes: document.querySelector("#view-one-on-ones"),
  mastheadAppSwitcher: document.querySelector("#masthead-app-switcher"),
  mastheadTabMain: document.querySelector("#masthead-tab-main"),
  mastheadTabReminders: document.querySelector("#masthead-tab-reminders"),
  mastheadTabOneOnOnes: document.querySelector("#masthead-tab-one-on-ones"),
  viewerEmailChip: document.querySelector("#viewer-email-chip"),
  viewerRoleChip: document.querySelector("#viewer-role-chip"),
  viewerMenu: document.querySelector("#viewer-menu"),
  viewerMenuToggle: document.querySelector("#viewer-menu-toggle"),
  viewerMenuDropdown: document.querySelector("#viewer-menu-dropdown"),
  managerUserSettingsItem: document.querySelector("#manager-user-settings-item"),
  tagsSettingsItem: document.querySelector("#tags-settings-item"),
  managerControls: document.querySelector("#manager-controls"),
  managerContractorSelect: document.querySelector("#manager-contractor-select"),
  managerPlanEditorBtn: document.querySelector("#manager-plan-editor-btn"),
  managerEditContractorBtn: document.querySelector("#manager-edit-contractor-btn"),
  managerNewContractorBtn: document.querySelector("#manager-new-contractor-btn"),
  profileSettings: document.querySelector("#profile-settings"),
  profileSettingsClose: document.querySelector("#profile-settings-close"),
  profileSettingsCancel: document.querySelector("#profile-settings-cancel"),
  themeToggle: document.querySelector("#theme-toggle"),
  logoutBtn: document.querySelector("#logout-btn"),
  quickstartStateLabel: document.querySelector("#quickstart-state-label"),
  quickstartTaskTitle: document.querySelector("#quickstart-task-title"),
  quickstartTaskDescription: document.querySelector("#quickstart-task-description"),
  quickstartTaskStatus: document.querySelector("#quickstart-task-status"),
  quickstartActionBtn: document.querySelector("#quickstart-action-btn"),
  quickstartUnlockCopy: document.querySelector("#quickstart-unlock-copy"),
  quickstartUnlockMeter: document.querySelector("#quickstart-unlock-meter"),
  summaryMyProgress: document.querySelector("#summary-my-progress"),
  summaryMyCaption: document.querySelector("#summary-my-caption"),
  summaryOverallProgress: document.querySelector("#summary-overall-progress"),
  summaryAccessProgress: document.querySelector("#summary-access-progress"),
  summaryAccessCaption: document.querySelector("#summary-access-caption"),
  summaryNextFocus: document.querySelector("#summary-next-focus"),
  summaryBlockers: document.querySelector("#summary-blockers"),
  phaseList: document.querySelector("#phase-list"),
  taskPanelTitle: document.querySelector("#task-panel-title"),
  taskPanelCaption: document.querySelector("#task-panel-caption"),
  taskFilters: document.querySelector("#task-filters"),
  taskList: document.querySelector("#task-list"),
  profileForm: document.querySelector("#profile-form"),
  profileContractorName: document.querySelector("#profile-contractor-name"),
  profileManagerName: document.querySelector("#profile-manager-name"),
  profileStartDate: document.querySelector("#profile-start-date"),
  profileTimezone: document.querySelector("#profile-timezone"),
  profileContractorEmail: document.querySelector("#profile-contractor-email"),
  profileManagerEmail: document.querySelector("#profile-manager-email"),
  managerSettings: document.querySelector("#manager-settings"),
  managerSettingsForm: document.querySelector("#manager-settings-form"),
  managerSettingsClose: document.querySelector("#manager-settings-close"),
  managerSettingsCancel: document.querySelector("#manager-settings-cancel"),
  managerDisplayName: document.querySelector("#manager-display-name"),
  tagsSettingsOverlay: document.querySelector("#tags-settings-overlay"),
  tagsSettingsClose: document.querySelector("#tags-settings-close"),
  tagsSettingsList: document.querySelector("#tags-settings-list"),
  tagsSettingsAdd: document.querySelector("#tags-settings-add"),
  tagsSettingsUsagePanel: document.querySelector("#tags-settings-usage-panel"),
  newContractorOverlay: document.querySelector("#new-contractor-overlay"),
  newContractorForm: document.querySelector("#new-contractor-form"),
  newContractorStep1: document.querySelector("#new-contractor-step1"),
  newContractorStep2: document.querySelector("#new-contractor-step2"),
  newContractorNextBtn: document.querySelector("#new-contractor-next-btn"),
  newContractorBackBtn: document.querySelector("#new-contractor-back-btn"),
  newContractorSubmitBtn: document.querySelector("#new-contractor-submit-btn"),
  newContractorPlanOptions: document.querySelector("#new-contractor-plan-options"),
  newContractorClose: document.querySelector("#new-contractor-close"),
  newContractorCancel: document.querySelector("#new-contractor-cancel"),
  newContractorEmail: document.querySelector("#new-contractor-email"),
  newContractorName: document.querySelector("#new-contractor-name"),
  newContractorStartDate: document.querySelector("#new-contractor-start-date"),
  newContractorTimezone: document.querySelector("#new-contractor-timezone"),
  newContractorMessage: document.querySelector("#new-contractor-message"),
  planEditorOverlay: document.querySelector("#plan-editor-overlay"),
  planEditorForm: document.querySelector("#plan-editor-form"),
  planEditorClose: document.querySelector("#plan-editor-close"),
  planEditorCancel: document.querySelector("#plan-editor-cancel"),
  planEditorMessage: document.querySelector("#plan-editor-message"),
  planName: document.querySelector("#plan-name"),
  planDepartment: document.querySelector("#plan-department"),
  planAddPhaseBtn: document.querySelector("#plan-add-phase-btn"),
  planStageList: document.querySelector("#plan-stage-list"),
  planEditorSaveTemplateBtn: document.querySelector("#plan-editor-save-template-btn"),
  saveTemplateOverlay: document.querySelector("#save-template-overlay"),
  saveTemplateNameInput: document.querySelector("#save-template-name-input"),
  saveTemplateClose: document.querySelector("#save-template-close"),
  saveTemplateSave: document.querySelector("#save-template-save"),
  saveTemplateCancel: document.querySelector("#save-template-cancel"),
  accessList: document.querySelector("#access-list"),
  metricGrid: document.querySelector("#metric-grid"),
  phoneMetrics: document.querySelector("#phone-metrics"),
  metricsHeaderTitle: document.querySelector("#metrics-header-title"),
  metricsHeaderEditBtn: document.querySelector("#metrics-header-edit-btn"),
  rampTargetsEditorBtn: document.querySelector("#ramp-targets-editor-btn"),
  rampTargetsEditorOverlay: document.querySelector("#ramp-targets-editor-overlay"),
  rampTargetsEditorContent: document.querySelector("#ramp-targets-editor-content"),
  rampTargetsEditorClose: document.querySelector("#ramp-targets-editor-close"),
  rampTargetsEditorSave: document.querySelector("#ramp-targets-editor-save"),
  rampTargetsEditorCancel: document.querySelector("#ramp-targets-editor-cancel"),
  expectationList: document.querySelector("#expectation-list"),
  operatingNormsHead: document.querySelector("#operating-norms-head"),
  operatingNormsBody: document.querySelector("#operating-norms-body"),
  internalResourcesHead: document.querySelector("#internal-resources-head"),
  internalResourcesBody: document.querySelector("#internal-resources-body"),
  operatingNormsEditorBtn: document.querySelector("#operating-norms-editor-btn"),
  operatingNormsEditorOverlay: document.querySelector("#operating-norms-editor-overlay"),
  operatingNormsEditorTitle: document.querySelector("#operating-norms-editor-title"),
  operatingNormsEditorContent: document.querySelector("#operating-norms-editor-content"),
  operatingNormsEditorClose: document.querySelector("#operating-norms-editor-close"),
  operatingNormsEditorSave: document.querySelector("#operating-norms-editor-save"),
  operatingNormsEditorCancel: document.querySelector("#operating-norms-editor-cancel"),
  resourceList: document.querySelector("#resource-list"),
  internalResourcesEditorBtn: document.querySelector("#internal-resources-editor-btn"),
  internalResourcesEditorOverlay: document.querySelector("#internal-resources-editor-overlay"),
  internalResourcesEditorContent: document.querySelector("#internal-resources-editor-content"),
  internalResourcesEditorClose: document.querySelector("#internal-resources-editor-close"),
  internalResourcesEditorSave: document.querySelector("#internal-resources-editor-save"),
  internalResourcesEditorCancel: document.querySelector("#internal-resources-editor-cancel"),
  remindersList: document.querySelector("#reminders-list"),
  remindersAddBtn: document.querySelector("#reminders-add-btn"),
  oneOnOnesContent: document.querySelector("#one-on-ones-content"),
  oneOnOneSetupBtn: document.querySelector("#one-on-one-setup-btn"),
  oneOnOneViewTemplatesBtn: document.querySelector("#one-on-one-view-templates-btn"),
  oneOnOneTemplateBtn: document.querySelector("#one-on-one-template-btn"),
  reminderEditorOverlay: document.querySelector("#reminder-editor-overlay"),
  reminderEditorTitle: document.querySelector("#reminder-editor-title"),
  reminderEditorTitleInput: document.querySelector("#reminder-editor-title-input"),
  reminderEditorNoDate: document.querySelector("#reminder-editor-no-date"),
  reminderEditorDateWrap: document.querySelector("#reminder-editor-date-wrap"),
  reminderEditorDate: document.querySelector("#reminder-editor-date"),
  reminderEditorClose: document.querySelector("#reminder-editor-close"),
  reminderEditorSave: document.querySelector("#reminder-editor-save"),
  reminderEditorCancel: document.querySelector("#reminder-editor-cancel"),
  oneOnOneSetupOverlay: document.querySelector("#one-on-one-setup-overlay"),
  oneOnOneSetupClose: document.querySelector("#one-on-one-setup-close"),
  oneOnOneSetupCancel: document.querySelector("#one-on-one-setup-cancel"),
  oneOnOneSetupSave: document.querySelector("#one-on-one-setup-save"),
  oneOnOneSetupNameInput: document.querySelector("#one-on-one-setup-name-input"),
  oneOnOneSetupDateInput: document.querySelector("#one-on-one-setup-date-input"),
  oneOnOneSetupCadenceInput: document.querySelector("#one-on-one-setup-cadence-input"),
  oneOnOneSetupResetMode: document.querySelector("#one-on-one-setup-reset-mode"),
  oneOnOneSetupTemplateOptions: document.querySelector("#one-on-one-setup-template-options"),
  oneOnOneSetupMessage: document.querySelector("#one-on-one-setup-message"),
  oneOnOneTemplateOverlay: document.querySelector("#one-on-one-template-overlay"),
  oneOnOneTemplateClose: document.querySelector("#one-on-one-template-close"),
  oneOnOneTemplateCancel: document.querySelector("#one-on-one-template-cancel"),
  oneOnOneTemplateSave: document.querySelector("#one-on-one-template-save"),
  oneOnOneTemplateTitle: document.querySelector("#one-on-one-template-title"),
  oneOnOneTemplateNameInput: document.querySelector("#one-on-one-template-name-input"),
  oneOnOneTemplateCadenceInput: document.querySelector("#one-on-one-template-cadence-input"),
  oneOnOneTemplateResetMode: document.querySelector("#one-on-one-template-reset-mode"),
  oneOnOneTemplateManagerNotes: document.querySelector("#one-on-one-template-manager-notes"),
  oneOnOneTemplateContractorPoints: document.querySelector("#one-on-one-template-contractor-points"),
  oneOnOneTemplateMetrics: document.querySelector("#one-on-one-template-metrics"),
  oneOnOneTemplateActionItems: document.querySelector("#one-on-one-template-action-items"),
  oneOnOneTemplateMessage: document.querySelector("#one-on-one-template-message"),
  oneOnOneEditorOverlay: document.querySelector("#one-on-one-editor-overlay"),
  oneOnOneEditorTitle: document.querySelector("#one-on-one-editor-title"),
  oneOnOneEditorLabel: document.querySelector("#one-on-one-editor-label"),
  oneOnOneEditorText: document.querySelector("#one-on-one-editor-text"),
  oneOnOneEditorLinkWrap: document.querySelector("#one-on-one-editor-link-wrap"),
  oneOnOneEditorLink: document.querySelector("#one-on-one-editor-link"),
  oneOnOneEditorClose: document.querySelector("#one-on-one-editor-close"),
  oneOnOneEditorSave: document.querySelector("#one-on-one-editor-save"),
  oneOnOneEditorCancel: document.querySelector("#one-on-one-editor-cancel"),
};

initialize();

async function initialize() {
  bindEvents();
  updateRoleUI();
  loadTheme();
  showAuthenticationView();

  try {
    state.bootstrap = await api("/api/bootstrap");
    renderDemoHints();
  } catch (error) {
    showAppMessage(error.message, "error");
  }
}

function bindEvents() {
  elements.roleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.currentRole = button.dataset.role;
      updateRoleUI();
    });
  });

  elements.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      viewerEmail: elements.viewerEmail.value.trim(),
      viewerRole: state.currentRole,
      contractorEmail: state.currentRole === "contractor" ? elements.viewerEmail.value.trim() : "",
    };
    try {
      await openSession(payload);
      showAppMessage("", "");
    } catch (error) {
      showAppMessage(error.message, "error");
    }
  });

  elements.demoHints.addEventListener("click", (event) => {
    const pill = event.target.closest("[data-demo-role]");
    if (!pill) return;

    const role = pill.dataset.demoRole;
    state.currentRole = role;
    updateRoleUI();

    elements.viewerEmail.value = pill.dataset.demoViewer || "";
  });

  elements.taskFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    state.taskFilter = button.dataset.filter;
    renderTaskFilters();
    renderTasks();
  });

  elements.profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.dashboard) return;
    const isManager = state.dashboard.viewer.role === "manager";
    const { record } = state.dashboard;

    const payload = {
      viewerEmail: state.dashboard.viewer.email,
      viewerRole: state.dashboard.viewer.role,
      contractorName: elements.profileContractorName.value.trim(),
      managerName: elements.profileManagerName.value.trim(),
      startDate: isManager ? elements.profileStartDate.value : record.startDate || "",
      timezone: isManager ? elements.profileTimezone.value.trim() : record.timezone || "",
      managerEmail: record.managerEmail || state.dashboard.viewer.email,
    };

    try {
      const nextDashboard = await api(
        `/api/records/${state.dashboard.record.id}/profile`,
        {
          method: "PATCH",
          body: payload,
        }
      );
      applyDashboard(nextDashboard, { preservePhase: true });
      closeProfileSettings({ restoreFocus: false });
      showAppMessage("Profile saved.", "success");
    } catch (error) {
      showAppMessage(error.message, "error");
    }
  });

  elements.workspaceNav?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-target]");
    if (!button) return;
    elements.workspaceNav.querySelectorAll("[data-target]").forEach((item) => {
      item.classList.toggle("pill-btn--active", item === button);
    });
    const target = document.querySelector(button.dataset.target);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  elements.managerEditContractorBtn?.addEventListener("click", () => {
    if (!state.dashboard || state.dashboard.viewer.role !== "manager") return;
    openProfileSettings();
  });

  elements.profileSettingsClose?.addEventListener("click", () => {
    closeProfileSettings({ resetForm: true });
  });
  elements.profileSettingsCancel?.addEventListener("click", () => {
    closeProfileSettings({ resetForm: true });
  });
  elements.profileSettings?.addEventListener("click", (event) => {
    if (
      event.target === elements.profileSettings ||
      event.target.classList?.contains("settings-backdrop")
    ) {
      closeProfileSettings({ resetForm: true });
    }
  });
  elements.managerContractorSelect?.addEventListener("change", async (event) => {
    const nextRecordId = event.target.value;
    if (!nextRecordId || !state.dashboard) return;
    if (String(state.dashboard.record.id) === String(nextRecordId)) return;
    await switchManagerRecord(nextRecordId);
  });

  elements.managerPlanEditorBtn?.addEventListener("click", () => {
    openPlanEditor();
  });

  elements.managerNewContractorBtn?.addEventListener("click", () => {
    openNewContractorModal();
  });

  elements.newContractorNextBtn?.addEventListener("click", () => {
    if (!state.dashboard || state.dashboard.viewer.role !== "manager") return;
    const contractorEmail = elements.newContractorEmail.value.trim();
    if (!contractorEmail) {
      showMessage(elements.newContractorMessage, "Enter contractor work email.", "error");
      return;
    }
    showMessage(elements.newContractorMessage, "", "");
    state.newContractorStep = 2;
    renderNewContractorPlanOptions();
    elements.newContractorStep1?.classList.add("hidden");
    elements.newContractorStep2?.classList.remove("hidden");
  });

  elements.newContractorBackBtn?.addEventListener("click", () => {
    state.newContractorStep = 1;
    elements.newContractorStep1?.classList.remove("hidden");
    elements.newContractorStep2?.classList.add("hidden");
  });

  elements.newContractorSubmitBtn?.addEventListener("click", async () => {
    if (!state.dashboard || state.dashboard.viewer.role !== "manager") return;

    const contractorEmail = elements.newContractorEmail.value.trim();
    const contractorName = elements.newContractorName.value.trim();
    const step2Message = elements.newContractorStep2?.querySelector("#new-contractor-step2-message") || elements.newContractorMessage;
    const choice = state.newContractorSelectedPlan;
    const viewerEmail = state.dashboard.viewer.email;

    let planToApply = null;
    if (choice === "current" && state.dashboard.planTemplate) {
      const pt = state.dashboard.planTemplate;
      planToApply = {
        name: pt.name || "",
        department: pt.department || "",
        phases: (pt.phases || []).map((p) => ({
          id: p.id,
          label: p.label || "",
          window: p.window || "",
          summary: p.summary || "",
          tasks: (p.tasks || []).map((t) => ({
            id: t.id,
            ownerRole: t.owner_role || t.ownerRole,
            group: Array.isArray(t.group) ? t.group : (t.group != null && String(t.group).trim() !== "" ? [String(t.group).trim()] : []),
            title: t.title || "",
            description: t.description || "",
            dueLabel: t.due_label || t.dueLabel || "",
            dependencyIds: t.dependency_ids || t.dependencyIds || [],
          })),
        })),
      };
    } else if (choice && choice !== "default") {
      const tpl = getPlanTemplates(viewerEmail).find((t) => t.id === choice);
      if (tpl?.plan) planToApply = tpl.plan;
    }

    try {
      await openSession({
        viewerEmail: state.dashboard.viewer.email,
        viewerRole: "manager",
        contractorEmail,
        contractorName,
        managerName: state.dashboard.record.managerName || "",
        startDate: elements.newContractorStartDate.value,
        timezone:
          elements.newContractorTimezone.value.trim() ||
          state.dashboard.record.timezone ||
          state.bootstrap?.defaultTimezone,
      });
      const recordId = state.dashboard?.record?.id;
      if (recordId && planToApply) {
        await api(`/api/records/${recordId}/plan`, {
          method: "PATCH",
          body: {
            viewerEmail,
            viewerRole: "manager",
            name: planToApply.name,
            department: planToApply.department,
            phases: planToApply.phases,
          },
        });
        const nextDashboard = await api(
          `/api/records/${recordId}?viewerEmail=${encodeURIComponent(viewerEmail)}&viewerRole=manager`
        );
        applyDashboard(nextDashboard, { preservePhase: false });
      }
      closeNewContractorModal({ resetForm: true, restoreFocus: false });
      showAppMessage(
        `Onboarding record ready for ${contractorName || contractorEmail}.`,
        "success"
      );
    } catch (error) {
      showMessage(step2Message, error.message, "error");
    }
  });

  elements.newContractorClose?.addEventListener("click", () => {
    closeNewContractorModal({ resetForm: true });
  });
  elements.newContractorCancel?.addEventListener("click", () => {
    closeNewContractorModal({ resetForm: true });
  });
  elements.newContractorOverlay?.addEventListener("click", (event) => {
    if (
      event.target === elements.newContractorOverlay ||
      event.target.classList?.contains("settings-backdrop")
    ) {
      closeNewContractorModal({ resetForm: true });
    }
  });
  elements.planName?.addEventListener("input", (event) => {
    if (!state.planDraft) return;
    state.planDraft.name = event.target.value;
  });
  elements.planDepartment?.addEventListener("input", (event) => {
    if (!state.planDraft) return;
    state.planDraft.department = event.target.value;
  });
  elements.planAddPhaseBtn?.addEventListener("click", () => {
    if (!state.planDraft) return;
    state.planDraft.phases.push(createEmptyPlanPhase());
    renderPlanEditorDraft();
  });
  elements.planStageList?.addEventListener("click", (event) => {
    const removeBtn = event.target.closest(".tag-bubble-remove");
    if (removeBtn && state.planDraft) {
      const phaseIndex = Number(removeBtn.dataset.phaseIndex);
      const taskIndex = Number(removeBtn.dataset.taskIndex);
      const labelIndex = Number(removeBtn.dataset.labelIndex);
      const task = state.planDraft.phases[phaseIndex]?.tasks[taskIndex];
      if (task && Number.isInteger(phaseIndex) && Number.isInteger(taskIndex)) {
        const labels = Array.isArray(task.labels) ? [...task.labels] : (task.group != null && task.group !== "" ? [task.group] : []);
        if (Number.isInteger(labelIndex) && labelIndex >= 0 && labelIndex < labels.length) {
          labels.splice(labelIndex, 1);
          task.labels = labels;
          renderPlanEditorDraft();
        }
      }
      return;
    }
    const actionButton = event.target.closest("[data-action]");
    if (!actionButton || !state.planDraft) return;

    if (actionButton.dataset.action === "toggle-phase") {
      const idx = Number(actionButton.dataset.phaseIndex);
      if (!Number.isInteger(idx)) return;
      const expanded = state.planEditorExpandedPhases.has(idx);
      if (expanded) state.planEditorExpandedPhases.delete(idx);
      else state.planEditorExpandedPhases.add(idx);
      const card = actionButton.closest(".plan-stage-card");
      if (card) {
        card.classList.toggle("is-collapsed", !state.planEditorExpandedPhases.has(idx));
        const chevron = actionButton.querySelector(".plan-stage-chevron");
        if (chevron) chevron.textContent = state.planEditorExpandedPhases.has(idx) ? "▼" : "▶";
        actionButton.setAttribute("aria-expanded", String(state.planEditorExpandedPhases.has(idx)));
      }
      return;
    }

    const phaseIndex = Number(actionButton.dataset.phaseIndex);
    const taskIndex = Number(actionButton.dataset.taskIndex);
    if (!Number.isInteger(phaseIndex) || !state.planDraft.phases[phaseIndex]) return;

    if (actionButton.dataset.action === "remove-phase") {
      state.planDraft.phases.splice(phaseIndex, 1);
      state.planEditorExpandedPhases = new Set(
        state.planDraft.phases.map((_, i) => i)
      );
      renderPlanEditorDraft();
      return;
    }

    if (actionButton.dataset.action === "add-task") {
      state.planDraft.phases[phaseIndex].tasks.push(createEmptyPlanTask());
      renderPlanEditorDraft();
      return;
    }

    if (
      actionButton.dataset.action === "remove-task" &&
      Number.isInteger(taskIndex) &&
      state.planDraft.phases[phaseIndex].tasks[taskIndex]
    ) {
      state.planDraft.phases[phaseIndex].tasks.splice(taskIndex, 1);
      renderPlanEditorDraft();
    }
  });
  elements.planStageList?.addEventListener("keydown", (event) => {
    if (event.target.classList.contains("tag-input") && event.key === "Enter") {
      event.preventDefault();
      const phaseIndex = Number(event.target.dataset.phaseIndex);
      const taskIndex = Number(event.target.dataset.taskIndex);
      if (!state.planDraft || !Number.isInteger(phaseIndex) || !Number.isInteger(taskIndex)) return;
      const task = state.planDraft.phases[phaseIndex]?.tasks[taskIndex];
      if (!task) return;
      const value = (event.target.value || "").trim();
      if (value) {
        const labels = Array.isArray(task.labels) ? [...task.labels] : (task.group != null && task.group !== "" ? [task.group] : []);
        if (!labels.includes(value)) labels.push(value);
        task.labels = labels;
        event.target.value = "";
        renderPlanEditorDraft();
      }
    }
  });
  elements.planStageList?.addEventListener("blur", (event) => {
    if (event.target.classList.contains("tag-input")) {
      const phaseIndex = Number(event.target.dataset.phaseIndex);
      const taskIndex = Number(event.target.dataset.taskIndex);
      if (!state.planDraft || !Number.isInteger(phaseIndex) || !Number.isInteger(taskIndex)) return;
      const task = state.planDraft.phases[phaseIndex]?.tasks[taskIndex];
      if (!task) return;
      const value = (event.target.value || "").trim();
      if (value) {
        const labels = Array.isArray(task.labels) ? [...task.labels] : (task.group != null && task.group !== "" ? [task.group] : []);
        if (!labels.includes(value)) {
          labels.push(value);
          task.labels = labels;
          event.target.value = "";
          renderPlanEditorDraft();
        }
      }
    }
  }, true);
  elements.planStageList?.addEventListener("input", handlePlanStageFieldChange);
  elements.planStageList?.addEventListener("change", handlePlanStageFieldChange);
  elements.planEditorForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.dashboard || !state.planDraft) return;

    try {
      const nextDashboard = await api(`/api/records/${state.dashboard.record.id}/plan`, {
        method: "PATCH",
        body: {
          viewerEmail: state.dashboard.viewer.email,
          viewerRole: state.dashboard.viewer.role,
          name: state.planDraft.name.trim(),
          department: state.planDraft.department.trim(),
          phases: state.planDraft.phases.map((phase) => ({
            id: phase.id,
            label: phase.label.trim(),
            window: phase.window.trim(),
            summary: phase.summary.trim(),
            tasks: phase.tasks.map((task) => ({
              id: task.id,
              ownerRole: task.ownerRole,
              group: Array.isArray(task.labels) ? task.labels : (task.group != null && String(task.group).trim() !== "" ? [String(task.group).trim()] : []),
              title: task.title.trim(),
              description: task.description.trim(),
              dueLabel: (task.dueLabel != null ? task.dueLabel : "").trim(),
              dependencyIds: Array.isArray(task.dependencyIds) ? task.dependencyIds : [],
            })),
          })),
        },
      });
      applyDashboard(nextDashboard, { preservePhase: false });
      closePlanEditor({ resetDraft: true, restoreFocus: false });
      showAppMessage("Onboarding plan updated.", "success");
    } catch (error) {
      showMessage(elements.planEditorMessage, error.message, "error");
    }
  });
  elements.planEditorClose?.addEventListener("click", () => {
    closePlanEditor({ resetDraft: true });
  });
  elements.planEditorCancel?.addEventListener("click", () => {
    closePlanEditor({ resetDraft: true });
  });
  elements.planEditorSaveTemplateBtn?.addEventListener("click", () => {
    if (!state.dashboard || !state.planDraft || state.dashboard.viewer.role !== "manager") return;
    openSaveTemplateOverlay();
  });
  elements.saveTemplateClose?.addEventListener("click", closeSaveTemplateOverlay);
  elements.saveTemplateCancel?.addEventListener("click", closeSaveTemplateOverlay);
  elements.saveTemplateSave?.addEventListener("click", saveTemplateFromOverlay);
  elements.saveTemplateOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.saveTemplateOverlay || event.target.classList?.contains("settings-backdrop")) {
      closeSaveTemplateOverlay();
    }
  });
  elements.planEditorOverlay?.addEventListener("click", (event) => {
    if (
      event.target === elements.planEditorOverlay ||
      event.target.classList?.contains("settings-backdrop")
    ) {
      closePlanEditor({ resetDraft: true });
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (elements.viewerMenuDropdown && !elements.viewerMenuDropdown.classList.contains("hidden")) {
      event.preventDefault();
      closeViewerMenu();
      return;
    }
    if (elements.saveTemplateOverlay && !elements.saveTemplateOverlay.classList.contains("hidden")) {
      event.preventDefault();
      closeSaveTemplateOverlay();
      return;
    }
    if (elements.oneOnOneSetupOverlay && !elements.oneOnOneSetupOverlay.classList.contains("hidden")) {
      event.preventDefault();
      closeOneOnOneSetupOverlay();
      return;
    }
    if (elements.oneOnOneTemplateOverlay && !elements.oneOnOneTemplateOverlay.classList.contains("hidden")) {
      event.preventDefault();
      closeOneOnOneTemplateOverlay();
      return;
    }
    if (!elements.planEditorOverlay?.classList.contains("hidden")) {
      event.preventDefault();
      closePlanEditor({ resetDraft: true });
      return;
    }
    if (!elements.newContractorOverlay?.classList.contains("hidden")) {
      event.preventDefault();
      closeNewContractorModal({ resetForm: true });
      return;
    }
    if (!elements.profileSettings?.classList.contains("hidden")) {
      event.preventDefault();
      closeProfileSettings({ resetForm: true });
      return;
    }
  if (!elements.managerSettings?.classList.contains("hidden")) {
    event.preventDefault();
    closeManagerSettings({ resetForm: true });
    return;
  }
  if (elements.rampTargetsEditorOverlay && !elements.rampTargetsEditorOverlay.classList.contains("hidden")) {
    event.preventDefault();
    closeRampTargetsEditor();
    return;
  }
  if (elements.operatingNormsEditorOverlay && !elements.operatingNormsEditorOverlay.classList.contains("hidden")) {
    event.preventDefault();
    closeOperatingNormsEditor();
    return;
  }
  if (elements.internalResourcesEditorOverlay && !elements.internalResourcesEditorOverlay.classList.contains("hidden")) {
    event.preventDefault();
    closeInternalResourcesEditor();
    return;
  }
  if (elements.reminderEditorOverlay && !elements.reminderEditorOverlay.classList.contains("hidden")) {
    event.preventDefault();
    closeReminderEditor();
    return;
  }
  if (elements.oneOnOneEditorOverlay && !elements.oneOnOneEditorOverlay.classList.contains("hidden")) {
    event.preventDefault();
    closeOneOnOneEditor();
    return;
  }
  });

  elements.viewerMenuToggle?.addEventListener("click", () => {
    toggleViewerMenu();
  });

  elements.managerUserSettingsItem?.addEventListener("click", () => {
    if (!state.dashboard || state.dashboard.viewer.role !== "manager") return;
    closeViewerMenu();
    openManagerSettings();
  });

  elements.tagsSettingsItem?.addEventListener("click", () => {
    closeViewerMenu();
    openTagsSettings();
  });

  elements.managerSettingsClose?.addEventListener("click", () => {
    closeManagerSettings({ resetForm: true });
  });
  elements.managerSettingsCancel?.addEventListener("click", () => {
    closeManagerSettings({ resetForm: true });
  });
  elements.managerSettings?.addEventListener("click", (event) => {
    if (
      event.target === elements.managerSettings ||
      event.target.classList?.contains("settings-backdrop")
    ) {
      closeManagerSettings({ resetForm: true });
    }
  });

  elements.tagsSettingsClose?.addEventListener("click", closeTagsSettings);
  elements.tagsSettingsOverlay?.addEventListener("click", (event) => {
    if (
      event.target === elements.tagsSettingsOverlay ||
      event.target.classList?.contains("settings-backdrop")
    ) {
      closeTagsSettings();
    }
  });

  elements.tagsSettingsAdd?.addEventListener("click", () => {
    state.tagsSettingsAdding = true;
    renderTagsSettingsList();
  });

  elements.tagsSettingsList?.addEventListener("click", (event) => {
    const editBtn = event.target.closest(".tag-settings-edit");
    const removeBtn = event.target.closest(".tag-settings-remove");
    if (editBtn && editBtn.dataset.tagName !== undefined) {
      event.preventDefault();
      const oldName = editBtn.dataset.tagName;
      const newName = window.prompt("Rename label:", oldName);
      if (newName != null && newName.trim() !== "" && newName.trim() !== oldName) {
        updateTagInAllPlans(state.dashboard?.viewer?.email || "", oldName, newName.trim());
        renderTagsSettingsList();
        hideTagsSettingsUsagePanel();
      }
      return;
    }
    if (removeBtn && removeBtn.dataset.tagName !== undefined) {
      event.preventDefault();
      const tagName = removeBtn.dataset.tagName;
      if (window.confirm(`Remove label “${tagName}” from all tasks?`)) {
        removeTagFromAllPlans(state.dashboard?.viewer?.email || "", tagName);
        renderTagsSettingsList();
        hideTagsSettingsUsagePanel();
      }
      return;
    }
    const row = event.target.closest(".tag-settings-row");
    if (row && !row.classList.contains("tag-settings-row--add") && row.dataset.tagName !== undefined) {
      const managerEmail = state.dashboard?.viewer?.email || "";
      const tags = getAllTagsWithUsage(managerEmail);
      const tag = tags.find((t) => t.name === row.dataset.tagName);
      if (tag) showTagsSettingsUsagePanel(tag.name, tag.taskRefs);
    }
  });

  elements.rampTargetsEditorBtn?.addEventListener("click", () => {
    if (state.dashboard?.viewer.role !== "manager") return;
    openRampTargetsEditor();
  });
  elements.rampTargetsEditorClose?.addEventListener("click", closeRampTargetsEditor);
  elements.rampTargetsEditorCancel?.addEventListener("click", closeRampTargetsEditor);
  elements.rampTargetsEditorSave?.addEventListener("click", saveRampTargetsEditor);
  elements.rampTargetsEditorOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.rampTargetsEditorOverlay || event.target.classList?.contains("settings-backdrop")) {
      closeRampTargetsEditor();
    }
  });

  elements.operatingNormsEditorBtn?.addEventListener("click", () => {
    if (state.dashboard?.viewer.role !== "manager") return;
    openOperatingNormsEditor();
  });
  elements.operatingNormsEditorClose?.addEventListener("click", closeOperatingNormsEditor);
  elements.operatingNormsEditorCancel?.addEventListener("click", closeOperatingNormsEditor);
  elements.operatingNormsEditorSave?.addEventListener("click", saveOperatingNormsEditor);
  elements.operatingNormsEditorOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.operatingNormsEditorOverlay || event.target.classList?.contains("settings-backdrop")) {
      closeOperatingNormsEditor();
    }
  });

  elements.internalResourcesEditorBtn?.addEventListener("click", () => {
    if (state.dashboard?.viewer.role !== "manager") return;
    openInternalResourcesEditor();
  });
  elements.internalResourcesEditorClose?.addEventListener("click", closeInternalResourcesEditor);
  elements.internalResourcesEditorCancel?.addEventListener("click", closeInternalResourcesEditor);
  elements.internalResourcesEditorSave?.addEventListener("click", saveInternalResourcesEditor);
  elements.internalResourcesEditorOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.internalResourcesEditorOverlay || event.target.classList?.contains("settings-backdrop")) {
      closeInternalResourcesEditor();
    }
  });

  elements.operatingNormsHead?.querySelector(".collapsible-toggle")?.addEventListener("click", () => {
    state.resourcesCardExpanded.operatingNorms = !state.resourcesCardExpanded.operatingNorms;
    syncResourcesCardCollapsed();
  });
  elements.internalResourcesHead?.querySelector(".collapsible-toggle")?.addEventListener("click", () => {
    state.resourcesCardExpanded.internalResources = !state.resourcesCardExpanded.internalResources;
    syncResourcesCardCollapsed();
  });

  elements.mastheadAppSwitcher?.addEventListener("click", (event) => {
    const tab = event.target.closest(".masthead-tab");
    if (!tab || !tab.dataset.view) return;
    setWorkspaceSubView(tab.dataset.view);
  });

  document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented) return;
    if (event.key === "Escape" && state.dashboard && state.workspaceSubView !== "main") {
      setWorkspaceSubView("main");
    }
  });

  elements.remindersAddBtn?.addEventListener("click", () => {
    if (!state.dashboard?.viewer?.email) return;
    openReminderEditor(null);
  });

  elements.viewReminders?.addEventListener("click", (event) => {
    const tab = event.target.closest(".reminders-tab[data-reminders-tab]");
    if (!tab) return;
    const value = tab.dataset.remindersTab;
    if (value === "current" || value === "past") {
      state.remindersTab = value;
      renderReminders();
    }
  });

  elements.reminderEditorClose?.addEventListener("click", closeReminderEditor);
  elements.reminderEditorCancel?.addEventListener("click", closeReminderEditor);
  elements.reminderEditorSave?.addEventListener("click", saveReminderEditor);
  elements.reminderEditorOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.reminderEditorOverlay || event.target.classList?.contains("settings-backdrop")) {
      closeReminderEditor();
    }
  });
  elements.reminderEditorNoDate?.addEventListener("change", () => {
    if (elements.reminderEditorDateWrap) {
      elements.reminderEditorDateWrap.classList.toggle("hidden", elements.reminderEditorNoDate?.checked ?? false);
    }
  });

  elements.oneOnOneSetupBtn?.addEventListener("click", () => {
    if (state.dashboard?.viewer.role !== "manager") return;
    openOneOnOneSetupOverlay();
  });
  elements.oneOnOneViewTemplatesBtn?.addEventListener("click", () => {
    if (state.dashboard?.viewer.role !== "manager") return;
    state.oneOnOneView = "templates";
    renderOneOnOnes();
  });
  elements.oneOnOneTemplateBtn?.addEventListener("click", () => {
    if (state.dashboard?.viewer.role !== "manager") return;
    openOneOnOneTemplateOverlay();
  });
  elements.oneOnOneSetupClose?.addEventListener("click", closeOneOnOneSetupOverlay);
  elements.oneOnOneSetupCancel?.addEventListener("click", closeOneOnOneSetupOverlay);
  elements.oneOnOneSetupSave?.addEventListener("click", saveOneOnOneSetupOverlay);
  elements.oneOnOneSetupOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.oneOnOneSetupOverlay || event.target.classList?.contains("settings-backdrop")) {
      closeOneOnOneSetupOverlay();
    }
  });
  elements.oneOnOneSetupTemplateOptions?.addEventListener("change", (event) => {
    const input = event.target.closest("input[name='one-on-one-template']");
    if (!input) return;
    state.oneOnOneSetupTemplateId = input.value;
    const templates = state.dashboard?.oneOnOnes?.templates || [];
    const selectedTemplate = templates.find((template) => String(template.id) === String(input.value));
    if (selectedTemplate) {
      if (elements.oneOnOneSetupCadenceInput) {
        elements.oneOnOneSetupCadenceInput.value = String(selectedTemplate.cadenceDays || 7);
      }
      if (elements.oneOnOneSetupResetMode) {
        elements.oneOnOneSetupResetMode.value = selectedTemplate.agendaResetMode || "template";
      }
    }
    renderOneOnOneSetupTemplateOptions();
  });

  elements.oneOnOneTemplateClose?.addEventListener("click", closeOneOnOneTemplateOverlay);
  elements.oneOnOneTemplateCancel?.addEventListener("click", closeOneOnOneTemplateOverlay);
  elements.oneOnOneTemplateSave?.addEventListener("click", saveOneOnOneTemplateOverlay);
  elements.oneOnOneTemplateOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.oneOnOneTemplateOverlay || event.target.classList?.contains("settings-backdrop")) {
      closeOneOnOneTemplateOverlay();
    }
  });

  elements.oneOnOneEditorClose?.addEventListener("click", closeOneOnOneEditor);
  elements.oneOnOneEditorCancel?.addEventListener("click", closeOneOnOneEditor);
  elements.oneOnOneEditorSave?.addEventListener("click", saveOneOnOneEditor);
  elements.oneOnOneEditorOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.oneOnOneEditorOverlay || event.target.classList?.contains("settings-backdrop")) {
      closeOneOnOneEditor();
    }
  });

  elements.themeToggle?.addEventListener("click", () => {
    const next = state.theme === "dark" ? "light" : "dark";
    setTheme(next);
  });

  elements.metricsHeaderEditBtn?.addEventListener("click", () => {
    if (!state.dashboard || state.dashboard.viewer.role !== "manager") return;
    const currentTitle = getMetricsHeaderForCurrentRecord();
    const nextTitle = window.prompt("Header title", currentTitle);
    if (!nextTitle) return;
    setMetricsHeaderForCurrentRecord(nextTitle);
    if (elements.metricsHeaderTitle) {
      elements.metricsHeaderTitle.textContent = nextTitle;
    }
  });

  elements.logoutBtn?.addEventListener("click", () => {
    showAuthenticationView({
      message: "Signed out. Authenticate again to open another record.",
      tone: "success",
      clearCredentials: true,
      resetRole: true,
    });
  });

  elements.managerSettingsForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!state.dashboard || state.dashboard.viewer.role !== "manager") {
      closeManagerSettings({ resetForm: true });
      return;
    }
    const email = state.dashboard.viewer.email;
    const allSettings = loadManagerSettings();
    const next = {
      ...(allSettings[email] || {}),
      displayName: elements.managerDisplayName?.value || "",
    };
    allSettings[email] = next;
    saveManagerSettings(allSettings);
    closeManagerSettings({ resetForm: false });
  });
}

function updateRoleUI() {
  elements.roleButtons.forEach((button) => {
    button.classList.toggle("role-option--active", button.dataset.role === state.currentRole);
  });

}

async function openSession(payload) {
  const nextDashboard = await api("/api/session", {
    method: "POST",
    body: payload,
  });

  applyDashboard(nextDashboard, { preservePhase: false });
  showWorkspaceView();
}

function applyDashboard(nextDashboard, { preservePhase }) {
  state.dashboard = nextDashboard;
  state.managerRecords = Array.isArray(nextDashboard.managerRecords)
    ? nextDashboard.managerRecords
    : [];
  state.currentRole = nextDashboard.viewer.role;
  const quickStartTask = resolveQuickStartTask();
  state.quickStartTaskId = quickStartTask?.id || null;

  const phaseIds = new Set(nextDashboard.phases.map((phase) => phase.id));
  if (!preservePhase || !phaseIds.has(state.selectedPhaseId)) {
    state.selectedPhaseId = nextDashboard.summary.currentPhaseId;
  }
  const meetingIds = new Set((nextDashboard.oneOnOnes?.meetings || []).map((meeting) => String(meeting.id)));
  if (!preservePhase || !meetingIds.has(String(state.selectedOneOnOneMeetingId))) {
    state.selectedOneOnOneMeetingId = nextDashboard.oneOnOnes?.currentMeetingId ?? null;
  }

  if (!["all", "mine", "attention"].includes(state.taskFilter)) {
    state.taskFilter = "all";
  }
  if (!preservePhase) {
    state.oneOnOneView = "list";
    state.taskFilter = nextDashboard.viewer.role === "contractor" ? "mine" : "all";
  }

  renderWorkspace();
  updateRoleUI();
}

function renderWorkspace() {
  const { viewer, record, summary } = state.dashboard;
  const currentPhase = getSelectedPhase();

  elements.workspaceKicker.textContent =
    viewer.role === "manager" ? "Manager view" : "Contractor view";
  elements.workspaceTitle.textContent =
    viewer.role === "manager" ? "Onboarding workspace" : "Onboarding workspace";
  elements.workspaceSubtitle.textContent = "";

  elements.viewerEmailChip.textContent = viewer.email;
  elements.viewerRoleChip.textContent = viewer.role;

  // Manager settings visibility
  if (elements.managerUserSettingsItem) {
    const isManager = viewer.role === "manager";
    elements.managerUserSettingsItem.classList.toggle("hidden", !isManager);
    elements.managerUserSettingsItem.setAttribute("aria-hidden", String(!isManager));
  }
  if (elements.tagsSettingsItem) {
    const isManager = viewer.role === "manager";
    elements.tagsSettingsItem.classList.toggle("hidden", !isManager);
    elements.tagsSettingsItem.setAttribute("aria-hidden", String(!isManager));
  }
  const isManager = viewer.role === "manager";
  const canManageOneOnOnes = isManager && Boolean(state.dashboard?.oneOnOnes?.canManage);
  if (elements.oneOnOneSetupBtn) {
    elements.oneOnOneSetupBtn.classList.toggle("hidden", !canManageOneOnOnes);
    elements.oneOnOneSetupBtn.setAttribute("aria-hidden", String(!canManageOneOnOnes));
    elements.oneOnOneSetupBtn.textContent = state.dashboard?.oneOnOnes?.series ? "Edit 1:1 setup" : "Set up 1:1";
  }
  if (elements.oneOnOneViewTemplatesBtn) {
    elements.oneOnOneViewTemplatesBtn.classList.toggle("hidden", !canManageOneOnOnes);
    elements.oneOnOneViewTemplatesBtn.setAttribute("aria-hidden", String(!canManageOneOnOnes));
    elements.oneOnOneViewTemplatesBtn.setAttribute(
      "aria-pressed",
      String(canManageOneOnOnes && state.oneOnOneView === "templates")
    );
  }
  if (elements.oneOnOneTemplateBtn) {
    elements.oneOnOneTemplateBtn.classList.toggle("hidden", !canManageOneOnOnes);
    elements.oneOnOneTemplateBtn.setAttribute("aria-hidden", String(!canManageOneOnOnes));
  }
  [elements.rampTargetsEditorBtn, elements.internalResourcesEditorBtn].forEach(
    (el) => {
      if (!el) return;
      el.classList.toggle("hidden", !isManager);
      el.setAttribute("aria-hidden", String(!isManager));
    }
  );
  if (elements.operatingNormsEditorBtn) {
    elements.operatingNormsEditorBtn.classList.add("hidden");
    elements.operatingNormsEditorBtn.setAttribute("aria-hidden", "true");
  }
  const planTemplate = state.dashboard.planTemplate || {};

  elements.summaryMyProgress.textContent = `${summary.myCompleted} / ${summary.myTotal}`;
  elements.summaryMyCaption.textContent =
    viewer.role === "manager"
      ? "Your manager-owned steps in this record"
      : "Your contractor-owned steps in this record";
  elements.summaryOverallProgress.textContent = `${summary.overallCompleted} / ${summary.overallTotal}`;
  elements.summaryAccessProgress.textContent = `${summary.access.granted} / ${summary.access.total}`;
  elements.summaryAccessCaption.textContent = `${summary.access.requested} requested, ${summary.access.blocked} blocked`;
  elements.summaryNextFocus.textContent = summary.nextFocus;
  elements.summaryBlockers.textContent =
    summary.blockedTasks > 0
      ? `${summary.blockedTasks} tasks are currently blocked by dependencies.`
      : "No blocked tasks right now.";

  elements.taskPanelTitle.textContent = currentPhase.label;
  elements.taskPanelCaption.textContent = `${currentPhase.window} - ${currentPhase.summary}`;
  syncProfileFormFromDashboard();

  if (elements.metricsHeaderTitle) {
    elements.metricsHeaderTitle.textContent = getMetricsHeaderForCurrentRecord();
  }
  if (elements.metricsHeaderEditBtn) {
    const isManager = viewer.role === "manager";
    elements.metricsHeaderEditBtn.classList.toggle("hidden", !isManager);
    elements.metricsHeaderEditBtn.setAttribute("aria-hidden", String(!isManager));
  }

  renderManagerControls();
  renderQuickStart();
  renderTaskFilters();
  renderPhases();
  renderTasks();
  renderAccess();
  renderMetrics();
  renderExpectations();
  renderResources();
  renderReminders();
  renderOneOnOnes();
  syncResourcesCardCollapsed();
  setWorkspaceSubView(state.workspaceSubView);
}

function setWorkspaceSubView(view) {
  state.workspaceSubView = view;
  const main = elements.workspaceMain;
  const reminders = elements.viewReminders;
  const oneOnOnes = elements.viewOneOnOnes;
  if (main) {
    main.classList.toggle("hidden", view !== "main");
    main.setAttribute("aria-hidden", String(view !== "main"));
  }
  if (reminders) {
    reminders.classList.toggle("hidden", view !== "reminders");
    reminders.setAttribute("aria-hidden", String(view !== "reminders"));
  }
  if (oneOnOnes) {
    oneOnOnes.classList.toggle("hidden", view !== "one-on-ones");
    oneOnOnes.setAttribute("aria-hidden", String(view !== "one-on-ones"));
  }
  if (view === "reminders") renderReminders();
  if (view === "one-on-ones") renderOneOnOnes();
  renderMastheadAppSwitcher();
}

function renderMastheadAppSwitcher() {
  const view = state.workspaceSubView;
  const tabs = [
    elements.mastheadTabMain,
    elements.mastheadTabReminders,
    elements.mastheadTabOneOnOnes,
  ].filter(Boolean);
  tabs.forEach((tab) => {
    const isActive = tab.dataset.view === view;
    tab.classList.toggle("masthead-tab--active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });
}

function syncResourcesCardCollapsed() {
  const { operatingNorms, internalResources } = state.resourcesCardExpanded;
  if (elements.operatingNormsBody) {
    elements.operatingNormsBody.classList.toggle("is-collapsed", !operatingNorms);
  }
  if (elements.operatingNormsHead) {
    elements.operatingNormsHead.setAttribute("aria-expanded", String(operatingNorms));
    const chevron = elements.operatingNormsHead.querySelector(".collapsible-chevron");
    if (chevron) chevron.textContent = operatingNorms ? "▼" : "▶";
  }
  if (elements.internalResourcesBody) {
    elements.internalResourcesBody.classList.toggle("is-collapsed", !internalResources);
  }
  if (elements.internalResourcesHead) {
    elements.internalResourcesHead.setAttribute("aria-expanded", String(internalResources));
    const chevron = elements.internalResourcesHead.querySelector(".collapsible-chevron");
    if (chevron) chevron.textContent = internalResources ? "▼" : "▶";
  }
}

function renderQuickStart() {
  const quickStartTask = resolveQuickStartTask();
  const normalizedTasks = state.dashboard.tasks
    .map((task) => normalizeTaskForViewer(task))
    .filter(Boolean);
  const completedTasks = normalizedTasks.filter((task) => task.completed).length;
  const totalTasks = normalizedTasks.length;
  const completionPct = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 100;

  if (!quickStartTask) {
    elements.quickstartStateLabel.textContent = "Ready";
    elements.quickstartTaskTitle.textContent = "No onboarding tasks yet";
    elements.quickstartTaskDescription.textContent =
      "Use the plan editor to add stages and tasks for this onboarding experience.";
    elements.quickstartTaskStatus.textContent = "Not configured";
    elements.quickstartActionBtn.textContent = "No action";
    elements.quickstartActionBtn.disabled = true;
    elements.quickstartUnlockCopy.textContent = "Add tasks to start tracking onboarding progress.";
    elements.quickstartUnlockMeter.style.width = "100%";
    return;
  }
  const canManagerToggle = canToggleTask(quickStartTask);

  elements.quickstartStateLabel.textContent =
    totalTasks > 0 && completedTasks === totalTasks ? "Complete" : "Active";
  elements.quickstartTaskTitle.textContent = quickStartTask.title;
  elements.quickstartTaskDescription.textContent =
    quickStartTask.description || "No description provided for this task.";
  elements.quickstartTaskStatus.textContent = quickStartTask.completed
    ? "Completed"
    : quickStartTask.blocked
      ? "Blocked"
      : "Ready";
  elements.quickstartTaskStatus.className = `task-chip${
    quickStartTask.completed ? " task-chip--owner-contractor" : ""
  }`;
  elements.quickstartActionBtn.textContent = canManagerToggle
    ? quickStartTask.completed
      ? "Mark as not done"
      : "Mark as complete"
    : "Read only";
  elements.quickstartActionBtn.disabled = !canManagerToggle;
  elements.quickstartActionBtn.onclick = canManagerToggle
    ? async () => {
        await toggleTaskCompletion(quickStartTask);
      }
    : null;

  elements.quickstartUnlockCopy.textContent = `${completedTasks}/${Math.max(
    totalTasks,
    1
  )} tasks completed across this onboarding plan.`;
  elements.quickstartUnlockMeter.style.width = `${Math.max(completionPct, totalTasks ? 12 : 100)}%`;
}

function renderManagerControls() {
  const isManager = state.dashboard?.viewer.role === "manager";
  if (!elements.managerControls) return;

  // Hard-disable manager tools for non-managers (contractors never see this section at all)
  if (!isManager) {
    elements.managerControls.classList.add("hidden");
    elements.managerControls.setAttribute("aria-hidden", "true");
    elements.managerControls.style.display = "none";
    return;
  }

  elements.managerControls.classList.remove("hidden");
  elements.managerControls.removeAttribute("aria-hidden");
  elements.managerControls.style.display = "";

  elements.managerPlanEditorBtn?.toggleAttribute(
    "disabled",
    !state.dashboard?.planTemplate?.editable
  );

  if (!elements.managerContractorSelect) return;

  const currentRecordId = String(state.dashboard.record.id);
  const records = state.managerRecords.length
    ? state.managerRecords
    : [
        {
          id: state.dashboard.record.id,
          contractorEmail: state.dashboard.record.contractorEmail,
          contractorName: state.dashboard.record.contractorName,
        },
      ];

  elements.managerContractorSelect.innerHTML = "";
  records.forEach((record) => {
    const option = document.createElement("option");
    option.value = String(record.id);
    option.textContent = formatContractorOptionLabel(record);
    option.selected = String(record.id) === currentRecordId;
    elements.managerContractorSelect.appendChild(option);
  });
}

function renderDemoHints() {
  if (!state.bootstrap) return;

  elements.demoHints.innerHTML = "";
  state.bootstrap.demoHints.forEach((hint) => {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "hint-pill";
    pill.dataset.demoRole = hint.role;
    pill.dataset.demoViewer = hint.viewer_email;
    pill.dataset.demoContractor = hint.contractor_email;
    pill.innerHTML = `
      <span>${escapeHtml(hint.label || hint.role)}</span>
      ${hint.viewer_email ? `<small>${escapeHtml(hint.viewer_email)}</small>` : ""}
    `;
    elements.demoHints.appendChild(pill);
  });
}

function renderTaskFilters() {
  const mineButton = elements.taskFilters.querySelector('[data-filter="mine"]');
  const attentionButton = elements.taskFilters.querySelector('[data-filter="attention"]');

  if (mineButton) {
    mineButton.textContent =
      state.dashboard.viewer.role === "manager" ? "Manager-owned" : "My tasks";
  }
  if (attentionButton) {
    attentionButton.textContent =
      state.dashboard.viewer.role === "manager" ? "Watch list" : "Waiting on team";
  }

  elements.taskFilters.querySelectorAll("[data-filter]").forEach((button) => {
    button.classList.toggle("pill-btn--active", button.dataset.filter === state.taskFilter);
  });
}

function renderPhases() {
  elements.phaseList.innerHTML = "";

  state.dashboard.phases.forEach((phase) => {
    const percentage =
      phase.overallTotal === 0 ? 0 : Math.round((phase.overallCompleted / phase.overallTotal) * 100);

    const button = document.createElement("button");
    button.type = "button";
    button.className = `phase-item${phase.id === state.selectedPhaseId ? " phase-item--active" : ""}`;
    button.addEventListener("click", () => {
      state.selectedPhaseId = phase.id;
      renderPhases();
      renderTasks();
      const selected = getSelectedPhase();
      elements.taskPanelTitle.textContent = selected.label;
      elements.taskPanelCaption.textContent = `${selected.window} - ${selected.summary}`;
    });

    button.innerHTML = `
      <div class="phase-top">
        <div>
          <p class="phase-window">${escapeHtml(phase.window)}</p>
          <p class="phase-title">${escapeHtml(phase.label)}</p>
        </div>
        <span class="phase-progress">${phase.overallCompleted}/${phase.overallTotal}</span>
      </div>
      <p class="phase-description">${escapeHtml(phase.summary)}</p>
      <div class="phase-meter"><span style="width: ${percentage}%"></span></div>
    `;

    elements.phaseList.appendChild(button);
  });
}

function renderTasks() {
  const selectedPhase = getSelectedPhase();
  const visibleTasks = getVisibleTasks(selectedPhase.id);
  elements.taskList.innerHTML = "";

  if (visibleTasks.length === 0) {
    const empty = document.createElement("div");
    empty.className = "task-empty";
    empty.textContent = "No tasks match this filter for the selected phase.";
    elements.taskList.appendChild(empty);
    return;
  }

  visibleTasks.forEach((task) => {
    const card = document.createElement("article");
    card.className = `task-card task-card--${task.status}`;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "task-toggle";
    toggle.dataset.complete = String(task.completed);
    toggle.textContent = task.completed ? "✓" : "";
    const canToggle = canToggleTask(task);
    toggle.disabled = !canToggle;
    toggle.title = canToggle
      ? "Toggle completion"
      : "Read-only in this view";
    toggle.addEventListener("click", async () => {
      await toggleTaskCompletion(task);
    });

    const content = document.createElement("div");
    content.className = "task-content";

    const ownerLabel = task.owner_role === "manager" ? "Manager" : "Contractor";
    const dependencyTitles = (task.dependencyTitles || [])
      .map((title) => normalizeDependencyTitleForViewer(title))
      .filter(Boolean);
    const blockedMarkup =
      task.blocked && dependencyTitles.length
        ? `<ul class="dependency-list">${dependencyTitles
            .map((title) => `<li>Waiting on: ${escapeHtml(title)}</li>`)
            .join("")}</ul>`
        : "";

    content.innerHTML = `
      <div class="task-heading">
        <h4 class="task-title">${escapeHtml(task.title)}</h4>
        <div class="task-meta">
          <span class="task-chip task-chip--owner-${task.owner_role}">${ownerLabel}</span>
          ${(Array.isArray(task.group) ? task.group : (task.group != null && task.group !== "" ? [task.group] : [])).map((l) => `<span class="task-chip tag-bubble">${escapeHtml(l)}</span>`).join("")}
          ${task.blocked ? '<span class="task-chip task-chip--blocked">Blocked</span>' : ""}
        </div>
      </div>
      <p class="task-description">${escapeHtml(task.description)}</p>
      <div class="task-meta">
        <span class="task-chip">${escapeHtml(task.source)}</span>
        ${
          task.completedAt
            ? `<span class="task-chip">Completed ${formatDateTime(task.completedAt)}</span>`
            : ""
        }
      </div>
      ${blockedMarkup}
    `;

    card.append(toggle, content);
    elements.taskList.appendChild(card);
  });
}

function renderAccess() {
  if (!elements.accessList) return;
  elements.accessList.innerHTML = "";

  state.dashboard.accessBundles.forEach((bundle) => {
    const article = document.createElement("article");
    article.className = "access-item";
    const bundleName = normalizeAccessCopyForViewer(bundle.name);
    const isManager = state.dashboard.viewer.role === "manager";

    const options = isManager
      ? state.bootstrap.accessStatuses
      .map(
        (status) =>
          `<option value="${status}" ${status === bundle.status ? "selected" : ""}>${formatAccessStatus(
            status
          )}</option>`
      )
          .join("")
      : "";

    article.innerHTML = `
      <div class="access-row">
        <div>
          <p class="access-name">${bundleName}</p>
        </div>
        <span class="access-status" data-status="${bundle.status}">${formatAccessStatus(
          bundle.status
        )}</span>
      </div>
        ${
        isManager && bundle.canEdit
          ? `<div class="access-controls">
              <label class="field">
                <span class="sr-only">Access status</span>
                <select data-access-id="${bundle.id}">${options}</select>
              </label>
            </div>`
            : ""
        }
    `;

    if (isManager && bundle.canEdit) {
    const select = article.querySelector("select");
      if (!select) {
        elements.accessList.appendChild(article);
        return;
      }
      select.addEventListener("change", async () => {
        try {
          const nextDashboard = await api(
            `/api/records/${state.dashboard.record.id}/access/${bundle.id}`,
            {
              method: "PATCH",
              body: {
                viewerEmail: state.dashboard.viewer.email,
                viewerRole: state.dashboard.viewer.role,
                status: select.value,
              },
            }
          );
          applyDashboard(nextDashboard, { preservePhase: true });
        } catch (error) {
          showAppMessage(error.message, "error");
        }
      });
    }

    elements.accessList.appendChild(article);
  });
}

function renderMetrics() {
  elements.metricGrid.innerHTML = "";
  elements.phoneMetrics.innerHTML = "";
  if (!state.dashboard) return;

  const isManager = state.dashboard.viewer.role === "manager";
  const buckets = getMetricsForCurrentRecord();

  buckets.forEach((bucket, index) => {
    const card = document.createElement("article");
    card.className = "metric-card";
    const items = Array.isArray(bucket.metrics) ? bucket.metrics : [];
    card.innerHTML = `
      <div class="metric-card-head">
        <h4>${escapeHtml(bucket.month || `Month ${index + 1}`)}</h4>
      </div>
      <ul>
        ${
          items.length
            ? items
                .map(
                  (metric) =>
                    `<li><strong>${escapeHtml(metric.label)}</strong>${
                      metric.target ? `: ${escapeHtml(metric.target)}` : ""
                    }</li>`
                )
                .join("")
            : '<li><span class="resource-note">No expectations added yet.</span></li>'
        }
      </ul>
    `;
    elements.metricGrid.appendChild(card);
  });
  elements.metricGrid.onclick = null;

  // Phone metrics remain read-only quick reference for both roles
  state.dashboard.phoneMetrics.forEach((metric) => {
    const pill = document.createElement("div");
    pill.className = "phone-pill";
    pill.textContent = `${metric.label}: ${metric.target}`;
    elements.phoneMetrics.appendChild(pill);
  });
}

function renderExpectations() {
  elements.expectationList.innerHTML = "";

  if (!state.dashboard) return;
  const isManager = state.dashboard.viewer.role === "manager";
  const sections = getExpectationsForCurrentRecord();

  sections.forEach((section, sectionIndex) => {
    const card = document.createElement("article");
    card.className = "expectation-card";
    card.dataset.sectionIndex = String(sectionIndex);
    card.innerHTML = `
      <div class="expectation-head expectation-head--split">
        <h4>${escapeHtml(section.category || "Unnamed")}</h4>
        ${
          isManager
            ? `<div class="expectation-actions">
                 <button type="button" class="secondary-btn secondary-btn--ghost expectation-edit" data-section-index="${sectionIndex}" aria-label="Edit this norm">Edit</button>
                 <button type="button" class="secondary-btn secondary-btn--ghost expectation-remove" data-section-index="${sectionIndex}" aria-label="Remove this norm">Remove</button>
               </div>`
            : ""
        }
      </div>
      <ul>${(section.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    `;
    elements.expectationList.appendChild(card);
  });
  if (isManager) {
    const addWrap = document.createElement("div");
    addWrap.className = "expectation-add-wrap";
    addWrap.innerHTML = `<button type="button" class="secondary-btn" data-action="norms-open-editor">Add operating norm</button>`;
    elements.expectationList.appendChild(addWrap);
  }
  elements.expectationList.onclick = (event) => {
    const editBtn = event.target.closest(".expectation-edit");
    if (editBtn) {
      openOperatingNormsEditor(Number(editBtn.dataset.sectionIndex));
      return;
    }
    const removeBtn = event.target.closest(".expectation-remove");
    if (removeBtn) {
      removeOperatingNormSection(Number(removeBtn.dataset.sectionIndex));
      return;
    }
    if (event.target.closest("[data-action='norms-open-editor']")) {
      openOperatingNormsEditor(null);
    }
  };
}

function renderResources() {
  elements.resourceList.innerHTML = "";
  if (!state.dashboard) return;

  const isManager = state.dashboard.viewer.role === "manager";
  const resources = getResourcesForCurrentRecord();

  resources.forEach((resource, index) => {
    const row = document.createElement("div");
    row.className = "resource-pill";
    row.dataset.resourceIndex = String(index);
    const hasUrl = Boolean(resource.url);
    row.innerHTML = `
      <div class="resource-main">
        <strong>${escapeHtml(resource.label)}</strong>
        ${
          resource.category
            ? `<span class="resource-category">${escapeHtml(resource.category)}</span>`
            : ""
        }
      </div>
      <div class="resource-actions">
        ${
          hasUrl
            ? `<a href="${resource.url}" target="_blank" rel="noopener noreferrer" class="secondary-btn secondary-btn--ghost">Open</a>`
            : '<span class="resource-note">No link set</span>'
        }
      </div>
    `;
    elements.resourceList.appendChild(row);
  });
  elements.resourceList.onclick = null;
}

function renderReminders() {
  if (!elements.remindersList) return;
  const email = state.dashboard?.viewer?.email || "";
  const fullList = getReminders(email);
  const activeList = fullList.filter((r) => !r.done);
  const pastList = fullList.filter((r) => r.done);
  const isContractor = state.dashboard?.viewer?.role === "contractor";
  if (isContractor) state.remindersTab = "current";
  const isCurrentTab = state.remindersTab === "current";
  const list = isCurrentTab ? activeList : pastList;

  const tabCurrent = document.querySelector("#reminders-tab-current");
  const tabPast = document.querySelector("#reminders-tab-past");
  const tabsWrap = tabCurrent?.closest(".reminders-tabs");
  if (tabsWrap) tabsWrap.classList.toggle("hidden", isContractor);
  if (tabCurrent) {
    tabCurrent.classList.toggle("reminders-tab--active", isCurrentTab);
    tabCurrent.setAttribute("aria-selected", String(isCurrentTab));
  }
  if (tabPast) {
    tabPast.classList.toggle("reminders-tab--active", !isCurrentTab);
    tabPast.setAttribute("aria-selected", String(!isCurrentTab));
  }

  const actionsWrap = elements.remindersList?.nextElementSibling;
  if (actionsWrap) actionsWrap.classList.toggle("hidden", !isCurrentTab);

  elements.remindersList.innerHTML = "";
  list.forEach((reminder) => {
    const row = document.createElement("div");
    row.className = "reminder-row" + (reminder.done ? " reminder-row--done" : "");
    row.dataset.reminderId = reminder.id;
    const dueText = reminder.dueDate
      ? new Date(reminder.dueDate + "T12:00:00").toLocaleDateString(undefined, { dateStyle: "short" })
      : "No date";
    row.innerHTML = `
      <label class="reminder-check-wrap">
        <input type="checkbox" class="reminder-done" data-reminder-id="${escapeHtml(reminder.id)}" ${reminder.done ? "checked" : ""} aria-label="Mark done" />
      </label>
      <span class="reminder-title">${escapeHtml(reminder.title || "Untitled")}</span>
      <span class="reminder-due">${escapeHtml(dueText)}</span>
      <button type="button" class="secondary-btn secondary-btn--ghost reminder-edit" data-reminder-id="${escapeHtml(reminder.id)}">Edit</button>
      <button type="button" class="secondary-btn secondary-btn--ghost reminder-remove" data-reminder-id="${escapeHtml(reminder.id)}">Remove</button>
    `;
    elements.remindersList.appendChild(row);
  });

  elements.remindersList.onchange = (event) => {
    if (!event.target.classList.contains("reminder-done")) return;
    const id = event.target.dataset.reminderId;
    const next = fullList.map((r) => (r.id === id ? { ...r, done: !!event.target.checked } : r));
    saveReminders(email, next);
    renderReminders();
  };
  elements.remindersList.onclick = (event) => {
    const removeBtn = event.target.closest(".reminder-remove");
    if (removeBtn) {
      const id = removeBtn.dataset.reminderId;
      const next = fullList.filter((r) => r.id !== id);
      saveReminders(email, next);
      renderReminders();
      return;
    }
    const editBtn = event.target.closest(".reminder-edit");
    if (editBtn) {
      openReminderEditor(editBtn.dataset.reminderId);
    }
  };
}

function renderOneOnOneTemplatePanel({
  templates,
  selectedTemplateId = "",
  title = "Saved 1:1 templates",
  emptyMessage = "No saved templates yet. Use the New template button above to create one.",
} = {}) {
  const templateList = Array.isArray(templates) ? templates : [];
  return `
    <div class="one-on-one-template-panel plan-stage-card">
      <div class="plan-stage-head">
        <div class="plan-stage-intro">
          <p class="plan-stage-kicker">Templates</p>
          <div class="plan-stage-title-row">
            <h4>${escapeHtml(title)}</h4>
            <span class="plan-stage-count">${templateList.length}</span>
          </div>
        </div>
      </div>
      <div class="one-on-one-template-grid">
        ${
          templateList.length
            ? templateList.map((template) => `
                <article class="plan-task-card one-on-one-template-card${String(selectedTemplateId) === String(template.id) ? " is-selected" : ""}">
                  <div class="plan-task-head">
                    <div class="plan-task-intro">
                      <p class="plan-task-kicker">Template</p>
                      <div class="plan-task-title-row">
                        <h5>${escapeHtml(template.name || "Untitled template")}</h5>
                      </div>
                    </div>
                    <div class="one-on-one-template-actions">
                      <button type="button" class="secondary-btn secondary-btn--ghost one-on-one-template-use" data-template-id="${escapeHtml(String(template.id))}">
                        Use
                      </button>
                      <button type="button" class="secondary-btn secondary-btn--ghost one-on-one-template-edit" data-template-id="${escapeHtml(String(template.id))}">
                        Edit
                      </button>
                      <button type="button" class="secondary-btn secondary-btn--ghost one-on-one-template-remove" data-template-id="${escapeHtml(String(template.id))}">
                        Remove
                      </button>
                    </div>
                  </div>
                  <p class="one-on-one-template-copy">${escapeHtml(summarizeTemplate(template))}</p>
                </article>
              `).join("")
            : `<div class="plan-task-empty">${escapeHtml(emptyMessage)}</div>`
        }
      </div>
    </div>
  `;
}

function renderOneOnOnes() {
  if (!elements.oneOnOnesContent) return;
  const recordId = state.dashboard?.record?.id;
  const role = state.dashboard?.viewer?.role;
  const contractorName = state.dashboard?.record?.contractorName || "Contractor";
  const oneOnOnes = state.dashboard?.oneOnOnes;
  if (!recordId || !oneOnOnes) {
    elements.oneOnOnesContent.innerHTML = "";
    return;
  }

  const series = oneOnOnes.series;
  const isManager = role === "manager";
  const selectedMeeting = getSelectedOneOnOneMeeting();
  const selectedMeetingId = selectedMeeting?.id ?? null;
  const agendaItems = selectedMeeting
    ? [
        ...(selectedMeeting.managerNotes || []).map((item) => ({ ...item, source: "manager" })),
        ...(selectedMeeting.contractorTalkingPoints || []).map((item) => ({ ...item, source: "contractor" })),
      ]
    : [];
  const fromPrev = selectedMeeting?.fromPreviousMeeting || [];
  const actionItems = selectedMeeting?.actionItems || [];
  const wins = selectedMeeting?.wins || [];
  const isEditable = selectedMeeting?.status === "scheduled";
  const templatesView = state.oneOnOneView === "templates" && isManager;

  if (elements.oneOnOneViewTemplatesBtn) {
    elements.oneOnOneViewTemplatesBtn.setAttribute("aria-pressed", String(templatesView));
  }

  // The 1:1 panel can show templates, setup, list, or detail depending on the current sub-view.
  if (templatesView) {
    elements.oneOnOnesContent.innerHTML = `
      <div class="one-on-ones-detail-head">
        <button type="button" class="secondary-btn secondary-btn--ghost" data-action="one-on-one-back-from-templates">← Back to 1:1s</button>
      </div>
      ${renderOneOnOneTemplatePanel({
        templates: oneOnOnes.templates || [],
        selectedTemplateId: series?.templateId || "",
      })}
    `;
  } else if (!series) {
    elements.oneOnOnesContent.innerHTML = `
      <div class="one-on-one-empty plan-stage-card">
        <div class="plan-stage-head">
          <div class="plan-stage-intro">
            <p class="plan-stage-kicker">Recurring 1:1</p>
            <div class="plan-stage-title-row">
              <h4>No 1:1 scheduled yet</h4>
            </div>
            <p class="section-copy">
              ${isManager ? "Set the first meeting date, cadence, and template for this contractor." : "Your manager has not scheduled the first 1:1 yet."}
            </p>
          </div>
        </div>
        ${isManager ? `<button type="button" class="secondary-btn" data-action="open-setup">Set up 1:1</button>` : ""}
      </div>
    `;
  } else {
    const meetings = [...(oneOnOnes.meetings || [])].sort((a, b) =>
      (a.scheduledFor || "").localeCompare(b.scheduledFor || "")
    );
    const overviewMeetings = getOneOnOneOverviewMeetings(meetings, oneOnOnes.currentMeetingId);
    const activeOverviewMeetingId = overviewMeetings.some(({ meeting }) => meeting.id === selectedMeetingId)
      ? selectedMeetingId
      : (overviewMeetings.find(({ label }) => label === "Upcoming 1:1")?.meeting.id
        ?? overviewMeetings[0]?.meeting.id
        ?? null);
    const meetingCards = overviewMeetings.map(({ label, meeting }) => {
      const statusLabel = getOneOnOneMeetingStatusLabel(meeting);
      const meetingAriaLabel = getOneOnOneMeetingAriaLabel(label, meeting);
      return `
        <div class="one-on-one-calendar-card${activeOverviewMeetingId === meeting.id ? " is-active" : ""}${meeting.status === "completed" ? " is-complete" : ""}${meeting.status === "canceled" ? " is-canceled" : ""}" role="listitem">
          <button
            type="button"
            class="one-on-one-calendar-card-select"
            data-meeting-select="${escapeHtml(String(meeting.id))}"
            aria-label="${escapeHtml(meetingAriaLabel)}"
          >
            <span class="one-on-one-calendar-kicker">${escapeHtml(label)}</span>
            <strong>${escapeHtml(formatShortDate(meeting.scheduledFor))}</strong>
            <span class="one-on-one-calendar-status">${escapeHtml(statusLabel)}</span>
          </button>
          ${
            isManager
              ? `<button
                  type="button"
                  class="secondary-btn secondary-btn--ghost one-on-one-calendar-card-edit"
                  data-meeting-select="${escapeHtml(String(meeting.id))}"
                  aria-label="${escapeHtml(`Edit ${meetingAriaLabel}`)}"
                >Edit</button>`
              : ""
          }
        </div>
      `;
    }).join("");

    elements.oneOnOnesContent.innerHTML =
      state.oneOnOneView === "detail" && selectedMeeting
        ? (() => {
            const currentIndex = meetings.findIndex((m) => m.id === selectedMeeting.id);
            const prevMeeting = currentIndex > 0 ? meetings[currentIndex - 1] : null;
            const nextMeeting = currentIndex >= 0 && currentIndex < meetings.length - 1 ? meetings[currentIndex + 1] : null;
            const detailMarkup = `
            <div class="one-on-ones-detail-view">
              <div class="one-on-ones-detail-head">
                <button type="button" class="secondary-btn secondary-btn--ghost" data-action="one-on-one-back-to-list">← Back to 1:1s</button>
                <div class="one-on-ones-detail-nav">
                  ${
                    isManager && selectedMeeting.status === "scheduled"
                      ? '<button type="button" class="one-on-ones-cancel-btn" data-action="cancel-meeting">Cancel 1:1</button>'
                      : ""
                  }
                  <div class="one-on-ones-detail-nav-row">
                    <button type="button" class="secondary-btn secondary-btn--ghost one-on-ones-nav-btn" data-action="one-on-one-prev" data-meeting-id="${prevMeeting ? escapeHtml(String(prevMeeting.id)) : ""}" ${prevMeeting ? "" : "disabled"}>← Previous 1:1</button>
                    <button type="button" class="secondary-btn secondary-btn--ghost one-on-ones-nav-btn" data-action="one-on-one-next" data-meeting-id="${nextMeeting ? escapeHtml(String(nextMeeting.id)) : ""}" ${nextMeeting ? "" : "disabled"}>Next 1:1 →</button>
                  </div>
                </div>
              </div>
                <div class="one-on-ones-grid">
                  <div class="one-on-ones-left">
                    <div class="one-on-ones-block">
                      <div class="one-on-ones-block-head">
                        <div>
                          <h4>Agenda</h4>
                          <p class="one-on-ones-block-copy">${escapeHtml(formatLongDate(selectedMeeting.scheduledFor))}${selectedMeeting.status === "completed" ? " | completed" : selectedMeeting.status === "canceled" ? " | canceled" : selectedMeeting.isPast ? " | past" : ""}</p>
                          ${isManager && selectedMeeting.status === "scheduled" ? `
                            <div class="one-on-ones-date-edit">
                              <label class="one-on-ones-date-edit-field">
                                <span class="sr-only">Meeting date</span>
                                <input type="date" class="one-on-ones-date-input" value="${escapeHtml((selectedMeeting.scheduledFor || "").slice(0, 10))}" />
                              </label>
                            </div>
                          ` : ""}
                        </div>
                      </div>
                      <div class="one-on-ones-list one-on-ones-agenda-list">
                        ${
                          agendaItems.length
                            ? agendaItems.map((item) => {
                                const sourceLabel = item.source === "manager" ? "Added by manager" : "Added by contractor";
                                const canRemove = isEditable && ((item.source === "manager" && isManager) || (item.source === "contractor" && !isManager));
                                return `
                                  <div class="one-on-ones-row one-on-ones-agenda-row${item.done ? " is-done" : ""}">
                                    <label class="one-on-ones-check-wrap">
                                      <input type="checkbox" class="one-on-ones-done" data-id="${escapeHtml(item.id)}" data-source="${escapeHtml(item.source)}" ${item.done ? "checked" : ""} ${isEditable ? "" : "disabled"} aria-label="Mark as discussed" />
                                    </label>
                                    <span class="one-on-ones-text">${escapeHtml(item.text || "")}</span>
                                    <span class="one-on-ones-source">${escapeHtml(sourceLabel)}</span>
                                    ${canRemove ? `<button type="button" class="secondary-btn secondary-btn--ghost one-on-ones-remove" data-id="${escapeHtml(item.id)}" data-action="${item.source === "manager" ? "remove-manager-note" : "remove-contractor-point"}">Remove</button>` : ""}
                                  </div>
                                `;
                              }).join("")
                            : '<div class="plan-task-empty">No agenda items for this meeting yet.</div>'
                        }
                      </div>
                      ${
                        isEditable
                          ? `<div class="one-on-ones-inline-actions">
                              ${isManager ? '<button type="button" class="secondary-btn" data-action="add-manager-note">+ Add note</button>' : '<button type="button" class="secondary-btn" data-action="add-contractor-point">+ Add talking point</button>'}
                            </div>`
                          : ""
                      }
                    </div>

                    <div class="one-on-ones-block">
                      <div class="one-on-ones-block-head">
                        <div>
                          <h4>Action Items</h4>
                          <p class="one-on-ones-block-copy">Shared follow-ups created during the 1:1.</p>
                        </div>
                      </div>
                      <div class="one-on-ones-list">
                        ${
                          actionItems.length
                            ? actionItems.map((item) => `
                                <div class="one-on-ones-row one-on-ones-action-row${item.done ? " is-done" : ""}">
                                  <label class="one-on-ones-check-wrap">
                                    <input type="checkbox" class="one-on-ones-action-done" data-id="${escapeHtml(item.id)}" ${item.done ? "checked" : ""} ${isEditable ? "" : "disabled"} aria-label="Mark action item done" />
                                  </label>
                                  <span class="one-on-ones-text">${escapeHtml(item.text || "")}</span>
                                  ${isEditable ? `<button type="button" class="secondary-btn secondary-btn--ghost one-on-ones-remove" data-id="${escapeHtml(item.id)}" data-action="remove-action-item">Remove</button>` : ""}
                                </div>
                              `).join("")
                            : '<div class="plan-task-empty">No action items yet.</div>'
                        }
                      </div>
                      ${
                        isEditable
                          ? '<div class="one-on-ones-inline-actions"><button type="button" class="secondary-btn" data-action="add-action-item">+ Add Action Item</button></div>'
                          : ""
                      }
                    </div>

                    <div class="one-on-ones-block">
                      <div class="one-on-ones-block-head">
                        <div>
                          <h4>From Previous Meeting</h4>
                          <p class="one-on-ones-block-copy">Open items carried forward when the last meeting was completed.</p>
                        </div>
                      </div>
                      <div class="one-on-ones-list">
                        ${
                          fromPrev.length
                            ? fromPrev.map((item) => `
                                <div class="one-on-ones-row">
                                  <span class="one-on-ones-text">${escapeHtml(item.text || "")}</span>
                                  ${
                                    isEditable
                                      ? `<button type="button" class="secondary-btn secondary-btn--ghost one-on-ones-add-to-agenda" data-id="${escapeHtml(
                                          item.id,
                                        )}">Add to Agenda</button>`
                                      : ""
                                  }
                                </div>
                              `).join("")
                            : '<div class="plan-task-empty">Nothing carried forward into this meeting.</div>'
                        }
                      </div>
                    </div>
                  </div>
                  <div class="one-on-ones-right">
                    <div class="one-on-ones-about-block">
                      <h4>About ${escapeHtml(contractorName)}</h4>
                      <div class="one-on-ones-metrics one-on-ones-block">
                        <div class="one-on-ones-block-head">
                          <div>
                            <h5>Metrics &amp; links</h5>
                            <p class="one-on-ones-block-copy">Reference docs and scorecards for this meeting.</p>
                          </div>
                        </div>
                        <div class="one-on-ones-list">
                          ${
                            (selectedMeeting.managerMetrics || []).length
                              ? selectedMeeting.managerMetrics.map((item) => `
                                  <div class="one-on-ones-row">
                                    <span class="one-on-ones-text">${escapeHtml(item.text || "")}</span>
                                    ${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="one-on-ones-link">Open link</a>` : ""}
                                    ${isEditable && isManager ? `<button type="button" class="secondary-btn secondary-btn--ghost one-on-ones-remove" data-id="${escapeHtml(item.id)}" data-action="remove-manager-metric">Remove</button>` : ""}
                                  </div>
                                `).join("")
                              : '<div class="plan-task-empty">No metrics attached to this meeting.</div>'
                          }
                        </div>
                        ${isEditable && isManager ? '<div class="one-on-ones-inline-actions"><button type="button" class="secondary-btn secondary-btn--ghost" data-action="add-manager-metric">Add metric</button></div>' : ""}
                      </div>
                      <div class="one-on-ones-block">
                        <div class="one-on-ones-block-head">
                          <div>
                            <h5>Wins</h5>
                            <p class="one-on-ones-block-copy">Capture wins one by one for this 1:1.</p>
                          </div>
                        </div>
                        <div class="one-on-ones-list">
                          ${
                            wins.length
                              ? wins.map((item) => `
                                  <div class="one-on-ones-row one-on-ones-win-row">
                                    <span class="one-on-ones-text">${escapeHtml(item.text || "")}</span>
                                    ${
                                      isEditable && isManager
                                        ? `<div class="one-on-ones-row-actions">
                                             <button type="button" class="secondary-btn secondary-btn--ghost" data-action="edit-win" data-id="${escapeHtml(item.id)}">Edit</button>
                                             <button type="button" class="secondary-btn secondary-btn--ghost one-on-ones-remove" data-id="${escapeHtml(item.id)}" data-action="remove-win">Remove</button>
                                           </div>`
                                        : ""
                                    }
                                  </div>
                                `).join("")
                              : '<div class="plan-task-empty">No wins captured for this meeting yet.</div>'
                          }
                        </div>
                        ${isEditable && isManager ? '<div class="one-on-ones-inline-actions"><button type="button" class="secondary-btn" data-action="add-win">+ Add win</button></div>' : ""}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            `;
            return detailMarkup;
          })()
        : `
      <article class="plan-stage-card one-on-one-series-card">
        <div class="plan-stage-head">
          <div class="plan-stage-intro">
            <p class="plan-stage-kicker">Recurring 1:1</p>
            <div class="plan-stage-title-row one-on-one-series-header">
              <h4>${escapeHtml(series.title || `${contractorName} 1:1`)}</h4>
              <span
                class="one-on-one-cadence-pill"
                role="note"
                aria-label="${escapeHtml(`Every ${series.cadenceDays} days`)}"
              >${escapeHtml(`Every ${series.cadenceDays} days`)}</span>
            </div>
          </div>
        </div>
        <div class="one-on-one-calendar" role="list" aria-label="Previous, upcoming, and next one-on-ones">${meetingCards}</div>
      </article>
    `;
  }

  elements.oneOnOnesContent.onchange = async (event) => {
    const cb = event.target;
    if (!(cb instanceof HTMLInputElement) || !selectedMeetingId || !isEditable) return;
    if (cb.classList.contains("one-on-ones-date-input")) {
      const value = cb.value?.trim();
      if (value) {
        await mutateOneOnOneMeeting(selectedMeetingId, {
          action: "update-meeting-date",
          scheduledFor: value,
        });
      }
    } else if (cb.classList.contains("one-on-ones-done")) {
      await mutateOneOnOneMeeting(selectedMeetingId, {
        action: "toggle-agenda-item",
        source: cb.dataset.source,
        itemId: cb.dataset.id,
        done: cb.checked,
      });
    } else if (cb.classList.contains("one-on-ones-action-done")) {
      await mutateOneOnOneMeeting(selectedMeetingId, {
        action: "toggle-action-item",
        itemId: cb.dataset.id,
        done: cb.checked,
      });
    }
  };

  elements.oneOnOnesContent.onclick = async (event) => {
    const target = event.target;
    const backFromTemplatesBtn = target.closest("[data-action='one-on-one-back-from-templates']");
    if (backFromTemplatesBtn) {
      state.oneOnOneView = "list";
      renderOneOnOnes();
      return;
    }

    const meetingSelect = target.closest("[data-meeting-select]");
    if (meetingSelect) {
      state.selectedOneOnOneMeetingId = Number(meetingSelect.dataset.meetingSelect);
      state.oneOnOneView = "detail";
      renderOneOnOnes();
      return;
    }

    const backToListBtn = target.closest("[data-action='one-on-one-back-to-list']");
    if (backToListBtn) {
      state.oneOnOneView = "list";
      renderOneOnOnes();
      return;
    }

    const prevBtn = target.closest("[data-action='one-on-one-prev']");
    if (prevBtn && !prevBtn.disabled && prevBtn.dataset.meetingId) {
      state.selectedOneOnOneMeetingId = Number(prevBtn.dataset.meetingId);
      renderOneOnOnes();
      return;
    }

    const nextBtn = target.closest("[data-action='one-on-one-next']");
    if (nextBtn && !nextBtn.disabled && nextBtn.dataset.meetingId) {
      state.selectedOneOnOneMeetingId = Number(nextBtn.dataset.meetingId);
      renderOneOnOnes();
      return;
    }

    const templateUse = target.closest(".one-on-one-template-use");
    if (templateUse) {
      openOneOnOneSetupOverlay(templateUse.dataset.templateId || "");
      return;
    }

    const templateEdit = target.closest(".one-on-one-template-edit");
    if (templateEdit) {
      openOneOnOneTemplateOverlay(templateEdit.dataset.templateId || "");
      return;
    }

    const templateRemove = target.closest(".one-on-one-template-remove");
    if (templateRemove) {
      const templateId = templateRemove.dataset.templateId || "";
      if (templateId && window.confirm("Remove this 1:1 template?")) {
        await deleteOneOnOneTemplate(templateId);
      }
      return;
    }

    const openSetupBtn = target.closest("[data-action='open-setup']");
    if (openSetupBtn) {
      openOneOnOneSetupOverlay();
      return;
    }

    if (!selectedMeetingId) return;

    const addToAgendaBtn = target.closest(".one-on-ones-add-to-agenda");
    if (addToAgendaBtn && isEditable) {
      await mutateOneOnOneMeeting(selectedMeetingId, {
        action: "promote-previous-item",
        itemId: addToAgendaBtn.dataset.id,
        targetSource: isManager ? "manager" : "contractor",
      });
      return;
    }

    const removeBtn = target.closest(".one-on-ones-remove");
    if (removeBtn && isEditable) {
      await mutateOneOnOneMeeting(selectedMeetingId, {
        action: removeBtn.dataset.action,
        itemId: removeBtn.dataset.id,
      });
      return;
    }

    const editWinBtn = target.closest("[data-action='edit-win']");
    if (editWinBtn && isEditable && isManager) {
      const win = (selectedMeeting?.wins || []).find((item) => String(item.id) === String(editWinBtn.dataset.id));
      if (win) {
        openOneOnOneEditor("edit-win", { itemId: win.id, text: win.text || "" });
      }
      return;
    }

    const actionBtn = target.closest("button[data-action]");
    if (!actionBtn) return;
    const action = actionBtn.dataset.action;
    if (action === "add-manager-note" || action === "add-manager-metric" || action === "add-contractor-point" || action === "add-action-item" || action === "add-win") {
      openOneOnOneEditor(action);
      return;
    }
    if (action === "cancel-meeting" && isManager && selectedMeeting.status === "scheduled") {
      if (window.confirm("Cancel this 1:1?")) {
        await mutateOneOnOneMeeting(selectedMeetingId, { action: "cancel-meeting" });
      }
      return;
    }
  };
}

function getSelectedOneOnOneMeeting() {
  const meetings = state.dashboard?.oneOnOnes?.meetings || [];
  if (!meetings.length) {
    state.selectedOneOnOneMeetingId = null;
    return null;
  }

  const selected = meetings.find((meeting) => String(meeting.id) === String(state.selectedOneOnOneMeetingId));
  if (selected) return selected;

  const fallback = meetings.find((meeting) => meeting.isCurrent) || meetings[0];
  state.selectedOneOnOneMeetingId = fallback?.id ?? null;
  return fallback || null;
}

function getOneOnOneOverviewMeetings(meetings, currentMeetingId) {
  const ordered = [...(Array.isArray(meetings) ? meetings : [])].sort((a, b) =>
    (a.scheduledFor || "").localeCompare(b.scheduledFor || "")
  );
  if (!ordered.length) return [];

  const currentIndex = ordered.findIndex((item) => String(item.id) === String(currentMeetingId));
  const upcomingIndex = currentIndex !== -1
    ? currentIndex
    : ordered.findIndex((item) => item.status === "scheduled");
  const normalizedUpcomingIndex = upcomingIndex !== -1 ? upcomingIndex : 0;
  const previousMeeting = normalizedUpcomingIndex > 0 ? ordered[normalizedUpcomingIndex - 1] : null;
  const upcomingMeeting = ordered[normalizedUpcomingIndex] || null;
  const nextMeeting = normalizedUpcomingIndex < ordered.length - 1
    ? ordered[normalizedUpcomingIndex + 1]
    : null;

  return [
    previousMeeting ? { label: "Previous 1:1", meeting: previousMeeting } : null,
    upcomingMeeting ? { label: "Upcoming 1:1", meeting: upcomingMeeting } : null,
    nextMeeting ? { label: "Next 1:1", meeting: nextMeeting } : null,
  ].filter(Boolean);
}

function getOneOnOneMeetingAriaLabel(cardLabel, meeting) {
  return `${cardLabel}. ${formatLongDate(meeting?.scheduledFor)}. ${getOneOnOneMeetingStatusLabel(meeting)}.`;
}

function getOneOnOneMeetingStatusLabel(meeting) {
  if (meeting?.status === "completed") return "Completed";
  if (meeting?.status === "canceled") return "Canceled";
  if (meeting?.isPast) return "Past";
  return "Scheduled";
}

function summarizeTemplate(template) {
  const managerCount = Array.isArray(template?.managerNotes) ? template.managerNotes.length : 0;
  const contractorCount = Array.isArray(template?.contractorTalkingPoints) ? template.contractorTalkingPoints.length : 0;
  const metricCount = Array.isArray(template?.managerMetrics) ? template.managerMetrics.length : 0;
  const actionItemCount = Array.isArray(template?.actionItems) ? template.actionItems.length : 0;
  const parts = [];
  if (managerCount) parts.push(`${managerCount} notes`);
  if (contractorCount) parts.push(`${contractorCount} contractor prompts`);
  if (actionItemCount) parts.push(`${actionItemCount} action items`);
  if (metricCount) parts.push(`${metricCount} metrics`);
  return parts.length ? parts.join(" | ") : "Blank template";
}

function formatShortDate(value) {
  if (!value) return "No date";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatLongDate(value) {
  if (!value) return "No date";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function openOneOnOneSetupOverlay(templateId = "") {
  if (!elements.oneOnOneSetupOverlay) return;
  const series = state.dashboard?.oneOnOnes?.series;
  const templates = state.dashboard?.oneOnOnes?.templates || [];
  const selectedTemplate = templates.find((template) => String(template.id) === String(templateId))
    || templates.find((template) => String(template.id) === String(series?.templateId || ""))
    || null;

  state.lastFocusedElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  state.oneOnOneSetupTemplateId = selectedTemplate ? String(selectedTemplate.id) : "";
  if (elements.oneOnOneSetupNameInput) {
    elements.oneOnOneSetupNameInput.value = series?.title
      || `${state.dashboard?.record?.contractorName || "Contractor"} 1:1`;
  }
  if (elements.oneOnOneSetupDateInput) {
    elements.oneOnOneSetupDateInput.value = series?.nextMeetingDate || new Date().toISOString().slice(0, 10);
  }
  if (elements.oneOnOneSetupCadenceInput) {
    elements.oneOnOneSetupCadenceInput.value = String(selectedTemplate?.cadenceDays || series?.cadenceDays || 7);
  }
  if (elements.oneOnOneSetupResetMode) {
    elements.oneOnOneSetupResetMode.value = selectedTemplate?.agendaResetMode || series?.agendaResetMode || "template";
  }
  renderOneOnOneSetupTemplateOptions();
  showMessage(elements.oneOnOneSetupMessage, "", "");
  elements.oneOnOneSetupOverlay.classList.remove("hidden");
  elements.oneOnOneSetupOverlay.setAttribute("aria-hidden", "false");
  syncBodyScrollLock();
  elements.oneOnOneSetupNameInput?.focus();
}

function closeOneOnOneSetupOverlay() {
  if (!elements.oneOnOneSetupOverlay) return;
  elements.oneOnOneSetupOverlay.classList.add("hidden");
  elements.oneOnOneSetupOverlay.setAttribute("aria-hidden", "true");
  showMessage(elements.oneOnOneSetupMessage, "", "");
  syncBodyScrollLock();
}

function renderOneOnOneSetupTemplateOptions() {
  if (!elements.oneOnOneSetupTemplateOptions) return;
  const templates = state.dashboard?.oneOnOnes?.templates || [];
  const selected = String(state.oneOnOneSetupTemplateId || "");
  const options = [
    { id: "", name: "No template", copy: "Use a blank agenda or carry-over items only." },
    ...templates.map((template) => ({
      id: String(template.id),
      name: template.name || "Untitled template",
      copy: summarizeTemplate(template),
    })),
  ];

  elements.oneOnOneSetupTemplateOptions.innerHTML = options
    .map((option) => `
      <label class="one-on-one-template-option plan-task-card${selected === option.id ? " is-selected" : ""}">
        <input type="radio" name="one-on-one-template" value="${escapeHtml(option.id)}" ${selected === option.id ? "checked" : ""} />
        <span class="one-on-one-template-option-copy">
          <strong>${escapeHtml(option.name)}</strong>
          <small>${escapeHtml(option.copy)}</small>
        </span>
      </label>
    `)
    .join("");
}

async function saveOneOnOneSetupOverlay() {
  if (!state.dashboard) return;

  try {
    const nextDashboard = await api(`/api/records/${state.dashboard.record.id}/one-on-ones/series`, {
      method: "POST",
      body: {
        viewerEmail: state.dashboard.viewer.email,
        viewerRole: state.dashboard.viewer.role,
        title: elements.oneOnOneSetupNameInput?.value?.trim() || "",
        firstMeetingDate: elements.oneOnOneSetupDateInput?.value || "",
        cadenceDays: Number(elements.oneOnOneSetupCadenceInput?.value || 7),
        agendaResetMode: elements.oneOnOneSetupResetMode?.value || "template",
        templateId: state.oneOnOneSetupTemplateId || null,
      },
    });
    applyDashboard(nextDashboard, { preservePhase: true });
    closeOneOnOneSetupOverlay();
    showAppMessage("1:1 setup saved.", "success");
  } catch (error) {
    showMessage(elements.oneOnOneSetupMessage, error.message, "error");
  }
}

function openOneOnOneTemplateOverlay(templateId = "") {
  if (!elements.oneOnOneTemplateOverlay) return;
  const series = state.dashboard?.oneOnOnes?.series;
  const templates = state.dashboard?.oneOnOnes?.templates || [];
  const template = templates.find((item) => String(item.id) === String(templateId)) || null;

  state.lastFocusedElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  // Reuse one overlay for both create and edit so template content stays in a single flow.
  state.oneOnOneTemplateEditingId = template ? String(template.id) : null;
  if (elements.oneOnOneTemplateNameInput) {
    elements.oneOnOneTemplateNameInput.value = template?.name || "";
  }
  if (elements.oneOnOneTemplateCadenceInput) {
    elements.oneOnOneTemplateCadenceInput.value = String(template?.cadenceDays || series?.cadenceDays || 7);
  }
  if (elements.oneOnOneTemplateResetMode) {
    elements.oneOnOneTemplateResetMode.value = template?.agendaResetMode || series?.agendaResetMode || "template";
  }
  if (elements.oneOnOneTemplateManagerNotes) {
    elements.oneOnOneTemplateManagerNotes.value = oneOnOneItemsToText(template?.managerNotes || []);
  }
  if (elements.oneOnOneTemplateContractorPoints) {
    elements.oneOnOneTemplateContractorPoints.value = oneOnOneItemsToText(template?.contractorTalkingPoints || []);
  }
  if (elements.oneOnOneTemplateMetrics) {
    elements.oneOnOneTemplateMetrics.value = oneOnOneMetricsToText(template?.managerMetrics || []);
  }
  if (elements.oneOnOneTemplateActionItems) {
    elements.oneOnOneTemplateActionItems.value = oneOnOneItemsToText(template?.actionItems || []);
  }
  if (elements.oneOnOneTemplateTitle) {
    elements.oneOnOneTemplateTitle.textContent = template ? "Edit agenda template" : "Create agenda template";
  }
  if (elements.oneOnOneTemplateSave) {
    elements.oneOnOneTemplateSave.textContent = template ? "Save changes" : "Create template";
  }
  showMessage(elements.oneOnOneTemplateMessage, "", "");
  elements.oneOnOneTemplateOverlay.classList.remove("hidden");
  elements.oneOnOneTemplateOverlay.setAttribute("aria-hidden", "false");
  syncBodyScrollLock();
  elements.oneOnOneTemplateNameInput?.focus();
}

function closeOneOnOneTemplateOverlay() {
  if (!elements.oneOnOneTemplateOverlay) return;
  elements.oneOnOneTemplateOverlay.classList.add("hidden");
  elements.oneOnOneTemplateOverlay.setAttribute("aria-hidden", "true");
  state.oneOnOneTemplateEditingId = null;
  showMessage(elements.oneOnOneTemplateMessage, "", "");
  syncBodyScrollLock();
}

async function saveOneOnOneTemplateOverlay() {
  if (!state.dashboard) return;

  try {
    const templateId = state.oneOnOneTemplateEditingId;
    const nextDashboard = await api(
      templateId
        ? `/api/records/${state.dashboard.record.id}/one-on-ones/templates/${templateId}`
        : `/api/records/${state.dashboard.record.id}/one-on-ones/templates`,
      {
        method: templateId ? "PATCH" : "POST",
        body: {
          viewerEmail: state.dashboard.viewer.email,
          viewerRole: state.dashboard.viewer.role,
          name: elements.oneOnOneTemplateNameInput?.value?.trim() || "",
          cadenceDays: Number(elements.oneOnOneTemplateCadenceInput?.value || 7),
          agendaResetMode: elements.oneOnOneTemplateResetMode?.value || "template",
          managerNotes: parseOneOnOneTextItems(elements.oneOnOneTemplateManagerNotes?.value || ""),
          contractorTalkingPoints: parseOneOnOneTextItems(elements.oneOnOneTemplateContractorPoints?.value || ""),
          managerMetrics: parseOneOnOneMetricItems(elements.oneOnOneTemplateMetrics?.value || ""),
          actionItems: parseOneOnOneTextItems(elements.oneOnOneTemplateActionItems?.value || ""),
        },
      }
    );
    applyDashboard(nextDashboard, { preservePhase: true });
    closeOneOnOneTemplateOverlay();
    showAppMessage(templateId ? "1:1 template updated." : "1:1 template created.", "success");
  } catch (error) {
    showMessage(elements.oneOnOneTemplateMessage, error.message, "error");
  }
}

async function deleteOneOnOneTemplate(templateId) {
  if (!state.dashboard || !templateId) return;
  const nextDashboard = await api(`/api/records/${state.dashboard.record.id}/one-on-ones/templates/${templateId}`, {
    method: "DELETE",
    body: {
      viewerEmail: state.dashboard.viewer.email,
      viewerRole: state.dashboard.viewer.role,
    },
  });
  applyDashboard(nextDashboard, { preservePhase: true });
  showAppMessage("1:1 template removed.", "success");
}

function parseOneOnOneTextItems(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ text: line }));
}

function parseOneOnOneMetricItems(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [textPart, ...urlParts] = line.split("|");
      return {
        text: textPart.trim(),
        url: urlParts.join("|").trim(),
      };
    })
    .filter((item) => item.text);
}

function oneOnOneItemsToText(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => String(item.text || "").trim())
    .filter(Boolean)
    .join("\n");
}

function oneOnOneMetricsToText(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => {
      const text = String(item.text || "").trim();
      const url = String(item.url || "").trim();
      return url ? `${text} | ${url}` : text;
    })
    .filter(Boolean)
    .join("\n");
}

async function mutateOneOnOneMeeting(meetingId, payload) {
  if (!state.dashboard) return;
  try {
    const nextDashboard = await api(
      `/api/records/${state.dashboard.record.id}/one-on-ones/meetings/${meetingId}`,
      {
        method: "PATCH",
        body: {
          viewerEmail: state.dashboard.viewer.email,
          viewerRole: state.dashboard.viewer.role,
          ...payload,
        },
      }
    );
    applyDashboard(nextDashboard, { preservePhase: true });
  } catch (error) {
    showAppMessage(error.message, "error");
  }
}

function getMetricsForCurrentRecord() {
  const base = Array.isArray(state.dashboard.metrics) ? state.dashboard.metrics : [];
  const recordId = String(state.dashboard.record.id);
  const overrides = getMetricsOverrides();
  const recordOverride = overrides[recordId];
  let list = null;

  if (Array.isArray(recordOverride)) {
    list = recordOverride;
  } else if (recordOverride && Array.isArray(recordOverride.buckets)) {
    list = recordOverride.buckets;
  }

  if (list && list.length) return list;
  return base.map((bucket) => ({
    month: bucket.month,
    metrics: Array.isArray(bucket.metrics)
      ? bucket.metrics.map((m) => ({ label: m.label, target: m.target }))
      : [],
  }));
}

function setMetricsForCurrentRecord(buckets) {
  const recordId = String(state.dashboard.record.id);
  const overrides = getMetricsOverrides();
  const recordOverride = overrides[recordId] && !Array.isArray(overrides[recordId])
    ? overrides[recordId]
    : {};
  overrides[recordId] = { ...recordOverride, buckets };
  saveMetricsOverrides(overrides);
}

function parseMetricLines(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return [];
  return lines.map((line) => {
    const [labelPart, targetPart] = line.split(":");
    return {
      label: labelPart.trim(),
      target: targetPart ? targetPart.trim() : "",
    };
  });
}

function getMetricsHeaderForCurrentRecord() {
  const recordId = String(state.dashboard.record.id);
  const overrides = getMetricsOverrides();
  const recordOverride = overrides[recordId];
  if (recordOverride && !Array.isArray(recordOverride) && recordOverride.headerTitle) {
    return recordOverride.headerTitle;
  }
  return "Months 1-3 performance expectations";
}

function setMetricsHeaderForCurrentRecord(title) {
  const recordId = String(state.dashboard.record.id);
  const overrides = getMetricsOverrides();
  const recordOverride = overrides[recordId] && !Array.isArray(overrides[recordId])
    ? overrides[recordId]
    : {};
  overrides[recordId] = { ...recordOverride, headerTitle: title };
  saveMetricsOverrides(overrides);
}

function getMetricsOverrides() {
  let overrides;
  try {
    overrides = JSON.parse(window.localStorage.getItem(METRICS_STORAGE_KEY) || "{}");
  } catch {
    overrides = {};
  }
  return overrides && typeof overrides === "object" ? overrides : {};
}

function saveMetricsOverrides(overrides) {
  try {
    window.localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // ignore storage failures
  }
}

function cloneExpectationSections(sections) {
  return (Array.isArray(sections) ? sections : []).map((section) => ({
    category: String(section?.category || "").trim(),
    items: Array.isArray(section?.items)
      ? section.items.map((item) => String(item || "").trim()).filter(Boolean)
      : [],
  }));
}

function getExpectationsForCurrentRecord() {
  if (!state.dashboard?.record?.id) return [];
  const recordId = String(state.dashboard.record.id);
  let overrides;
  try {
    overrides = JSON.parse(window.localStorage.getItem(EXPECTATIONS_STORAGE_KEY) || "{}");
  } catch {
    overrides = {};
  }
  const override = Array.isArray(overrides?.[recordId]) ? overrides[recordId] : null;
  if (override) return cloneExpectationSections(override);
  // Keep operating norms scoped to the active record instead of sharing them globally.
  return cloneExpectationSections(state.dashboard.qualitativeExpectations);
}

function setExpectationsForCurrentRecord(sections) {
  if (!state.dashboard?.record?.id) return;
  const recordId = String(state.dashboard.record.id);
  let overrides;
  try {
    overrides = JSON.parse(window.localStorage.getItem(EXPECTATIONS_STORAGE_KEY) || "{}");
  } catch {
    overrides = {};
  }
  overrides[recordId] = cloneExpectationSections(sections);
  try {
    window.localStorage.setItem(EXPECTATIONS_STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // ignore storage failures
  }
}

function removeOperatingNormSection(sectionIndex) {
  if (!Number.isInteger(sectionIndex)) return;
  const sections = getExpectationsForCurrentRecord();
  sections.splice(sectionIndex, 1);
  setExpectationsForCurrentRecord(sections);
  renderExpectations();
}

function getReminders(email) {
  try {
    const raw = window.localStorage.getItem(REMINDERS_STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    let list = data[email];
    if (!Array.isArray(list)) list = [];
    if (list.length === 0 && email) {
      list = SAMPLE_REMINDERS.map((r) => ({ ...r }));
      saveReminders(email, list);
    }
    return list;
  } catch {
    return [];
  }
}

function saveReminders(email, list) {
  try {
    const raw = window.localStorage.getItem(REMINDERS_STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    // Reminders are keyed by viewer email so each login keeps its own list.
    data[email] = list;
    window.localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function getPlanTemplates(managerEmail) {
  // Saved plan templates are isolated per manager so template lists do not leak across accounts.
  try {
    const raw = window.localStorage.getItem(PLAN_TEMPLATES_STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    const list = data[managerEmail];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function savePlanTemplate(managerEmail, templateName, planPayload) {
  // Persist the full plan draft so a template can be reused without reconstructing it later.
  const list = getPlanTemplates(managerEmail);
  const id = `tpl_${Math.random().toString(36).slice(2, 12)}`;
  list.push({
    id,
    name: String(templateName || "Untitled template").trim() || "Untitled template",
    plan: planPayload,
  });
  try {
    const raw = window.localStorage.getItem(PLAN_TEMPLATES_STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    data[managerEmail] = list;
    window.localStorage.setItem(PLAN_TEMPLATES_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
  return id;
}

/**
 * Collect all distinct task.group values from current dashboard plan and saved templates.
 * Returns [{ name, count, taskRefs: [{ phaseId, taskId, title, planName }] }].
 * @param {string} managerEmail
 * @returns {{ name: string, count: number, taskRefs: Array<{ phaseId: string, taskId: string, title: string, planName: string }> }[]}
 */
function getAllTagsWithUsage(managerEmail) {
  const byName = new Map();

  function addTaskRef(tagName, ref) {
    if (!tagName || String(tagName).trim() === "") return;
    const key = String(tagName).trim();
    if (!byName.has(key)) byName.set(key, { name: key, count: 0, taskRefs: [] });
    const entry = byName.get(key);
    entry.count += 1;
    entry.taskRefs.push(ref);
  }

  function labelsForTask(task) {
    const raw = task.group ?? task.group_label ?? task.labels ?? [];
    if (Array.isArray(raw)) return raw.map((x) => String(x).trim()).filter(Boolean);
    const s = String(raw).trim();
    return s ? [s] : [];
  }

  const currentPlan = state.dashboard?.planTemplate;
  if (currentPlan?.phases) {
    const planName = currentPlan.name || "Current plan";
    currentPlan.phases.forEach((phase) => {
      (phase.tasks || []).forEach((task) => {
        labelsForTask(task).forEach((label) => {
          addTaskRef(label, {
            phaseId: phase.id || "",
            taskId: task.id || "",
            title: task.title || "",
            planName,
          });
        });
      });
    });
  }

  const templates = getPlanTemplates(managerEmail);
  templates.forEach((tpl) => {
    const planName = tpl.name || "Template";
    const phases = tpl.plan?.phases || [];
    phases.forEach((phase) => {
      (phase.tasks || []).forEach((task) => {
        labelsForTask(task).forEach((label) => {
          addTaskRef(label, {
            phaseId: phase.id || "",
            taskId: task.id || "",
            title: task.title || "",
            planName,
          });
        });
      });
    });
  });

  const registry = getTagRegistry(managerEmail);
  registry.forEach((name) => {
    const key = String(name).trim();
    if (key && !byName.has(key)) byName.set(key, { name: key, count: 0, taskRefs: [] });
  });

  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function getTagRegistry(managerEmail) {
  try {
    const raw = window.localStorage.getItem(TAG_REGISTRY_STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    const list = data[managerEmail];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function setTagRegistry(managerEmail, tagNames) {
  try {
    const raw = window.localStorage.getItem(TAG_REGISTRY_STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    data[managerEmail] = tagNames;
    window.localStorage.setItem(TAG_REGISTRY_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function taskLabelsList(task) {
  const raw = task.group ?? task.group_label ?? task.labels ?? [];
  if (Array.isArray(raw)) return raw.map((x) => String(x).trim()).filter(Boolean);
  const s = String(raw).trim();
  return s ? [s] : [];
}

function updateTaskGroupInPlan(plan, oldName, newName) {
  if (!plan?.phases) return;
  plan.phases.forEach((phase) => {
    (phase.tasks || []).forEach((task) => {
      const labels = taskLabelsList(task);
      const idx = labels.indexOf(oldName);
      if (idx !== -1) {
        labels[idx] = newName;
        task.labels = labels;
        task.group = labels;
      } else if (!Array.isArray(task.group) && String(task.group || "").trim() === oldName) {
        task.group = newName;
        task.labels = [newName];
      }
    });
  });
}

function clearTaskGroupInPlan(plan, tagName) {
  if (!plan?.phases) return;
  plan.phases.forEach((phase) => {
    (phase.tasks || []).forEach((task) => {
      const labels = taskLabelsList(task).filter((l) => l !== tagName);
      task.labels = labels;
      task.group = labels;
    });
  });
}

async function updateTagInAllPlans(managerEmail, oldName, newName) {
  const current = state.dashboard?.planTemplate;
  if (current?.phases) {
    updateTaskGroupInPlan(current, oldName, newName);
    try {
      const nextDashboard = await api(`/api/records/${state.dashboard.record.id}/plan`, {
        method: "PATCH",
        body: {
          viewerEmail: state.dashboard.viewer.email,
          viewerRole: state.dashboard.viewer.role,
          name: current.name,
          department: current.department,
          phases: current.phases,
        },
      });
      if (nextDashboard) applyDashboard(nextDashboard, { preservePhase: true });
    } catch (e) {
      showAppMessage("Failed to update plan.", "error");
      return;
    }
  }
  const templates = getPlanTemplates(managerEmail);
  const updated = templates.map((tpl) => {
    if (!tpl.plan?.phases) return tpl;
    const phases = tpl.plan.phases.map((p) => ({
      ...p,
      tasks: (p.tasks || []).map((t) => {
        const labels = taskLabelsList(t).map((l) => (l === oldName ? newName : l));
        return { ...t, group: labels, labels };
      }),
    }));
    return { ...tpl, plan: { ...tpl.plan, phases } };
  });
  try {
    const raw = window.localStorage.getItem(PLAN_TEMPLATES_STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    data[managerEmail] = updated;
    window.localStorage.setItem(PLAN_TEMPLATES_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
  const registry = getTagRegistry(managerEmail);
  const newRegistry = registry.map((n) => (n === oldName ? newName : n)).filter((n, i, arr) => arr.indexOf(n) === i).sort();
  setTagRegistry(managerEmail, newRegistry);
  showAppMessage("Label renamed.", "success");
}

async function removeTagFromAllPlans(managerEmail, tagName) {
  const current = state.dashboard?.planTemplate;
  if (current?.phases) {
    clearTaskGroupInPlan(current, tagName);
    try {
      const nextDashboard = await api(`/api/records/${state.dashboard.record.id}/plan`, {
        method: "PATCH",
        body: {
          viewerEmail: state.dashboard.viewer.email,
          viewerRole: state.dashboard.viewer.role,
          name: current.name,
          department: current.department,
          phases: current.phases,
        },
      });
      if (nextDashboard) applyDashboard(nextDashboard, { preservePhase: true });
    } catch (e) {
      showAppMessage("Failed to update plan.", "error");
      return;
    }
  }
  const templates = getPlanTemplates(managerEmail);
  const updated = templates.map((tpl) => {
    if (!tpl.plan?.phases) return tpl;
    const phases = tpl.plan.phases.map((p) => ({
      ...p,
      tasks: (p.tasks || []).map((t) => {
        const labels = taskLabelsList(t).filter((l) => l !== tagName);
        return { ...t, group: labels, labels };
      }),
    }));
    return { ...tpl, plan: { ...tpl.plan, phases } };
  });
  try {
    const raw = window.localStorage.getItem(PLAN_TEMPLATES_STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    data[managerEmail] = updated;
    window.localStorage.setItem(PLAN_TEMPLATES_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
  const registry = getTagRegistry(managerEmail).filter((n) => n !== tagName);
  setTagRegistry(managerEmail, registry);
  showAppMessage("Label removed from all tasks.", "success");
}

function toggleViewerMenu() {
  if (!elements.viewerMenuDropdown || !elements.viewerMenuToggle) return;
  const isOpen = !elements.viewerMenuDropdown.classList.contains("hidden");
  if (isOpen) {
    closeViewerMenu();
  } else {
    openViewerMenu();
  }
}

function openViewerMenu() {
  if (!elements.viewerMenuDropdown || !elements.viewerMenuToggle) return;
  elements.viewerMenuDropdown.classList.remove("hidden");
  elements.viewerMenuDropdown.setAttribute("aria-hidden", "false");
  elements.viewerMenuToggle.setAttribute("aria-expanded", "true");
  document.addEventListener("click", handleViewerMenuOutsideClick, { once: true });
}

function closeViewerMenu() {
  if (!elements.viewerMenuDropdown || !elements.viewerMenuToggle) return;
  elements.viewerMenuDropdown.classList.add("hidden");
  elements.viewerMenuDropdown.setAttribute("aria-hidden", "true");
  elements.viewerMenuToggle.setAttribute("aria-expanded", "false");
}

function handleViewerMenuOutsideClick(event) {
  if (!elements.viewerMenu || !elements.viewerMenuDropdown) return;
  if (elements.viewerMenu.contains(event.target)) {
    // Clicked inside the menu; don't close, let internal handlers run.
    document.addEventListener("click", handleViewerMenuOutsideClick, { once: true });
    return;
  }
  closeViewerMenu();
}

function getResourcesForCurrentRecord() {
  const base = Array.isArray(state.dashboard.resources) ? state.dashboard.resources : [];
  const recordId = String(state.dashboard.record.id);
  let overrides;
  try {
    overrides = JSON.parse(window.localStorage.getItem(RESOURCES_STORAGE_KEY) || "{}");
  } catch {
    overrides = {};
  }
  const list = Array.isArray(overrides[recordId]) ? overrides[recordId] : null;
  if (list && list.length) return list;
  return base.map((item) => ({
    label: item.label,
    category: item.category,
    url: item.url || "",
  }));
}

function setResourcesForCurrentRecord(resources) {
  const recordId = String(state.dashboard.record.id);
  let overrides;
  try {
    overrides = JSON.parse(window.localStorage.getItem(RESOURCES_STORAGE_KEY) || "{}");
  } catch {
    overrides = {};
  }
  overrides[recordId] = resources;
  try {
    window.localStorage.setItem(RESOURCES_STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // ignore storage failures
  }
}

function getVisibleTasks(phaseId) {
  const phaseTasks = state.dashboard.tasks
    .filter((task) => task.phase_id === phaseId)
    .map((task) => normalizeTaskForViewer(task))
    .filter(Boolean);
  const viewerRole = state.dashboard.viewer.role;

  if (state.taskFilter === "mine") {
    return phaseTasks.filter((task) => task.owner_role === viewerRole);
  }

  if (state.taskFilter === "attention") {
    return phaseTasks.filter(
      (task) => task.blocked || (!task.completed && task.owner_role !== viewerRole)
    );
  }

  return phaseTasks;
}

function resolveQuickStartTask() {
  const selectedPhaseId = getSelectedPhase()?.id;
  const viewerRole = state.dashboard.viewer.role;
  const normalizedTasks = state.dashboard.tasks
    .map((task) => normalizeTaskForViewer(task))
    .filter(Boolean);
  const currentPhaseTasks = normalizedTasks.filter((task) => task.phase_id === selectedPhaseId);
  const ownedTasks = normalizedTasks.filter((task) => task.owner_role === viewerRole);
  const currentPhaseOwnedTasks = currentPhaseTasks.filter((task) => task.owner_role === viewerRole);

  return (
    currentPhaseOwnedTasks.find((task) => !task.completed) ||
    ownedTasks.find((task) => !task.completed) ||
    currentPhaseTasks.find((task) => !task.completed) ||
    normalizedTasks.find((task) => !task.completed) ||
    currentPhaseOwnedTasks[0] ||
    ownedTasks[0] ||
    currentPhaseTasks[0] ||
    normalizedTasks[0] ||
    null
  );
}

async function toggleTaskCompletion(task) {
  try {
    const nextDashboard = await api(`/api/records/${state.dashboard.record.id}/tasks/${task.id}`, {
      method: "PATCH",
      body: {
        viewerEmail: state.dashboard.viewer.email,
        viewerRole: state.dashboard.viewer.role,
        completed: !task.completed,
      },
    });
    applyDashboard(nextDashboard, { preservePhase: true });
  } catch (error) {
    showAppMessage(error.message, "error");
  }
}

function canToggleTask(task) {
  return Boolean(task.canToggle);
}

function isQuickStartTask(task) {
  return Boolean(state.quickStartTaskId && task.id === state.quickStartTaskId);
}

function normalizeTaskForViewer(task) {
  return task;
}

function normalizeDependencyTitleForViewer(title) {
  return title;
}

function normalizeAccessCopyForViewer(text) {
  if (state.dashboard.viewer.role !== "contractor") return text;
  if (!text) return text;

  return text
    .replace(
      /assign(ed)?\s+(an?\s+)?(onboarding\s+)?buddy/gi,
      "connect with your onboarding buddy"
    )
    .replace(/huddles?/gi, "team sessions")
    .replace(/welcome email/gi, "kickoff communication");
}

function applyTheme(theme) {
  state.theme = theme;
  const isDark = theme === "dark";
  document.body.classList.toggle("theme-dark", isDark);
  document.documentElement.classList.toggle("theme-dark", isDark);
  if (elements.themeToggle) {
    elements.themeToggle.textContent = theme === "dark" ? "Light mode" : "Dark mode";
    elements.themeToggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
  }
}

function setTheme(theme) {
  applyTheme(theme);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore storage failures
  }
}

function loadTheme() {
  let theme = "light";
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark" || stored === "light") {
      theme = stored;
    }
  } catch {
    theme = "light";
  }
  applyTheme(theme);
}

function loadManagerSettings() {
  let settings = {};
  try {
    const stored = window.localStorage.getItem(MANAGER_SETTINGS_STORAGE_KEY);
    if (stored) {
      settings = JSON.parse(stored);
    }
  } catch {
    settings = {};
  }
  return settings;
}

function saveManagerSettings(settings) {
  try {
    window.localStorage.setItem(MANAGER_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

function openManagerSettings() {
  if (!elements.managerSettings) return;
  const allSettings = loadManagerSettings();
  const email = state.dashboard?.viewer.email || "";
  const current = (email && allSettings[email]) || {};
  if (elements.managerDisplayName) {
    elements.managerDisplayName.value = current.displayName || "";
  }
  elements.managerSettings.classList.remove("hidden");
  elements.managerSettings.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeManagerSettings({ resetForm }) {
  if (!elements.managerSettings) return;
  if (resetForm && elements.managerSettingsForm) {
    elements.managerSettingsForm.reset();
  }
  elements.managerSettings.classList.add("hidden");
  elements.managerSettings.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function openTagsSettings() {
  if (!elements.tagsSettingsOverlay) return;
  state.tagsSettingsAdding = false;
  hideTagsSettingsUsagePanel();
  renderTagsSettingsList();
  elements.tagsSettingsOverlay.classList.remove("hidden");
  elements.tagsSettingsOverlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeTagsSettings() {
  if (!elements.tagsSettingsOverlay) return;
  elements.tagsSettingsOverlay.classList.add("hidden");
  elements.tagsSettingsOverlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  state.tagsSettingsAdding = false;
  hideTagsSettingsUsagePanel();
}

function hideTagsSettingsUsagePanel() {
  if (elements.tagsSettingsUsagePanel) {
    elements.tagsSettingsUsagePanel.classList.add("hidden");
    elements.tagsSettingsUsagePanel.innerHTML = "";
  }
}

function renderTagsSettingsList() {
  const listEl = elements.tagsSettingsList;
  if (!listEl) return;
  const managerEmail = state.dashboard?.viewer?.email || "";
  const tags = getAllTagsWithUsage(managerEmail);
  const adding = state.tagsSettingsAdding;

  let html = "";
  tags.forEach((tag) => {
    const usedBy = tag.taskRefs.slice(0, 5).map((r) => r.title || "Untitled").join(", ");
    const tooltip = usedBy ? `Used by: ${usedBy}${tag.taskRefs.length > 5 ? "…" : ""}` : "Not used yet";
    const countLabel = tag.count === 1 ? "1 task" : `${tag.count} tasks`;
    html += `
      <div class="tag-settings-row" data-tag-name="${escapeHtml(tag.name)}" title="${escapeHtml(tooltip)}">
        <span class="tag-bubble tag-settings-bubble">${escapeHtml(tag.name)}</span>
        <span class="tag-settings-count">${escapeHtml(countLabel)}</span>
        <button type="button" class="secondary-btn secondary-btn--ghost tag-settings-edit" data-tag-name="${escapeHtml(tag.name)}">Edit</button>
        <button type="button" class="secondary-btn secondary-btn--ghost tag-settings-remove" data-tag-name="${escapeHtml(tag.name)}">Remove</button>
      </div>`;
  });
  if (adding) {
    html += `
      <div class="tag-settings-row tag-settings-row--add">
        <input type="text" id="tags-settings-new-input" class="tag-input" placeholder="Label name" />
        <button type="button" id="tags-settings-new-submit" class="primary-btn">Add</button>
        <button type="button" id="tags-settings-new-cancel" class="secondary-btn">Cancel</button>
      </div>`;
  }
  listEl.innerHTML = html;

  if (adding) {
    const input = listEl.querySelector("#tags-settings-new-input");
    const submitBtn = listEl.querySelector("#tags-settings-new-submit");
    const cancelBtn = listEl.querySelector("#tags-settings-new-cancel");
    input?.focus();
    submitBtn?.addEventListener("click", () => {
      const name = (input?.value || "").trim();
      if (name) {
        const registry = getTagRegistry(managerEmail);
        if (!registry.includes(name)) {
          setTagRegistry(managerEmail, [...registry, name].sort());
        }
        state.tagsSettingsAdding = false;
        renderTagsSettingsList();
      }
    });
    cancelBtn?.addEventListener("click", () => {
      state.tagsSettingsAdding = false;
      renderTagsSettingsList();
    });
  }
}

function showTagsSettingsUsagePanel(tagName, taskRefs) {
  const panel = elements.tagsSettingsUsagePanel;
  if (!panel) return;
  panel.classList.remove("hidden");
  panel.innerHTML = `<h4 class="tags-usage-title">Tasks using “${escapeHtml(tagName)}”</h4><ul class="tags-usage-list">${
    taskRefs.map(
      (r) =>
        `<li><span class="tags-usage-title-text">${escapeHtml(r.title || "Untitled")}</span> — ${escapeHtml(r.planName)}${r.phaseId ? ` (${escapeHtml(r.phaseId)})` : ""}</li>`
    ).join("")
  }</ul><button type="button" id="tags-usage-close" class="secondary-btn">Close</button>`;
  panel.querySelector("#tags-usage-close")?.addEventListener("click", hideTagsSettingsUsagePanel);
}

function getSelectedPhase() {
  return (
    state.dashboard.phases.find((phase) => phase.id === state.selectedPhaseId) ||
    state.dashboard.phases[0]
  );
}

function phaseLabel(phaseId) {
  const phase = state.dashboard.phases.find((item) => item.id === phaseId);
  return phase ? phase.label : phaseId;
}

function formatAccessStatus(status) {
  return status.replaceAll("_", " ");
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatContractorOptionLabel(record) {
  const name = record.contractorName?.trim();
  return name ? `${name} (${record.contractorEmail})` : record.contractorEmail;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function clonePlanTemplateToDraft(planTemplate) {
  const phases = Array.isArray(planTemplate?.phases) ? planTemplate.phases : [];
  return {
    name: planTemplate?.name || "",
    department: planTemplate?.department || "",
    phases: phases.map((phase) => ({
      id: phase.id || createLocalId("phase"),
      label: phase.label || "",
      window: phase.window || "",
      summary: phase.summary || "",
      tasks: Array.isArray(phase.tasks)
        ? phase.tasks.map((task) => {
            const rawGroup = task.group ?? task.groups ?? task.labels;
            const labels = Array.isArray(rawGroup)
              ? rawGroup.map((x) => String(x).trim()).filter(Boolean)
              : rawGroup != null && String(rawGroup).trim() !== ""
                ? [String(rawGroup).trim()]
                : [];
            return {
              id: task.id || createLocalId("task"),
              ownerRole: task.owner_role || task.ownerRole || "contractor",
              labels,
              title: task.title || "",
              description: task.description || "",
              dependencyIds: Array.isArray(task.dependency_ids)
                ? [...task.dependency_ids]
                : Array.isArray(task.dependencyIds)
                  ? [...task.dependencyIds]
                  : [],
            };
          })
        : [],
    })),
  };
}

function createLocalId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function createEmptyPlanPhase() {
  return {
    id: createLocalId("phase"),
    label: "",
    window: "",
    summary: "",
    tasks: [createEmptyPlanTask()],
  };
}

function createEmptyPlanTask() {
  return {
    id: createLocalId("task"),
    ownerRole: "contractor",
    labels: [],
    title: "",
    description: "",
    dependencyIds: [],
  };
}

function handlePlanStageFieldChange(event) {
  if (!state.planDraft) return;
  const field = event.target.dataset.field;
  const scope = event.target.dataset.scope;
  const phaseIndex = Number(event.target.dataset.phaseIndex);
  const taskIndex = Number(event.target.dataset.taskIndex);

  if (!field || !scope || !Number.isInteger(phaseIndex) || !state.planDraft.phases[phaseIndex]) {
    return;
  }

  if (scope === "phase") {
    state.planDraft.phases[phaseIndex][field] = event.target.value;
    return;
  }

  if (
    scope === "task" &&
    Number.isInteger(taskIndex) &&
    state.planDraft.phases[phaseIndex].tasks[taskIndex]
  ) {
    state.planDraft.phases[phaseIndex].tasks[taskIndex][field] = event.target.value;
    if (field === "ownerRole") renderPlanEditorDraft();
  }
}

function showMessage(element, message, tone) {
  if (!element) return;
  element.textContent = message;
  if (tone) {
    element.dataset.state = tone;
  } else {
    element.removeAttribute("data-state");
  }
}

function showAppMessage(message, tone) {
  const showWorkspace = Boolean(state.dashboard) && !elements.workspace?.classList.contains("hidden");
  showMessage(
    elements.loginMessage,
    showWorkspace ? "" : message,
    showWorkspace ? "" : tone
  );
  showMessage(
    elements.workspaceMessage,
    showWorkspace ? message : "",
    showWorkspace ? tone : ""
  );
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Request failed.");
  }
  return payload;
}

function syncProfileFormFromDashboard() {
  if (!state.dashboard) return;

  const { record, viewer } = state.dashboard;
  elements.profileContractorName.value = record.contractorName || "";
  elements.profileManagerName.value = record.managerName || "";
  elements.profileManagerName.disabled = viewer.role !== "manager";
  elements.profileStartDate.value = record.startDate || "";
  elements.profileStartDate.disabled = viewer.role !== "manager";
  elements.profileTimezone.value = record.timezone || "";
  elements.profileTimezone.disabled = viewer.role !== "manager";
  elements.profileContractorEmail.textContent = record.contractorEmail;
  elements.profileManagerEmail.textContent = record.managerEmail || "Not set yet";
}

function openProfileSettings() {
  if (!state.dashboard) return;

  closePlanEditor({ resetDraft: true, restoreFocus: false });
  closeNewContractorModal({ resetForm: true, restoreFocus: false });
  syncProfileFormFromDashboard();
  state.lastFocusedElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  elements.profileSettings?.classList.remove("hidden");
  elements.profileSettings?.setAttribute("aria-hidden", "false");
  syncBodyScrollLock();

  const firstField = [
    elements.profileContractorName,
    elements.profileManagerName,
    elements.profileStartDate,
    elements.profileTimezone,
  ].find((field) => field && !field.disabled);
  firstField?.focus();
}

function closeProfileSettings({ resetForm = false, restoreFocus = true } = {}) {
  if (resetForm) {
    syncProfileFormFromDashboard();
  }

  elements.profileSettings?.classList.add("hidden");
  elements.profileSettings?.setAttribute("aria-hidden", "true");
  syncBodyScrollLock();

  const focusTarget = restoreFocus ? state.lastFocusedElement : null;
  state.lastFocusedElement = null;
  if (focusTarget instanceof HTMLElement && document.contains(focusTarget)) {
    focusTarget.focus();
  }
}

function openNewContractorModal() {
  if (!state.dashboard || state.dashboard.viewer.role !== "manager") return;

  closePlanEditor({ resetDraft: true, restoreFocus: false });
  closeProfileSettings({ resetForm: true, restoreFocus: false });
  resetNewContractorForm();
  state.newContractorStep = 1;
  state.newContractorSelectedPlan = "default";
  elements.newContractorStep1?.classList.remove("hidden");
  elements.newContractorStep2?.classList.add("hidden");
  state.lastFocusedElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  elements.newContractorOverlay?.classList.remove("hidden");
  elements.newContractorOverlay?.setAttribute("aria-hidden", "false");
  syncBodyScrollLock();
  elements.newContractorEmail?.focus();
}

function closeNewContractorModal({ resetForm = false, restoreFocus = true } = {}) {
  if (resetForm) {
    resetNewContractorForm();
  }

  elements.newContractorOverlay?.classList.add("hidden");
  elements.newContractorOverlay?.setAttribute("aria-hidden", "true");
  syncBodyScrollLock();

  const focusTarget = restoreFocus ? state.lastFocusedElement : null;
  state.lastFocusedElement = null;
  if (focusTarget instanceof HTMLElement && document.contains(focusTarget)) {
    focusTarget.focus();
  }
}

function openPlanEditor() {
  if (!state.dashboard?.planTemplate?.editable) return;

  closeProfileSettings({ resetForm: true, restoreFocus: false });
  closeNewContractorModal({ resetForm: true, restoreFocus: false });
  state.planDraft = clonePlanTemplateToDraft(state.dashboard.planTemplate);
  if (!state.planDraft.phases.length) {
    state.planDraft.phases = [createEmptyPlanPhase()];
  }
  state.planEditorExpandedPhases = new Set(
    state.planDraft.phases.map((_, i) => i)
  );
  state.lastFocusedElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  renderPlanEditorDraft();
  elements.planEditorOverlay?.classList.remove("hidden");
  elements.planEditorOverlay?.setAttribute("aria-hidden", "false");
  syncBodyScrollLock();
  elements.planName?.focus();
}

function closePlanEditor({ resetDraft = false, restoreFocus = true } = {}) {
  if (resetDraft) {
    state.planDraft = null;
    showMessage(elements.planEditorMessage, "", "");
  }

  elements.planEditorOverlay?.classList.add("hidden");
  elements.planEditorOverlay?.setAttribute("aria-hidden", "true");
  syncBodyScrollLock();

  const focusTarget = restoreFocus ? state.lastFocusedElement : null;
  state.lastFocusedElement = null;
  if (focusTarget instanceof HTMLElement && document.contains(focusTarget)) {
    focusTarget.focus();
  }
}

function openSaveTemplateOverlay() {
  if (!elements.saveTemplateOverlay || !elements.saveTemplateNameInput) return;
  elements.saveTemplateNameInput.value = state.planDraft?.name?.trim() || "My onboarding plan";
  elements.saveTemplateOverlay.classList.remove("hidden");
  elements.saveTemplateOverlay.setAttribute("aria-hidden", "false");
  syncBodyScrollLock();
  elements.saveTemplateNameInput.focus();
}

function closeSaveTemplateOverlay() {
  if (elements.saveTemplateOverlay) {
    elements.saveTemplateOverlay.classList.add("hidden");
    elements.saveTemplateOverlay.setAttribute("aria-hidden", "true");
  }
  syncBodyScrollLock();
}

function saveTemplateFromOverlay() {
  if (!state.dashboard || !state.planDraft || state.dashboard.viewer.role !== "manager") return;
  const templateName = (elements.saveTemplateNameInput?.value ?? "").trim() || "My onboarding plan";
  const planPayload = {
    name: state.planDraft.name.trim(),
    department: state.planDraft.department.trim(),
    phases: state.planDraft.phases.map((phase) => ({
      id: phase.id,
      label: phase.label.trim(),
      window: phase.window.trim(),
      summary: phase.summary.trim(),
      tasks: (phase.tasks || []).map((task) => ({
        id: task.id,
        ownerRole: task.ownerRole,
        group: Array.isArray(task.labels) ? task.labels : (task.group != null && String(task.group).trim() !== "" ? [String(task.group).trim()] : []),
        title: task.title.trim(),
        description: task.description.trim(),
        dueLabel: (task.dueLabel != null ? task.dueLabel : "").trim(),
        dependencyIds: Array.isArray(task.dependencyIds) ? task.dependencyIds : [],
      })),
    })),
  };
  savePlanTemplate(state.dashboard.viewer.email, templateName, planPayload);
  showAppMessage("Template saved.", "success");
  closeSaveTemplateOverlay();
}

function openRampTargetsEditor() {
  if (!elements.rampTargetsEditorOverlay || !elements.rampTargetsEditorContent) return;
  renderRampTargetsEditorContent();
  elements.rampTargetsEditorOverlay.classList.remove("hidden");
  elements.rampTargetsEditorOverlay.setAttribute("aria-hidden", "false");
  syncBodyScrollLock();
}

function closeRampTargetsEditor() {
  if (!elements.rampTargetsEditorOverlay) return;
  elements.rampTargetsEditorOverlay.classList.add("hidden");
  elements.rampTargetsEditorOverlay.setAttribute("aria-hidden", "true");
  syncBodyScrollLock();
}

function renderRampTargetsEditorContent() {
  if (!elements.rampTargetsEditorContent) return;
  const buckets = getMetricsForCurrentRecord();
  elements.rampTargetsEditorContent.innerHTML = "";
  const list = document.createElement("div");
  list.className = "plan-stage-list";
  buckets.forEach((bucket, index) => {
    const card = document.createElement("article");
    card.className = "metric-card editor-metric-card";
    const lines = (bucket.metrics || []).map((m) => (m.target ? `${m.label}: ${m.target}` : m.label)).join("\n");
    card.innerHTML = `
      <div class="metric-card-head">
        <h4>Month</h4>
        <div class="metric-card-actions">
          <button type="button" class="secondary-btn secondary-btn--ghost" data-action="ramp-remove-metric" data-metric-index="${index}">Remove</button>
        </div>
      </div>
      <label class="field">
        <span>Month label</span>
        <input type="text" data-metric-index="${index}" data-field="month" value="${escapeHtml(bucket.month || "")}" placeholder="Month ${index + 1}" />
      </label>
      <label class="field">
        <span>Expectations (one per line, optional "label: target")</span>
        <textarea rows="4" data-metric-index="${index}" data-field="metrics" placeholder="e.g. Response time: under 2h">${escapeHtml(lines)}</textarea>
      </label>
    `;
    list.appendChild(card);
  });
  const addRow = document.createElement("div");
  addRow.className = "editor-add-row";
  addRow.innerHTML = `<button type="button" class="secondary-btn" data-action="ramp-add-metric">Add month</button>`;
  list.appendChild(addRow);
  elements.rampTargetsEditorContent.appendChild(list);
  list.onclick = (event) => {
    const btn = event.target.closest("[data-action]");
    if (!btn) return;
    if (btn.dataset.action === "ramp-add-metric") {
      const current = getMetricsForCurrentRecord();
      setMetricsForCurrentRecord([...current, { month: "New month", metrics: [] }]);
      renderRampTargetsEditorContent();
    } else if (btn.dataset.action === "ramp-remove-metric") {
      const idx = Number(btn.dataset.metricIndex);
      if (!Number.isInteger(idx)) return;
      const current = getMetricsForCurrentRecord();
      if (!current[idx]) return;
      const next = [...current];
      next.splice(idx, 1);
      setMetricsForCurrentRecord(next);
      renderRampTargetsEditorContent();
    }
  };
}

function saveRampTargetsEditor() {
  if (!elements.rampTargetsEditorContent) return;
  const cards = elements.rampTargetsEditorContent.querySelectorAll(".editor-metric-card");
  const buckets = [];
  cards.forEach((card) => {
    const idx = card.querySelector("[data-field='month']")?.dataset.metricIndex;
    const monthInput = card.querySelector("[data-field='month']");
    const metricsInput = card.querySelector("[data-field='metrics']");
    const month = monthInput?.value?.trim() || "Month";
    const text = metricsInput?.value ?? "";
    const metrics = parseMetricLines(text);
    buckets.push({ month, metrics });
  });
  setMetricsForCurrentRecord(buckets);
  if (elements.metricsHeaderTitle) {
    elements.metricsHeaderTitle.textContent = getMetricsHeaderForCurrentRecord();
  }
  renderMetrics();
  closeRampTargetsEditor();
}

function openOperatingNormsEditor(sectionIndex = null) {
  if (!elements.operatingNormsEditorOverlay || !elements.operatingNormsEditorContent) return;
  state.operatingNormEditorSectionIndex = Number.isInteger(sectionIndex) ? sectionIndex : null;
  renderOperatingNormsEditorContent();
  elements.operatingNormsEditorOverlay.classList.remove("hidden");
  elements.operatingNormsEditorOverlay.setAttribute("aria-hidden", "false");
  syncBodyScrollLock();
  elements.operatingNormsEditorContent.querySelector("[data-field='category']")?.focus();
}

function closeOperatingNormsEditor() {
  if (!elements.operatingNormsEditorOverlay) return;
  elements.operatingNormsEditorOverlay.classList.add("hidden");
  elements.operatingNormsEditorOverlay.setAttribute("aria-hidden", "true");
  state.operatingNormEditorSectionIndex = null;
  syncBodyScrollLock();
}

function renderOperatingNormsEditorContent() {
  if (!elements.operatingNormsEditorContent) return;
  const sections = getExpectationsForCurrentRecord();
  const index = state.operatingNormEditorSectionIndex;
  const section = Number.isInteger(index) && sections[index]
    ? sections[index]
    : { category: "", items: [] };
  if (elements.operatingNormsEditorTitle) {
    elements.operatingNormsEditorTitle.textContent = Number.isInteger(index)
      ? "Edit operating norm"
      : "Add operating norm";
  }
  elements.operatingNormsEditorContent.innerHTML = "";
  const card = document.createElement("article");
  card.className = "expectation-card editor-expectation-card";
  card.innerHTML = `
    <div class="expectation-head">
      <h4>${Number.isInteger(index) ? "Operating norm" : "New operating norm"}</h4>
    </div>
    <label class="field">
      <span>Category</span>
      <input type="text" data-field="category" value="${escapeHtml(section.category || "")}" placeholder="e.g. Communication" />
    </label>
    <label class="field">
      <span>Items (one per line)</span>
      <textarea rows="5" data-field="items" placeholder="Item one">${escapeHtml((section.items || []).join("\n"))}</textarea>
    </label>
  `;
  elements.operatingNormsEditorContent.appendChild(card);
}

function saveOperatingNormsEditor() {
  if (!elements.operatingNormsEditorContent) return;
  const categoryInput = elements.operatingNormsEditorContent.querySelector("[data-field='category']");
  const itemsInput = elements.operatingNormsEditorContent.querySelector("[data-field='items']");
  const category = categoryInput?.value?.trim() || "Unnamed";
  const text = itemsInput?.value ?? "";
  const items = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const nextSection = { category, items };
  const sections = getExpectationsForCurrentRecord();
  if (Number.isInteger(state.operatingNormEditorSectionIndex) && sections[state.operatingNormEditorSectionIndex]) {
    sections[state.operatingNormEditorSectionIndex] = nextSection;
  } else {
    sections.push(nextSection);
  }
  setExpectationsForCurrentRecord(sections);
  renderExpectations();
  closeOperatingNormsEditor();
}

function openInternalResourcesEditor() {
  if (!elements.internalResourcesEditorOverlay || !elements.internalResourcesEditorContent) return;
  renderInternalResourcesEditorContent();
  elements.internalResourcesEditorOverlay.classList.remove("hidden");
  elements.internalResourcesEditorOverlay.setAttribute("aria-hidden", "false");
  syncBodyScrollLock();
}

function closeInternalResourcesEditor() {
  if (!elements.internalResourcesEditorOverlay) return;
  elements.internalResourcesEditorOverlay.classList.add("hidden");
  elements.internalResourcesEditorOverlay.setAttribute("aria-hidden", "true");
  syncBodyScrollLock();
}

function renderInternalResourcesEditorContent() {
  if (!elements.internalResourcesEditorContent) return;
  const resources = getResourcesForCurrentRecord();
  elements.internalResourcesEditorContent.innerHTML = "";
  const list = document.createElement("div");
  list.className = "plan-stage-list";
  resources.forEach((resource, index) => {
    const card = document.createElement("article");
    card.className = "resource-pill editor-resource-card";
    card.innerHTML = `
      <div class="editor-resource-fields">
        <label class="field">
          <span>Label</span>
          <input type="text" data-resource-index="${index}" data-field="label" value="${escapeHtml(resource.label || "")}" placeholder="Resource name" />
        </label>
        <label class="field">
          <span>Category</span>
          <input type="text" data-resource-index="${index}" data-field="category" value="${escapeHtml(resource.category || "")}" placeholder="Optional" />
        </label>
        <label class="field">
          <span>URL</span>
          <input type="url" data-resource-index="${index}" data-field="url" value="${escapeHtml(resource.url || "")}" placeholder="https://..." />
        </label>
        <button type="button" class="secondary-btn secondary-btn--ghost" data-action="resources-remove" data-resource-index="${index}">Remove</button>
      </div>
    `;
    list.appendChild(card);
  });
  const addRow = document.createElement("div");
  addRow.className = "editor-add-row";
  addRow.innerHTML = `<button type="button" class="secondary-btn" data-action="resources-add">Add resource</button>`;
  list.appendChild(addRow);
  elements.internalResourcesEditorContent.appendChild(list);
  list.onclick = (event) => {
    const btn = event.target.closest("[data-action]");
    if (!btn) return;
    if (btn.dataset.action === "resources-add") {
      const current = getResourcesForCurrentRecord();
      setResourcesForCurrentRecord([...current, { label: "", category: "", url: "" }]);
      renderInternalResourcesEditorContent();
    } else if (btn.dataset.action === "resources-remove") {
      const idx = Number(btn.dataset.resourceIndex);
      if (!Number.isInteger(idx)) return;
      const current = getResourcesForCurrentRecord();
      const next = current.filter((_, i) => i !== idx);
      setResourcesForCurrentRecord(next);
      renderInternalResourcesEditorContent();
    }
  };
}

function saveInternalResourcesEditor() {
  if (!elements.internalResourcesEditorContent) return;
  const cards = elements.internalResourcesEditorContent.querySelectorAll(".editor-resource-card");
  const resources = [];
  cards.forEach((card) => {
    const labelInput = card.querySelector("[data-field='label']");
    const categoryInput = card.querySelector("[data-field='category']");
    const urlInput = card.querySelector("[data-field='url']");
    resources.push({
      label: labelInput?.value?.trim() ?? "",
      category: categoryInput?.value?.trim() ?? "",
      url: urlInput?.value?.trim() ?? "",
    });
  });
  setResourcesForCurrentRecord(resources);
  renderResources();
  closeInternalResourcesEditor();
}

function openReminderEditor(reminderId) {
  state.reminderEditorReminderId = reminderId ?? null;
  if (elements.reminderEditorTitle) {
    elements.reminderEditorTitle.textContent = reminderId ? "Edit reminder" : "Add reminder";
  }
  if (elements.reminderEditorTitleInput) elements.reminderEditorTitleInput.value = "";
  if (elements.reminderEditorNoDate) elements.reminderEditorNoDate.checked = false;
  if (elements.reminderEditorDate) elements.reminderEditorDate.value = "";
  if (reminderId && state.dashboard?.viewer?.email) {
    const list = getReminders(state.dashboard.viewer.email);
    const reminder = list.find((r) => r.id === reminderId);
    if (reminder) {
      if (elements.reminderEditorTitleInput) elements.reminderEditorTitleInput.value = reminder.title || "";
      if (elements.reminderEditorNoDate) elements.reminderEditorNoDate.checked = !reminder.dueDate;
      if (reminder.dueDate && elements.reminderEditorDate) elements.reminderEditorDate.value = reminder.dueDate;
    }
  }
  if (elements.reminderEditorDateWrap) {
    elements.reminderEditorDateWrap.classList.toggle("hidden", elements.reminderEditorNoDate?.checked ?? false);
  }
  if (elements.reminderEditorOverlay) {
    elements.reminderEditorOverlay.classList.remove("hidden");
    elements.reminderEditorOverlay.setAttribute("aria-hidden", "false");
  }
  syncBodyScrollLock();
  elements.reminderEditorTitleInput?.focus();
}

function closeReminderEditor() {
  if (elements.reminderEditorOverlay) {
    elements.reminderEditorOverlay.classList.add("hidden");
    elements.reminderEditorOverlay.setAttribute("aria-hidden", "true");
  }
  state.reminderEditorReminderId = null;
  syncBodyScrollLock();
}

function saveReminderEditor() {
  const email = state.dashboard?.viewer?.email;
  if (!email) return;
  const title = elements.reminderEditorTitleInput?.value?.trim() || "Untitled";
  const noDate = elements.reminderEditorNoDate?.checked ?? false;
  const dueDate = noDate ? null : (elements.reminderEditorDate?.value?.trim() || null);
  const list = getReminders(email);
  if (state.reminderEditorReminderId) {
    const idx = list.findIndex((r) => r.id === state.reminderEditorReminderId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], title, dueDate };
    }
  } else {
    list.push({
      id: `rem_${Math.random().toString(36).slice(2, 12)}`,
      title,
      dueDate,
      createdAt: new Date().toISOString(),
      done: false,
    });
  }
  saveReminders(email, list);
  renderReminders();
  closeReminderEditor();
}

function openOneOnOneEditor(action, { itemId = null, text = "", url = "" } = {}) {
  state.oneOnOneEditorAction = action;
  state.oneOnOneEditorItemId = itemId;
  state.lastFocusedElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const titles = {
    "add-manager-note": "Add note",
    "add-manager-metric": "Add metric to review",
    "add-contractor-point": "Add talking point",
    "add-action-item": "Add action item",
    "add-win": "Add win",
    "edit-win": "Edit win",
  };
  const labels = {
    "add-manager-note": "Note",
    "add-manager-metric": "Metric to review",
    "add-contractor-point": "Talking point",
    "add-action-item": "Action item",
    "add-win": "Win",
    "edit-win": "Win",
  };
  if (elements.oneOnOneEditorTitle) elements.oneOnOneEditorTitle.textContent = titles[action] || "Add item";
  if (elements.oneOnOneEditorLabel) elements.oneOnOneEditorLabel.textContent = labels[action] || "Text";
  if (elements.oneOnOneEditorText) elements.oneOnOneEditorText.value = text;
  const isMetric = action === "add-manager-metric";
  if (elements.oneOnOneEditorLinkWrap) {
    elements.oneOnOneEditorLinkWrap.classList.toggle("hidden", !isMetric);
  }
  if (elements.oneOnOneEditorLink) elements.oneOnOneEditorLink.value = isMetric ? url : "";
  if (elements.oneOnOneEditorOverlay) {
    elements.oneOnOneEditorOverlay.classList.remove("hidden");
    elements.oneOnOneEditorOverlay.setAttribute("aria-hidden", "false");
  }
  syncBodyScrollLock();
  elements.oneOnOneEditorText?.focus();
}

function closeOneOnOneEditor() {
  if (elements.oneOnOneEditorOverlay) {
    elements.oneOnOneEditorOverlay.classList.add("hidden");
    elements.oneOnOneEditorOverlay.setAttribute("aria-hidden", "true");
  }
  state.oneOnOneEditorAction = null;
  state.oneOnOneEditorItemId = null;
  syncBodyScrollLock();
}

async function saveOneOnOneEditor() {
  const action = state.oneOnOneEditorAction;
  const meetingId = getSelectedOneOnOneMeeting()?.id;
  if (!action || !meetingId) return;
  const text = (elements.oneOnOneEditorText?.value ?? "").trim();
  if (!text) return;
  const url = (elements.oneOnOneEditorLink?.value ?? "").trim() || "";
  let payload;
  if (action === "add-action-item" || action === "add-win") {
    payload = { action, text };
  } else if (action === "edit-win") {
    payload = { action: "update-win", itemId: state.oneOnOneEditorItemId, text };
  } else {
    payload = { action, text, url };
  }
  await mutateOneOnOneMeeting(meetingId, payload);
  closeOneOnOneEditor();
}

function renderPlanEditorDraft() {
  if (!state.planDraft) return;

  elements.planName.value = state.planDraft.name;
  elements.planDepartment.value = state.planDraft.department;
  elements.planStageList.innerHTML = "";

  state.planDraft.phases.forEach((phase, phaseIndex) => {
    const taskCount = phase.tasks.length;
    const managerOwnedCount = phase.tasks.filter((task) => task.ownerRole === "manager").length;
    const contractorOwnedCount = taskCount - managerOwnedCount;
    const isExpanded = state.planEditorExpandedPhases.has(phaseIndex);
    const article = document.createElement("article");
    article.className = "plan-stage-card" + (isExpanded ? "" : " is-collapsed");
    article.dataset.phaseIndex = String(phaseIndex);
    article.innerHTML = `
      <div class="plan-stage-head">
        <button
          type="button"
          class="plan-stage-toggle"
          data-action="toggle-phase"
          data-phase-index="${phaseIndex}"
          aria-expanded="${isExpanded}"
          aria-label="${isExpanded ? "Collapse" : "Expand"} stage ${phaseIndex + 1}"
        >
          <span class="plan-stage-chevron">${isExpanded ? "▼" : "▶"}</span>
        </button>
        <div class="plan-stage-intro">
          <p class="plan-stage-kicker">Stage ${phaseIndex + 1}</p>
          <div class="plan-stage-title-row">
            <h4>${escapeHtml(phase.label || "Untitled stage")}</h4>
            <span class="plan-stage-count">${taskCount} ${taskCount === 1 ? "task" : "tasks"}</span>
          </div>
          <div class="plan-stage-badges">
            <span class="plan-stage-badge">${contractorOwnedCount} ${contractorOwnedCount === 1 ? "contractor" : "contractors"}</span>
            <span class="plan-stage-badge">${managerOwnedCount} ${managerOwnedCount === 1 ? "manager" : "managers"}</span>
          </div>
        </div>
        <button
          class="secondary-btn secondary-btn--ghost plan-action-btn"
          type="button"
          data-action="remove-phase"
          data-phase-index="${phaseIndex}"
        >
          Remove stage
        </button>
      </div>
      <div class="plan-stage-body">
      <div class="plan-meta-grid">
        <label class="field">
          <span>Stage title</span>
          <input
            type="text"
            value="${escapeHtml(phase.label)}"
            data-scope="phase"
            data-field="label"
            data-phase-index="${phaseIndex}"
            placeholder="Pre-onboarding"
          />
        </label>
      </div>
      <label class="field plan-stage-summary-field">
        <span>Stage summary</span>
        <textarea
          rows="3"
          data-scope="phase"
          data-field="summary"
          data-phase-index="${phaseIndex}"
          placeholder="What should happen during this stage?"
        >${escapeHtml(phase.summary)}</textarea>
      </label>
      <div class="plan-task-list">
        ${
          phase.tasks.length
            ? phase.tasks
                .map(
                  (task, taskIndex) => `
                    <article class="plan-task-card">
                      <div class="plan-task-head">
                        <div class="plan-task-intro">
                          <p class="plan-task-kicker">Task ${taskIndex + 1}</p>
                          <div class="plan-task-title-row">
                            <h5>${escapeHtml(task.title || "Untitled task")}</h5>
                            <span class="plan-task-owner plan-task-owner--${task.ownerRole}">
                              ${task.ownerRole === "manager" ? "Manager" : "Contractor"}
                            </span>
                          </div>
                          <div class="plan-task-badges">
                            ${(Array.isArray(task.labels) ? task.labels : (task.group != null && task.group !== "" ? [task.group] : [])).length
                              ? (Array.isArray(task.labels) ? task.labels : [task.group]).map((l) => `<span class="plan-task-badge tag-bubble">${escapeHtml(l)}</span>`).join("")
                              : '<span class="plan-task-badge tag-bubble">No labels</span>'}
                          </div>
                        </div>
                        <button
                          class="secondary-btn secondary-btn--ghost plan-action-btn"
                          type="button"
                          data-action="remove-task"
                          data-phase-index="${phaseIndex}"
                          data-task-index="${taskIndex}"
                        >
                          Remove task
                        </button>
                      </div>
                      <div class="plan-task-grid">
                        <label class="field plan-field--wide">
                          <span>Task title</span>
                          <input
                            type="text"
                            value="${escapeHtml(task.title)}"
                            data-scope="task"
                            data-field="title"
                            data-phase-index="${phaseIndex}"
                            data-task-index="${taskIndex}"
                            placeholder="Share welcome packet"
                          />
                        </label>
                        <label class="field">
                          <span>Assigned to</span>
                          <select
                            data-scope="task"
                            data-field="ownerRole"
                            data-phase-index="${phaseIndex}"
                            data-task-index="${taskIndex}"
                          >
                            <option value="contractor" ${
                              task.ownerRole === "contractor" ? "selected" : ""
                            }>Contractor</option>
                            <option value="manager" ${
                              task.ownerRole === "manager" ? "selected" : ""
                            }>Manager</option>
                          </select>
                        </label>
                        <label class="field plan-field--wide">
                          <span>Labels</span>
                          <div class="tag-input-wrap" data-phase-index="${phaseIndex}" data-task-index="${taskIndex}">
                            ${(Array.isArray(task.labels) ? task.labels : (task.group != null && task.group !== "" ? [task.group] : [])).map((label, labelIdx) => `<span class="tag-bubble" data-phase-index="${phaseIndex}" data-task-index="${taskIndex}" data-label-index="${labelIdx}">${escapeHtml(label)}</span><button type="button" class="tag-bubble-remove" data-phase-index="${phaseIndex}" data-task-index="${taskIndex}" data-label-index="${labelIdx}" aria-label="Remove label">×</button>`).join("")}
                            <input type="text" class="tag-input" data-phase-index="${phaseIndex}" data-task-index="${taskIndex}" placeholder="Type label and press Enter" />
                          </div>
                        </label>
                      </div>
                      <label class="field">
                        <span>Description</span>
                        <textarea
                          rows="3"
                          data-scope="task"
                          data-field="description"
                          data-phase-index="${phaseIndex}"
                          data-task-index="${taskIndex}"
                          placeholder="Explain what success looks like for this task."
                        >${escapeHtml(task.description)}</textarea>
                      </label>
                    </article>
                  `
                )
                .join("")
            : '<div class="plan-task-empty">No tasks in this stage yet. Add the first item for this handoff.</div>'
        }
      </div>
      <div class="plan-stage-footer">
        <button
          class="secondary-btn plan-add-task-btn"
          type="button"
          data-action="add-task"
          data-phase-index="${phaseIndex}"
        >
          Add task
        </button>
      </div>
      </div>
    `;
    elements.planStageList.appendChild(article);
  });
}

function resetNewContractorForm() {
  elements.newContractorForm?.reset();
  if (elements.newContractorTimezone) {
    elements.newContractorTimezone.value =
      state.dashboard?.record.timezone || state.bootstrap?.defaultTimezone || "America/New_York";
  }
  state.newContractorStep = 1;
  state.newContractorSelectedPlan = "default";
  elements.newContractorStep1?.classList.remove("hidden");
  elements.newContractorStep2?.classList.add("hidden");
  showMessage(elements.newContractorMessage, "", "");
}

function renderNewContractorPlanOptions() {
  if (!elements.newContractorPlanOptions) return;
  const email = state.dashboard?.viewer.email || "";
  const templates = getPlanTemplates(email);
  const selected = state.newContractorSelectedPlan;

  const options = [
    { value: "default", label: "Use default plan" },
    { value: "current", label: "Use current plan" },
    ...templates.map((t) => ({ value: t.id, label: t.name })),
  ];

  elements.newContractorPlanOptions.innerHTML = options
    .map(
      (opt) => `
        <label class="plan-option-label">
          <input type="radio" name="new-contractor-plan" value="${escapeHtml(opt.value)}" ${selected === opt.value ? "checked" : ""} />
          <span>${escapeHtml(opt.label)}</span>
        </label>
      `
    )
    .join("");

  elements.newContractorPlanOptions.querySelectorAll("input[name='new-contractor-plan']").forEach((radio) => {
    radio.addEventListener("change", () => {
      state.newContractorSelectedPlan = radio.value;
    });
  });
}

function syncBodyScrollLock() {
  const hasOpenModal =
    Boolean(elements.planEditorOverlay && !elements.planEditorOverlay.classList.contains("hidden")) ||
    Boolean(elements.saveTemplateOverlay && !elements.saveTemplateOverlay.classList.contains("hidden")) ||
    Boolean(elements.profileSettings && !elements.profileSettings.classList.contains("hidden")) ||
    Boolean(
      elements.newContractorOverlay &&
        !elements.newContractorOverlay.classList.contains("hidden")
    ) ||
    Boolean(elements.rampTargetsEditorOverlay && !elements.rampTargetsEditorOverlay.classList.contains("hidden")) ||
    Boolean(elements.operatingNormsEditorOverlay && !elements.operatingNormsEditorOverlay.classList.contains("hidden")) ||
    Boolean(elements.internalResourcesEditorOverlay && !elements.internalResourcesEditorOverlay.classList.contains("hidden")) ||
    Boolean(elements.reminderEditorOverlay && !elements.reminderEditorOverlay.classList.contains("hidden")) ||
    Boolean(elements.oneOnOneSetupOverlay && !elements.oneOnOneSetupOverlay.classList.contains("hidden")) ||
    Boolean(elements.oneOnOneTemplateOverlay && !elements.oneOnOneTemplateOverlay.classList.contains("hidden")) ||
    Boolean(elements.oneOnOneEditorOverlay && !elements.oneOnOneEditorOverlay.classList.contains("hidden"));
  document.body.classList.toggle("modal-open", Boolean(hasOpenModal));
}

async function switchManagerRecord(recordId) {
  if (!state.dashboard) return;

  try {
    const nextDashboard = await api(
      `/api/records/${recordId}?viewerEmail=${encodeURIComponent(
        state.dashboard.viewer.email
      )}&viewerRole=${encodeURIComponent(state.dashboard.viewer.role)}`
    );
    applyDashboard(nextDashboard, { preservePhase: false });
  } catch (error) {
    renderManagerControls();
    showAppMessage(error.message, "error");
  }
}

function showAuthenticationView({
  message = "",
  tone = "",
  clearCredentials = false,
  resetRole = false,
} = {}) {
  closePlanEditor({ resetDraft: true, restoreFocus: false });
  closeProfileSettings({ resetForm: true, restoreFocus: false });
  closeNewContractorModal({ resetForm: true, restoreFocus: false });
  closeOneOnOneSetupOverlay();
  closeOneOnOneTemplateOverlay();
  closeOneOnOneEditor();
  state.dashboard = null;
  state.managerRecords = [];
  state.planDraft = null;
  state.selectedPhaseId = null;
  state.quickStartTaskId = null;
  state.selectedOneOnOneMeetingId = null;
  state.oneOnOneView = "list";

  elements.workspace?.classList.add("hidden");
  elements.loginHero?.classList.remove("hidden");
  elements.mastheadAppSwitcher?.classList.add("hidden");

  if (clearCredentials) {
    elements.viewerEmail.value = "";
  }

  if (resetRole) {
    state.currentRole = "contractor";
    updateRoleUI();
  }

  showAppMessage(message, tone);
  window.scrollTo({ top: 0, behavior: "auto" });
  window.requestAnimationFrame(() => {
    elements.viewerEmail?.focus();
  });
}

function showWorkspaceView() {
  elements.workspace?.classList.remove("hidden");
  elements.loginHero?.classList.add("hidden");
  elements.mastheadAppSwitcher?.classList.remove("hidden");
  renderMastheadAppSwitcher();
  showAppMessage("", "");
  window.scrollTo({ top: 0, behavior: "auto" });
}
