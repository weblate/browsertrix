import { localized, msg, str } from "@lit/localize";
import { Task } from "@lit/task";
import { html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { when } from "lit/directives/when.js";

import { BtrixElement } from "@/classes/BtrixElement";
import { page, pageHeading } from "@/layouts/page";
import type { OrgData, PublicOrgCollections } from "@/types/org";

@localized()
@customElement("btrix-org-profile")
export class OrgProfile extends BtrixElement {
  @property({ type: String })
  slug?: string;

  @state()
  private isPrivatePreview = false;

  get canEditOrg() {
    return this.slug === this.orgSlug && this.appState.isAdmin;
  }

  private readonly orgCollections = new Task(this, {
    task: async ([slug]) => {
      if (!slug) return;
      const org = await this.fetchCollections({ slug });
      return org;
    },
    args: () => [this.slug] as const,
  });

  render() {
    if (!this.slug) {
      return this.renderError();
    }

    return html`
      <div class="flex min-h-full flex-col">
        ${this.orgCollections.render({
          complete: (profile) =>
            profile
              ? html`
                  ${this.renderProfile(profile)}
                  ${when(!this.authState, () =>
                    this.renderSignUpCta(profile.org),
                  )}
                `
              : this.renderError(),
          error: this.renderError,
          pending: this.renderSkeleton,
        })}
      </div>
    `;
  }

  private readonly renderSkeleton = () => html`
    ${page(
      {
        title: "",
        secondary: html`<sl-skeleton
            class="block max-w-[50ch]"
            effect="sheen"
          ></sl-skeleton>
          <sl-skeleton
            class="block max-w-[30ch]"
            effect="sheen"
          ></sl-skeleton>`,
      },
      () => html`
        <div class="mb-5 mt-10">
          <sl-skeleton
            class="block h-6 max-w-[16ch] py-4"
            effect="sheen"
          ></sl-skeleton>
        </div>
        <btrix-collections-grid></btrix-collections-grid>
      `,
    )}
  `;

  private renderPreviewBanner() {
    return html`
      <!-- TODO consolidate with btrix-org-status-banner -->
      <div class="border-b bg-slate-100 py-5">
        <div class="mx-auto box-border w-full max-w-screen-desktop px-3">
          <sl-alert variant="primary" open>
            <sl-icon slot="icon" name="eye-fill"></sl-icon>
            <strong class="font-semibold">
              ${msg("This is a private preview of your org's profile page")}
            </strong>
            <p>
              ${msg(
                "Update your org's profile settings to make this page visible to anyone on the internet.",
              )}
              ${this.appState.isAdmin
                ? html`
                    <br />
                    <a
                      href="${this.navigate.orgBasePath}/settings"
                      class="text-blue-500 hover:text-blue-600"
                      @click=${this.navigate.link}
                    >
                      ${msg("Go to Settings")}
                    </a>
                  `
                : nothing}
            </p>
          </sl-alert>
        </div>
      </div>
    `;
  }

  private renderProfile({ org, collections }: PublicOrgCollections) {
    return html`
      ${this.isPrivatePreview ? this.renderPreviewBanner() : nothing}
      ${page(
        {
          title: org.name,
          suffix: org.verified
            ? html`<btrix-verified-badge class="mb-0.5"></btrix-verified-badge>`
            : nothing,
          actions: when(
            this.canEditOrg,
            () =>
              html`<sl-tooltip content=${msg("Edit org profile")}>
                <sl-icon-button
                  href="${this.navigate.orgBasePath}/settings"
                  class="size-8 text-base"
                  name="pencil"
                  @click=${this.navigate.link}
                ></sl-icon-button>
              </sl-tooltip>`,
          ),
          secondary: html`
            ${when(
              org.description,
              (description) => html`
                <div class="text-pretty text-stone-600">${description}</div>
              `,
            )}
            ${when(org.url, (urlStr) => {
              let url: URL;
              try {
                url = new URL(urlStr);
              } catch {
                return nothing;
              }

              return html`
                <div
                  class="flex items-center gap-1.5 text-pretty text-neutral-700"
                >
                  <sl-icon
                    name="globe2"
                    class="size-4 text-stone-400"
                    label=${msg("Website")}
                  ></sl-icon>
                  <a
                    class="font-medium leading-none text-stone-500 transition-colors hover:text-stone-600"
                    href="${url.href}"
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                  >
                    ${url.href.split("//")[1].replace(/\/$/, "")}
                  </a>
                </div>
              `;
            })}
          `,
        },
        () => this.renderCollections(collections),
      )}
    `;
  }

  private renderCollections(collections: PublicOrgCollections["collections"]) {
    return html`
      <header class="mb-3 flex items-center justify-between lg:mt-7">
        ${pageHeading({
          content: msg("Collections"),
        })}
        ${when(
          this.canEditOrg,
          () =>
            html`<sl-tooltip content=${msg("Manage collections")}>
              <sl-icon-button
                href=${`${this.navigate.orgBasePath}/collections`}
                class="size-8 text-base"
                name="gear"
                @click=${this.navigate.link}
              ></sl-icon-button>
            </sl-tooltip>`,
        )}
      </header>
      <div class="flex-1 pb-16">
        <btrix-collections-grid
          slug=${this.slug || ""}
          .collections=${collections}
        ></btrix-collections-grid>
      </div>
    `;
  }

  private renderSignUpCta(org: PublicOrgCollections["org"]) {
    const { signUpUrl } = this.appState.settings || {};

    if (!signUpUrl) return;

    return html`
      <div class="w-full border-y p-6 px-3 text-center text-neutral-500">
        <p>
          ${when(
            this.orgCollections.value,
            () => html`
              <span>
                ${msg(str`${org.name} is web archiving with Browsertrix.`)}
              </span>
              <br />
            `,
          )}
          <span>${msg("Do you have web archives to share?")}</span>
          <btrix-link href=${signUpUrl} variant="primary">
            ${msg("Get started with Browsertrix")}
          </btrix-link>
        </p>
      </div>
    `;
  }

  private renderError() {
    return html`
      <div class="flex flex-1 items-center justify-center p-12">
        <btrix-not-found></btrix-not-found>
      </div>
    `;
  }

  private async fetchCollections({
    slug,
  }: {
    slug: string;
  }): Promise<PublicOrgCollections | void> {
    const resp = await fetch(`/api/public/orgs/${slug}/collections`, {
      headers: { "Content-Type": "application/json" },
    });

    switch (resp.status) {
      case 200:
        return (await resp.json()) as PublicOrgCollections;
      case 404: {
        if (this.authState) {
          // Use authenticated org data to render preview
          const orgProfile = await this.getUserOrg();

          if (orgProfile) {
            this.isPrivatePreview = true;

            return orgProfile;
          }
        }
        throw resp.status;
      }
      default:
        throw resp.status;
    }
  }

  private async getUserOrg(): Promise<PublicOrgCollections | null> {
    try {
      const userInfo = this.userInfo || (await this.api.fetch("/users/me"));
      const userOrg = userInfo?.orgs.find((org) => org.slug === this.slug);

      if (!userOrg) {
        return null;
      }

      const org = await this.api.fetch<OrgData>(`/orgs/${userOrg.id}`);

      return {
        org: {
          name: org.name,
          description: org.publicDescription || "",
          url: org.publicUrl || "",
          verified: false, // TODO
        },
        collections: [], // TODO
      };
    } catch {
      return null;
    }
  }
}