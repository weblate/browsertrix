// import type { SlInputEvent } from "@shoelace-style/shoelace";
import { msg } from "@lit/localize";
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.js";
import { customElement, property } from "lit/decorators.js";

export function validURL(url: string) {
  // adapted from: https://gist.github.com/dperini/729294
  return /^(?:https?:\/\/)?(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(
    url,
  );
}

/**
 * URL input field with validation.
 *
 * @TODO Use types from SlInput
 *
 * @attr {String} name
 * @attr {String} size
 * @attr {String} name
 * @attr {String} label
 * @attr {String} value
 */
@customElement("btrix-url-input")
export class Component extends SlInput {
  @property({ type: Number, reflect: true })
  minlength = 4;

  @property({ type: String, reflect: true })
  placeholder = "https://example.com";

  connectedCallback(): void {
    this.inputmode = "url";

    super.connectedCallback();

    this.addEventListener("sl-input", this.onInput);
    this.addEventListener("sl-blur", this.onBlur);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();

    this.removeEventListener("sl-input", this.onInput);
    this.removeEventListener("sl-blur", this.onBlur);
  }

  private readonly onInput = async () => {
    console.log("input 1");
    await this.updateComplete;

    if (!this.checkValidity() && validURL(this.value)) {
      this.setCustomValidity("");
      this.helpText = "";
    }
  };

  private readonly onBlur = async () => {
    await this.updateComplete;

    const value = this.value;

    if (value && !validURL(value)) {
      const text = msg("Please enter a valid URL.");
      this.helpText = text;
      this.setCustomValidity(text);
    } else if (
      value &&
      !value.startsWith("https://") &&
      !value.startsWith("http://")
    ) {
      this.value = `https://${value}`;
    }
  };
}
