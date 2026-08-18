import type {
  AnchorHTMLAttributes,
  MouseEvent as ReactMouseEvent,
} from "react";

type AppLinkProps = AnchorHTMLAttributes<HTMLAnchorElement>;

export function navigateToAppRoute(href: string) {
  const nextUrl = new URL(href, window.location.href);

  if (nextUrl.origin !== window.location.origin) {
    return false;
  }

  const currentLocation = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const nextLocation = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;

  if (currentLocation === nextLocation) {
    return true;
  }

  window.history.pushState(null, "", nextLocation);
  window.dispatchEvent(new window.PopStateEvent("popstate"));
  return true;
}

function shouldUseNativeNavigation(
  event: ReactMouseEvent<HTMLAnchorElement>,
  download: string | boolean | undefined,
  target: string | undefined,
) {
  return (
    event.defaultPrevented ||
    Boolean(download) ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    (target !== undefined && target !== "_self")
  );
}

export function AppLink({
  download,
  href,
  onClick,
  target,
  ...props
}: AppLinkProps) {
  function handleClick(event: ReactMouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (!href || shouldUseNativeNavigation(event, download, target)) {
      return;
    }

    if (navigateToAppRoute(href)) {
      event.preventDefault();
    }
  }

  return (
    <a
      {...props}
      download={download}
      href={href}
      onClick={handleClick}
      target={target}
    />
  );
}
