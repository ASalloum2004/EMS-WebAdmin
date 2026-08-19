import type { CSSProperties } from "react";
import {
  announcementsIcon,
  companiesIcon,
  dashboardIcon,
  managementsIcon,
  notificationIcon,
  ordersServicesIcon,
  profileIcon,
  reportsIcon,
  visitorsIcon,
  volunteersIcon,
} from "../../../assets/AdminSideBar";
import { useI18n, type I18nDictionary } from "../../../i18n";
import { navigateToAppRoute } from "../../../router/AppLink";
import "./AdminSidebar.scss";

type AdminSidebarItem = {
  href: string;
  icon: string;
  labelKey: keyof I18nDictionary["layout"]["sidebar"];
};

interface AdminSidebarProps {
  adminName: string;
}

const sidebarItems: AdminSidebarItem[] = [
  {
    href: "/dashboard",
    icon: dashboardIcon,
    labelKey: "dashboard",
  },
  {
    href: "/orders",
    icon: ordersServicesIcon,
    labelKey: "ordersServices",
  },
  {
    href: "/companies",
    icon: companiesIcon,
    labelKey: "companies",
  },
  {
    href: "/visitors",
    icon: visitorsIcon,
    labelKey: "visitors",
  },
  {
    href: "/volunteers",
    icon: volunteersIcon,
    labelKey: "volunteers",
  },
  {
    href: "/notifications",
    icon: notificationIcon,
    labelKey: "notification",
  },
  {
    href: "/announcements",
    icon: announcementsIcon,
    labelKey: "announcements",
  },
  {
    href: "/reports",
    icon: reportsIcon,
    labelKey: "reports",
  },
  {
    href: "/management",
    icon: managementsIcon,
    labelKey: "management",
  },
  {
    href: "/profile",
    icon: profileIcon,
    labelKey: "profile",
  },
];

function isActivePath(href: string) {
  return window.location.pathname === href;
}

function createIconStyle(icon: string) {
  return {
    "--icon-url": `url("${icon}")`,
  } as CSSProperties;
}

export function AdminSidebar({ adminName }: AdminSidebarProps) {
  const { t } = useI18n();

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand">
        <h2>{t.layout.sidebar.brandName}</h2>
        <p>{t.layout.sidebar.brandSubtitle}</p>
      </div>

      <nav
        className="admin-sidebar__nav"
        aria-label={t.layout.sidebar.navigationAriaLabel}
      >
        {sidebarItems.map((item) => {
          const isActive = isActivePath(item.href);

          return (
                        <button
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "admin-sidebar__link admin-sidebar__link--active"
                  : "admin-sidebar__link"
              }
              key={item.href}
              onClick={() => navigateToAppRoute(item.href)}
              type="button"
            >
              <span
                className="admin-sidebar__icon"
                style={createIconStyle(item.icon)}
                aria-hidden="true"
              />

              <span>{t.layout.sidebar[item.labelKey]}</span>
            </button>

          );
        })}
      </nav>

      <div className="admin-sidebar__user">
        <span
          className="admin-sidebar__user-icon"
          style={createIconStyle(profileIcon)}
          aria-hidden="true"
        />

        <span>{adminName}</span>
      </div>
    </aside>
  );
}

