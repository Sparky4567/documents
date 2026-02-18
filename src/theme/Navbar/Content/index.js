import React from 'react';
import clsx from 'clsx';
import {
    useThemeConfig,
    ErrorCauseBoundary,
    ThemeClassNames,
} from '@docusaurus/theme-common';
import {
    splitNavbarItems,
    useNavbarMobileSidebar,
} from '@docusaurus/theme-common/internal';
import NavbarItem from '@theme/NavbarItem';
import NavbarColorModeToggle from '@theme/Navbar/ColorModeToggle';
import SearchBar from '@theme/SearchBar';
import NavbarMobileSidebarToggle from '@theme/Navbar/MobileSidebar/Toggle';
import NavbarLogo from '@theme/Navbar/Logo';
import NavbarSearch from '@theme/Navbar/Search';
// Google Translate removed: no BrowserOnly or GoogleTranslate imports

import styles from '@docusaurus/theme-classic/lib/theme/Navbar/Content/styles.module.css';

function useNavbarItems() {
    return useThemeConfig().navbar.items;
}

function NavbarItems({ items }) {
    return (
        <>
            {items.map((item, i) => (
                <ErrorCauseBoundary
                    key={i}
                    onError={(error) =>
                        new Error(
                            `A theme navbar item failed to render.\nPlease double-check the following navbar item (themeConfig.navbar.items) of your Docusaurus config:\n${JSON.stringify(item, null, 2)}`,
                            { cause: error },
                        )
                    }>
                    <NavbarItem {...item} />
                </ErrorCauseBoundary>
            ))}
        </>
    );
}

export default function NavbarContent() {
    const mobileSidebar = useNavbarMobileSidebar();
    const items = useNavbarItems();
    const [leftItems, rightItems] = splitNavbarItems(items);
    const searchBarItem = items.find((item) => item.type === 'search');

    return (
        <div className="navbar__inner">
            <div className={clsx(ThemeClassNames.layout.navbar.containerLeft, 'navbar__items')}>
                {!mobileSidebar.disabled && <NavbarMobileSidebarToggle />}
                <NavbarLogo />
                <NavbarItems items={leftItems} />
            </div>
            <div className={clsx(ThemeClassNames.layout.navbar.containerRight, 'navbar__items navbar__items--right')}>
                <NavbarItems items={rightItems} />
                <NavbarColorModeToggle className={styles.colorModeToggle} />
                {!searchBarItem && (
                    <NavbarSearch>
                        <SearchBar />
                    </NavbarSearch>
                )}
                {/* Google Translate widget removed */}
            </div>
        </div>
    );
}
