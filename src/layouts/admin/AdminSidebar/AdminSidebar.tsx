import type { CSSProperties } from "react";
import {
  announcementsIcon,
  companiesIcon,
  managementsIcon,
  notificationIcon,
  ordersServicesIcon,
  profileIcon,
  reportsIcon,
  visitorsIcon,
} from "../../../assets/AdminSideBar";
import "./AdminSidebar.scss";

type AdminSidebarItem = {
  label: string;
  href: string;
  icon: string;
};

const sidebarItems: AdminSidebarItem[] = [
  {
    label: "Orders & Services",
    href: "/orders",
    icon: ordersServicesIcon,
  },
  {
    label: "Companies",
    href: "/companies",
    icon: companiesIcon,
  },
  {
    label: "Visitors",
    href: "/visitors",
    icon: visitorsIcon,
  },
  {
    label: "Notification",
    href: "/notifications",
    icon: notificationIcon,
  },
  {
    label: "Announcements",
    href: "/announcements",
    icon: announcementsIcon,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: reportsIcon,
  },
  {
    label: "Management",
    href: "/mangement",
    icon: managementsIcon,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: profileIcon,
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


export function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand">
        <h2>Damascus Fair</h2>
        <p>Admin portal</p>
      </div>

      <nav className="admin-sidebar__nav" aria-label="Admin navigation">
        {sidebarItems.map((item) => {
          const isActive = isActivePath(item.href);

          return (
            <a
              key={item.href}
              href={item.href}
              className={
                isActive
                  ? "admin-sidebar__link admin-sidebar__link--active"
                  : "admin-sidebar__link"
              }
            >
              <span
                className="admin-sidebar__icon"
                style={createIconStyle(item.icon)}
                aria-hidden="true"
              />

              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>

      <div className="admin-sidebar__user">
        <span
          className="admin-sidebar__user-icon"
          style={createIconStyle(profileIcon)}
          aria-hidden="true"
        />

        <span>Alex Mercer</span>
      </div>
    </aside>
  );
}
