import Controller from "@ember/controller";
import ModalFunctionality from "discourse/mixins/modal-functionality";
import discourseComputed from "discourse-common/utils/decorators";
import I18n from "I18n";
import Topic from "discourse/models/topic";
import { fromSeconds, toSeconds } from "discourse/helpers/slow-mode";
import { popupAjaxError } from "discourse/lib/ajax-error";
import { equal } from "@ember/object/computed";
import { action } from "@ember/object";

export default Controller.extend(ModalFunctionality, {
  selectedSlowMode: null,
  hours: null,
  minutes: null,
  seconds: null,
  saveDisabled: false,
  showCustomSelect: equal("selectedSlowMode", "custom"),

  init() {
    this._super(...arguments);

    this.set("slowModes", [
      {
        id: "900",
        name: I18n.t("topic.slow_mode_update.durations.15_minutes"),
      },
      {
        id: "3600",
        name: I18n.t("topic.slow_mode_update.durations.1_hour"),
      },
      {
        id: "14400",
        name: I18n.t("topic.slow_mode_update.durations.4_hours"),
      },
      {
        id: "86400",
        name: I18n.t("topic.slow_mode_update.durations.1_day"),
      },
      {
        id: "604800",
        name: I18n.t("topic.slow_mode_update.durations.1_week"),
      },
      {
        id: "custom",
        name: I18n.t("topic.slow_mode_update.durations.custom"),
      },
    ]);
  },

  onShow() {
    const currentDuration = parseInt(this.model.slow_mode_seconds, 10);

    if (currentDuration) {
      const selectedDuration = this.slowModes.find((mode) => {
        return mode.id === currentDuration.toString();
      });

      if (selectedDuration) {
        this.set("selectedSlowMode", currentDuration.toString());
      } else {
        this.set("selectedSlowMode", "custom");
      }

      this._setFromSeconds(currentDuration);
    }
  },

  @discourseComputed("hours", "minutes", "seconds")
  submitDisabled(hours, minutes, seconds) {
    return this.saveDisabled || !(hours || minutes || seconds);
  },

  _setFromSeconds(seconds) {
    this.setProperties(fromSeconds(seconds));
  },

  @action
  setSlowModeDuration(duration) {
    if (duration !== "custom") {
      let seconds = parseInt(duration, 10);

      this._setFromSeconds(seconds);
    }

    this.set("selectedSlowMode", duration);
  },

  @action
  enableSlowMode() {
    this.set("saveDisabled", true);
    const seconds = toSeconds(this.hours, this.minutes, this.seconds);
    Topic.setSlowMode(this.model.id, seconds)
      .catch(popupAjaxError)
      .then(() => {
        this.set("model.slow_mode_seconds", seconds);
        this.send("closeModal");
      })
      .finally(() => this.set("saveDisabled", false));
  },

  @action
  disableSlowMode() {
    this.set("saveDisabled", true);
    Topic.setSlowMode(this.model.id, 0)
      .catch(popupAjaxError)
      .then(() => {
        this.set("model.slow_mode_seconds", 0);
        this.send("closeModal");
      })
      .finally(() => this.set("saveDisabled", false));
  },
});
