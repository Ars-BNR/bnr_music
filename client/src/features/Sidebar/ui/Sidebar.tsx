"use client";

import { useEffect, useState } from "react";
import {
  Grid2X2,
  House,
  ListMusic,
  LogOut,
  Menu,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover";
import AuthStore from "@/shared/store/auth";
import useCollectionStore from "@/shared/store/collection";
import { FleurDeLis } from "@/shared/ui/brand";
import stl from "../styles/Sidebar.module.scss";

const primaryLinks = [
  { href: "/", icon: House, label: "Главная" },
  { href: "/category", icon: Grid2X2, label: "Категории" },
  { href: "/authors", icon: UsersRound, label: "Артисты" },
] as const;

type NavigationMode = "desktop" | "drawer";

const isCurrentPath = (pathname: string, href: string) =>
  href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const logout = AuthStore((state) => state.logout);
  const { userPlaylist, getUserPlaylists } = useCollectionStore();
  const [collectionId, setCollectionId] = useState<number | null>(null);
  const [playlistsOpen, setPlaylistsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRailPlaylistOpen, setIsRailPlaylistOpen] = useState(false);
  const isPlaylistRoute = pathname.startsWith("/playlist/");

  useEffect(() => {
    const value = Number(localStorage.getItem("collection"));
    setCollectionId(Number.isInteger(value) && value > 0 ? value : null);
  }, []);

  useEffect(() => {
    if (collectionId !== null && userPlaylist.length === 0) {
      void getUserPlaylists(collectionId, { limit: 4, offset: 0 });
    }
  }, [collectionId, getUserPlaylists, userPlaylist.length]);

  useEffect(() => {
    if (isPlaylistRoute) setPlaylistsOpen(true);
  }, [isPlaylistRoute]);

  const closeDrawer = () => setIsDrawerOpen(false);

  const handleLogout = async () => {
    closeDrawer();
    await logout(router);
  };

  const renderBrand = (compact = false, onNavigate?: () => void) => (
    <Link
      href="/"
      className={compact ? stl.compactBrand : stl.brand}
      aria-label="BNR — Be Natural Rare, главная"
      onClick={onNavigate}
    >
      <FleurDeLis aria-hidden="true" className={compact ? stl.compactFleur : stl.brandFleur} />
      {!compact && (
        <span className={stl.brandCopy}>
          <span className={stl.brandName}>BNR</span>
          <span className={stl.brandMotto}>Be Natural Rare</span>
        </span>
      )}
    </Link>
  );

  const renderPlaylistLinks = (onNavigate?: () => void, className = stl.playlistLinks) => (
    <ul className={className}>
      {userPlaylist.length > 0 ? (
        <>
          {userPlaylist.map((playlist) => {
            const isActive = pathname === `/playlist/${playlist.id}`;
            return (
              <li key={playlist.id}>
                <Link
                  href={`/playlist/${playlist.id}`}
                  className={stl.playlistLink}
                  aria-current={isActive ? "page" : undefined}
                  data-active={isActive || undefined}
                  onClick={onNavigate}
                >
                  <span className={stl.playlistName}>{playlist.name}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <Link href="/collection/playlist" className={stl.allPlaylistsLink} onClick={onNavigate}>
              Все плейлисты
            </Link>
          </li>
        </>
      ) : (
        <li>
          <Link href="/collection/playlist" className={stl.allPlaylistsLink} onClick={onNavigate}>
            Создать плейлист
          </Link>
        </li>
      )}
    </ul>
  );

  const renderNavigation = (mode: NavigationMode, onNavigate?: () => void) => {
    const isDrawer = mode === "drawer";

    return (
      <nav
        className={`${stl.panel} ${isDrawer ? stl.drawerPanel : stl.desktopPanel}`}
        aria-label="Основная навигация"
      >
        <FleurDeLis aria-hidden="true" className={stl.panelWatermark} data-testid="sidebar-fleur" />
        <span aria-hidden="true" className={`${stl.corner} ${stl.cornerTop}`} />
        <span aria-hidden="true" className={`${stl.corner} ${stl.cornerBottom}`} />

        <div className={stl.panelHeader}>{renderBrand(false, onNavigate)}</div>

        <div className={stl.navigationBody}>
          <div className={stl.primaryLinks}>
            {primaryLinks.map(({ href, icon: Icon, label }) => {
              const isActive = isCurrentPath(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={stl.navItem}
                  aria-current={isActive ? "page" : undefined}
                  data-active={isActive || undefined}
                  onClick={onNavigate}
                >
                  <Icon aria-hidden="true" className={stl.navIcon} />
                  <span>{label}</span>
                  <span aria-hidden="true" className={stl.activeMarker} />
                </Link>
              );
            })}
          </div>

          <div className={stl.sectionHeading}>
            <FleurDeLis aria-hidden="true" />
            <span>Библиотека</span>
          </div>

          <Accordion
            type="single"
            collapsible
            value={playlistsOpen ? "playlists" : ""}
            onValueChange={(value) => setPlaylistsOpen(value === "playlists")}
            className={stl.playlistAccordion}
          >
            <AccordionItem value="playlists" className={stl.playlistAccordionItem}>
              <AccordionTrigger
                className={stl.playlistTrigger}
                data-active={isPlaylistRoute || undefined}
              >
                <span className={stl.playlistTriggerLabel}>
                  <ListMusic aria-hidden="true" className={stl.navIcon} />
                  <span>Плейлисты</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className={stl.playlistContent}>
                {renderPlaylistLinks(onNavigate)}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <button type="button" onClick={handleLogout} className={stl.logout}>
          <LogOut aria-hidden="true" className={stl.navIcon} />
          <span>Выход</span>
        </button>
      </nav>
    );
  };

  return (
    <>
      <aside className={stl.desktopShell} data-testid="sidebar-desktop">
        {renderNavigation("desktop")}
      </aside>

      <aside className={stl.railShell} data-testid="sidebar-rail">
        <nav className={stl.railPanel} aria-label="Основная навигация">
          {renderBrand(true)}

          <div className={stl.railLinks}>
            {primaryLinks.map(({ href, icon: Icon, label }) => {
              const isActive = isCurrentPath(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={stl.railControl}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={label}
                  data-active={isActive || undefined}
                >
                  <Icon aria-hidden="true" className={stl.navIcon} />
                  <span className={stl.railTooltip} role="tooltip">
                    {label}
                  </span>
                </Link>
              );
            })}

            <Popover open={isRailPlaylistOpen} onOpenChange={setIsRailPlaylistOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={stl.railControl}
                  aria-label="Плейлисты"
                  aria-expanded={isRailPlaylistOpen}
                  data-active={isPlaylistRoute || undefined}
                >
                  <ListMusic aria-hidden="true" className={stl.navIcon} data-icon="inline-start" />
                  <span className={stl.railTooltip} role="tooltip">
                    Плейлисты
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className={stl.playlistPopover} side="right" align="start" aria-label="Плейлисты">
                <p className={stl.popoverTitle}>Плейлисты</p>
                {renderPlaylistLinks(() => setIsRailPlaylistOpen(false), stl.popoverPlaylistLinks)}
              </PopoverContent>
            </Popover>
          </div>

          <button type="button" onClick={handleLogout} className={stl.railControl} aria-label="Выход">
            <LogOut aria-hidden="true" className={stl.navIcon} />
            <span className={stl.railTooltip} role="tooltip">
              Выход
            </span>
          </button>
        </nav>
      </aside>

      <div className={stl.mobileHeader} data-testid="sidebar-mobile-header">
        {renderBrand(true)}
        <Dialog open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className={stl.mobileMenuButton} aria-label="Открыть навигацию">
              <Menu aria-hidden="true" data-icon="inline-start" />
            </Button>
          </DialogTrigger>
          <DialogContent
            showCloseButton={false}
            className={`!inset-y-0 !left-0 !top-0 !h-dvh !w-[min(320px,calc(100vw-24px))] !max-w-none !translate-x-0 !translate-y-0 !rounded-none !p-0 ${stl.mobileDrawer}`}
          >
            <DialogHeader className="sr-only">
              <DialogTitle>Основная навигация</DialogTitle>
            </DialogHeader>
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="icon" className={stl.drawerClose} aria-label="Закрыть навигацию">
                <X aria-hidden="true" data-icon="inline-start" />
              </Button>
            </DialogClose>
            {renderNavigation("drawer", closeDrawer)}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Sidebar;
